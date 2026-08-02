import http from 'node:http';
import { config } from './config.js';
import { initializeDatabase, dbAll, dbGet, dbRun, seedDemoData } from './db.js';
import { investigateCase, logAuditEvent } from './investigation/orchestrator.js';
import { isValidTransition, CASE_STATUS } from './investigation/stateMachine.js';

// Initialize SQLite database
initializeDatabase()
  .then(() => console.log('[DATABASE] SQLite database initialized successfully'))
  .catch(err => console.error('[DATABASE] Database initialization failed:', err));

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.corsOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Role,X-Customer-Id'
  });
  res.end(JSON.stringify(body));
};

const getJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': config.corsOrigin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Role,X-Customer-Id'
    });
    res.end();
    return;
  }

  const role = req.headers['x-user-role'];
  const customerId = req.headers['x-customer-id'] || 'CUST-1008';

  try {
    // 1. Health check
    if (req.url === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        service: 'amex-resolve-ai-backend',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 2. GET Transactions
    if (req.url === '/api/transactions' && req.method === 'GET') {
      console.log(`Received customerId: ${customerId}`);
      const txs = await dbAll('SELECT * FROM transactions WHERE customerId = ?', [customerId]);
      console.log(`Transactions found: ${txs.length}`);
      // Convert SQLite 0/1 to boolean for the frontend compatibility
      const formattedTxs = txs.map(tx => ({
        ...tx,
        disputeEligible: tx.disputeEligible === 1
      }));
      sendJson(res, 200, { ok: true, transactions: formattedTxs });
      return;
    }

    // 3. GET Disputes/Cases for Customer
    if (req.url === '/api/customer/cases' && req.method === 'GET') {
      const cases = await dbAll(`
        SELECT c.id as caseId, c.status, c.createdAt, c.updatedAt, d.id as disputeId, d.reason, d.completenessScore, d.decisionExplanation, t.merchant, t.amount
        FROM cases c
        JOIN disputes d ON c.disputeId = d.id
        JOIN transactions t ON d.transactionId = t.id
        WHERE c.customerId = ?
      `, [customerId]);
      sendJson(res, 200, { ok: true, disputes: cases });
      return;
    }

    // 4. GET Customer Case Details
    const customerCaseMatch = req.url?.match(/^\/api\/customer\/cases\/([^/]+)$/);
    if (customerCaseMatch && req.method === 'GET') {
      const caseId = decodeURIComponent(customerCaseMatch[1]);
      const caseRecord = await dbGet('SELECT * FROM cases WHERE id = ? AND customerId = ?', [caseId, customerId]);
      if (!caseRecord) {
        sendJson(res, 404, { ok: false, error: 'Case not found' });
        return;
      }

      const disputeRecord = await dbGet('SELECT * FROM disputes WHERE id = ?', [caseRecord.disputeId]);
      const transactionRecord = await dbGet('SELECT * FROM transactions WHERE id = ?', [disputeRecord.transactionId]);
      const invResult = await dbGet('SELECT * FROM investigation_results WHERE caseId = ?', [caseId]);
      const auditTrail = await dbAll('SELECT * FROM audit_events WHERE caseId = ? ORDER BY timestamp ASC', [caseId]);

      // Do NOT expose riskLevel, confidenceScore, signals, or internal provider to customer UI
      const customerCaseDetails = {
        caseId: caseRecord.id,
        disputeId: caseRecord.disputeId,
        status: caseRecord.status,
        createdAt: caseRecord.createdAt,
        updatedAt: caseRecord.updatedAt,
        merchant: transactionRecord.merchant,
        amount: transactionRecord.amount,
        reason: disputeRecord.reason,
        completenessScore: disputeRecord.completenessScore,
        decisionExplanation: disputeRecord.decisionExplanation,
        submittedAt: disputeRecord.submittedAt,
        expectedResolution: disputeRecord.expectedResolution,
        questionnaire: JSON.parse(disputeRecord.questionnaire),
        investigation: invResult ? {
          caseId: invResult.caseId,
          classification: invResult.classification,
          findings: JSON.parse(invResult.findings),
          missingInformation: JSON.parse(invResult.missingInformation),
          recommendedAction: invResult.recommendedAction,
          recommendationExplanation: invResult.recommendationExplanation
        } : null,
        auditTrail: auditTrail.map(event => ({
          id: event.id,
          timestamp: event.timestamp,
          actorType: event.actorType,
          caseId: event.caseId,
          action: event.action,
          metadata: JSON.parse(event.metadata || '{}')
        }))
      };

      sendJson(res, 200, { ok: true, case: customerCaseDetails });
      return;
    }

    // 5. POST Create Dispute & Trigger Investigation
    if (req.url === '/api/disputes' && req.method === 'POST') {
      const body = await getJsonBody(req);
      const { transactionId, reason, mappedCode, questionnaire, completenessScore, customerName, evidenceFiles } = body;

      if (!transactionId || !reason) {
        sendJson(res, 400, { ok: false, error: 'Missing transactionId or reason' });
        return;
      }

      // Check if transaction is already disputed
      const tx = await dbGet('SELECT * FROM transactions WHERE id = ?', [transactionId]);
      if (!tx) {
        sendJson(res, 404, { ok: false, error: 'Transaction not found' });
        return;
      }
      if (tx.status === 'Disputed') {
        sendJson(res, 400, { ok: false, error: 'Transaction is already disputed' });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const disputeId = `AMEX-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const caseId = `CASE-${disputeId}`;

      // Insert dispute
      await dbRun(`
        INSERT INTO disputes (id, transactionId, customerId, reason, mappedCode, status, submittedAt, expectedResolution, questionnaire, completenessScore, customerName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        disputeId,
        transactionId,
        customerId,
        reason,
        mappedCode || '4000',
        'Submitted',
        today,
        '5 Business Days',
        JSON.stringify(questionnaire || {}),
        completenessScore || 0,
        customerName || 'Cardmember'
      ]);

      // Insert evidence files
      if (evidenceFiles && Array.isArray(evidenceFiles)) {
        for (let i = 0; i < evidenceFiles.length; i++) {
          const file = evidenceFiles[i];
          const fileId = `f-${Date.now()}-${i}`;
          await dbRun(`
            INSERT INTO evidence_files (id, disputeId, name, size, category, extractedData)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            fileId,
            disputeId,
            file.name,
            file.size || '0 KB',
            file.category || 'Other',
            JSON.stringify(file.extractedData || {})
          ]);
        }
      }

      // Update transaction status
      await dbRun("UPDATE transactions SET status = 'Disputed', disputeId = ? WHERE id = ?", [disputeId, transactionId]);

      // Create case in SUBMITTED state
      await dbRun(`
        INSERT INTO cases (id, disputeId, customerId, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        caseId,
        disputeId,
        customerId,
        CASE_STATUS.SUBMITTED,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      // Log initial case created event
      await logAuditEvent(caseId, 'CASE_CREATED', 'CUSTOMER', customerId, {
        merchant: tx.merchant,
        amount: tx.amount
      });

      // Send immediate success response
      sendJson(res, 200, { ok: true, disputeId, caseId });

      // Run investigation workflow in the background (asynchronous to user response)
      investigateCase(caseId).catch(err => {
        console.error('[SERVER] Async investigation failed:', err);
      });
      return;
    }

    // 5.5 GET Investigator Overview Metrics
    if (req.url === '/api/investigator/metrics' && req.method === 'GET') {
      if (role !== 'investigator') {
        sendJson(res, 403, { ok: false, error: 'Investigator access required' });
        return;
      }
      const openCases = await dbGet("SELECT COUNT(*) as count FROM cases WHERE status NOT IN ('RESOLVED')");
      const highPriority = await dbGet("SELECT COUNT(*) as count FROM cases c JOIN investigation_results r ON c.id = r.caseId WHERE r.riskLevel = 'HIGH' AND c.status NOT IN ('RESOLVED')");
      const aiReady = await dbGet("SELECT COUNT(*) as count FROM cases WHERE status = 'AI_READY'");
      const underReview = await dbGet("SELECT COUNT(*) as count FROM cases WHERE status = 'UNDER_REVIEW'");

      sendJson(res, 200, {
        ok: true,
        metrics: {
          openCases: openCases.count,
          highPriority: highPriority.count,
          aiReady: aiReady.count,
          underReview: underReview.count
        }
      });
      return;
    }

    // 6. GET Investigator Cases Queue
    if (req.url === '/api/investigator/cases' && req.method === 'GET') {
      if (role !== 'investigator') {
        sendJson(res, 403, { ok: false, error: 'Investigator access required' });
        return;
      }

      const cases = await dbAll(`
        SELECT c.id as caseId, c.status, c.createdAt, c.updatedAt, d.reason, t.merchant, t.amount, r.riskLevel, r.confidenceScore, r.recommendedAction, d.customerName
        FROM cases c
        JOIN disputes d ON c.disputeId = d.id
        JOIN transactions t ON d.transactionId = t.id
        LEFT JOIN investigation_results r ON c.id = r.caseId
        ORDER BY c.createdAt DESC
      `);
      sendJson(res, 200, { ok: true, cases });
      return;
    }

    // 7. GET Investigator Case Details including investigation result
    const investigatorCaseMatch = req.url?.match(/^\/api\/investigator\/cases\/([^/]+)\/investigation$/);
    if (investigatorCaseMatch && req.method === 'GET') {
      if (role !== 'investigator') {
        sendJson(res, 403, { ok: false, error: 'Investigator access required' });
        return;
      }

      const caseId = decodeURIComponent(investigatorCaseMatch[1]);
      const caseRecord = await dbGet('SELECT * FROM cases WHERE id = ?', [caseId]);
      if (!caseRecord) {
        sendJson(res, 404, { ok: false, error: 'Case not found' });
        return;
      }

      const disputeRecord = await dbGet('SELECT * FROM disputes WHERE id = ?', [caseRecord.disputeId]);
      const transactionRecord = await dbGet('SELECT * FROM transactions WHERE id = ?', [disputeRecord.transactionId]);
      const invResult = await dbGet('SELECT * FROM investigation_results WHERE caseId = ?', [caseId]);
      const auditTrail = await dbAll('SELECT * FROM audit_events WHERE caseId = ? ORDER BY timestamp ASC', [caseId]);
      const evidenceFiles = await dbAll('SELECT * FROM evidence_files WHERE disputeId = ?', [caseRecord.disputeId]);

      // Formulate complete details for Investigator UI
      const investigatorCaseDetails = {
        caseId: caseRecord.id,
        disputeId: caseRecord.disputeId,
        transactionId: disputeRecord.transactionId,
        customerId: caseRecord.customerId,
        status: caseRecord.status,
        createdAt: caseRecord.createdAt,
        updatedAt: caseRecord.updatedAt,
        merchant: transactionRecord.merchant,
        amount: transactionRecord.amount,
        transactionDate: transactionRecord.date,
        reason: disputeRecord.reason,
        mappedCode: disputeRecord.mappedCode,
        customerName: disputeRecord.customerName,
        submittedAt: disputeRecord.submittedAt,
        expectedResolution: disputeRecord.expectedResolution,
        questionnaire: JSON.parse(disputeRecord.questionnaire),
        evidenceFiles,
        investigation: invResult ? {
          classification: invResult.classification,
          reason: invResult.reason,
          riskLevel: invResult.riskLevel,
          confidenceScore: invResult.confidenceScore,
          findings: JSON.parse(invResult.findings),
          signals: JSON.parse(invResult.signals),
          missingInformation: JSON.parse(invResult.missingInformation),
          recommendedAction: invResult.recommendedAction,
          recommendationExplanation: invResult.recommendationExplanation,
          provider: invResult.provider,
          investigatedAt: invResult.investigatedAt
        } : null,
        auditTrail: auditTrail.map(event => ({
          id: event.id,
          timestamp: event.timestamp,
          actorType: event.actorType,
          actorId: event.actorId,
          caseId: event.caseId,
          action: event.action,
          metadata: JSON.parse(event.metadata || '{}')
        }))
      };

      sendJson(res, 200, { ok: true, case: investigatorCaseDetails });
      return;
    }

    // 8. POST Investigator Case Decision Actions
    const investigatorActionMatch = req.url?.match(/^\/api\/cases\/([^/]+)\/action$/);
    if (investigatorActionMatch && req.method === 'POST') {
      if (role !== 'investigator') {
        sendJson(res, 403, { ok: false, error: 'Investigator access required' });
        return;
      }

      const caseId = decodeURIComponent(investigatorActionMatch[1]);
      const body = await getJsonBody(req);
      const { action, reason, targetAction } = body; // action is 'approve', 'request-info', 'escalate', 'override', 'start-review'

      const caseRecord = await dbGet('SELECT * FROM cases WHERE id = ?', [caseId]);
      if (!caseRecord) {
        sendJson(res, 404, { ok: false, error: 'Case not found' });
        return;
      }

      let newStatus = null;
      let auditAction = null;

      if (action === 'start-review') {
        if (caseRecord.status === CASE_STATUS.UNDER_REVIEW) {
          sendJson(res, 200, { ok: true, status: caseRecord.status, message: 'Already under review' });
          return;
        }
        newStatus = CASE_STATUS.UNDER_REVIEW;
        auditAction = 'REVIEW_STARTED';
      } else if (action === 'approve') {
        newStatus = CASE_STATUS.RESOLVED;
        auditAction = 'RECOMMENDATION_APPROVED';
      } else if (action === 'request-info') {
        if (!reason || !reason.trim()) {
          sendJson(res, 400, { ok: false, error: 'Information request details are required' });
          return;
        }
        newStatus = CASE_STATUS.MORE_INFO_REQUIRED;
        auditAction = 'MORE_INFO_REQUESTED';
      } else if (action === 'escalate') {
        if (!reason || !reason.trim()) {
          sendJson(res, 400, { ok: false, error: 'Escalation reason is required' });
          return;
        }
        newStatus = CASE_STATUS.ESCALATED;
        auditAction = 'CASE_ESCALATED';
      } else if (action === 'override') {
        if (!targetAction) {
          sendJson(res, 400, { ok: false, error: 'Override target action is required' });
          return;
        }
        if (!reason || !reason.trim()) {
          sendJson(res, 400, { ok: false, error: 'Override reason is required' });
          return;
        }

        // Map targetAction to newStatus
        if (targetAction === 'APPROVE') {
          newStatus = CASE_STATUS.RESOLVED;
        } else if (targetAction === 'REQUEST_CUSTOMER_INFO' || targetAction === 'REQUEST_MERCHANT_EVIDENCE') {
          newStatus = CASE_STATUS.MORE_INFO_REQUIRED;
        } else if (targetAction === 'ESCALATE') {
          newStatus = CASE_STATUS.ESCALATED;
        } else if (targetAction === 'MANUAL_REVIEW') {
          newStatus = CASE_STATUS.MANUAL_REVIEW;
        } else {
          sendJson(res, 400, { ok: false, error: 'Invalid override target action' });
          return;
        }
        auditAction = 'AI_RECOMMENDATION_OVERRIDDEN';
      } else {
        sendJson(res, 400, { ok: false, error: 'Invalid action specified' });
        return;
      }

      // Check transition validity
      if (!isValidTransition(caseRecord.status, newStatus)) {
        sendJson(res, 400, {
          ok: false,
          error: `Invalid transition from ${caseRecord.status} to ${newStatus}`
        });
        return;
      }

      const now = new Date().toISOString();
      await dbRun('UPDATE cases SET status = ?, updatedAt = ? WHERE id = ?', [newStatus, now, caseId]);

      // Handle database state adjustments for resolutions and requests
      if (action === 'approve' || (action === 'override' && targetAction === 'APPROVE')) {
        await dbRun('UPDATE disputes SET status = ?, decisionExplanation = ? WHERE id = ?', [
          'Resolved',
          reason || 'Investigator approved dispute.',
          caseRecord.disputeId
        ]);
        // Re-enable transaction posting/credit resolution
        await dbRun("UPDATE transactions SET status = 'Posted' WHERE id = (SELECT transactionId FROM disputes WHERE id = ?)", [caseRecord.disputeId]);
      } else if (action === 'request-info' || (action === 'override' && (targetAction === 'REQUEST_CUSTOMER_INFO' || targetAction === 'REQUEST_MERCHANT_EVIDENCE'))) {
        await dbRun('UPDATE disputes SET status = ? WHERE id = ?', ['Evidence Gathering', caseRecord.disputeId]);
      }

      // Fetch previous AI recommendation for override logs
      const invResult = await dbGet('SELECT recommendedAction FROM investigation_results WHERE caseId = ?', [caseId]);
      const previousRecommendation = invResult ? invResult.recommendedAction : 'MANUAL_REVIEW';

      let eventMetadata = { reason: reason || 'Action taken by investigator.' };
      if (action === 'override') {
        eventMetadata = {
          reason: reason,
          previousRecommendation: previousRecommendation,
          newAction: targetAction
        };
      }

      await logAuditEvent(caseId, auditAction, 'INVESTIGATOR', 'INV-001', eventMetadata);
      if (action === 'approve' || (action === 'override' && targetAction === 'APPROVE')) {
        await logAuditEvent(caseId, 'CASE_RESOLVED', 'INVESTIGATOR', 'INV-001');
      }

      sendJson(res, 200, { ok: true, status: newStatus });
      return;
    }

    // 9. POST Trigger Investigation Workflow Directly
    const runInvestigationMatch = req.url?.match(/^\/api\/investigations\/([^/]+)\/run$/);
    if (runInvestigationMatch && req.method === 'POST') {
      if (role !== 'investigator') {
        sendJson(res, 403, { ok: false, error: 'Investigator access required' });
        return;
      }
      const caseId = decodeURIComponent(runInvestigationMatch[1]);
      const result = await investigateCase(caseId);
      if (result.success) {
        sendJson(res, 200, { ok: true, message: 'Investigation ran successfully' });
      } else {
        sendJson(res, 500, { ok: false, error: result.error });
      }
      return;
    }

    // 10. POST Safe Demo Reset & Re-seed
    if (req.url === '/api/admin/reset' && req.method === 'POST') {
      if (process.env.NODE_ENV === 'production') {
        sendJson(res, 403, { ok: false, error: 'Database reset is disabled in production environment.' });
        return;
      }
      try {
        await seedDemoData();
        sendJson(res, 200, { ok: true, message: 'Fictional demo database re-seeded successfully.' });
      } catch (err) {
        console.error('[Reset Error]:', err);
        sendJson(res, 500, { ok: false, error: 'Failed to reset database: ' + err.message });
      }
      return;
    }

    // Fallback 404
    sendJson(res, 404, { ok: false, error: 'Route not found' });

  } catch (error) {
    console.error('[SERVER] Internal Server Error:', error);
    sendJson(res, 500, { ok: false, error: 'Internal Server Error' });
  }
});

server.listen(config.port, () => {
  console.log(`[SERVER] Backend API listening on http://127.0.0.1:${config.port}`);
});
export default server;
