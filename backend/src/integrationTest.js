import assert from 'node:assert';
import { dbRun } from './db.js';

const BACKEND_URL = 'http://127.0.0.1:4000';

const runIntegrationTest = async () => {
  console.log('==================================================');
  console.log('RESOLVE AI - END-TO-END INTEGRATION TEST');
  console.log('==================================================\n');

  try {
    // Programmatic reset for TX-1003 to ensure repeatable test runs
    console.log('[RESET] Cleaning up previous test data for TX-1003...');
    await dbRun("UPDATE transactions SET status = 'Posted', disputeId = NULL WHERE id = 'TX-1003'");
    await dbRun("DELETE FROM cases WHERE disputeId IN (SELECT id FROM disputes WHERE transactionId = 'TX-1003')");
    await dbRun("DELETE FROM disputes WHERE transactionId = 'TX-1003'");
    await dbRun("DELETE FROM evidence_files WHERE disputeId NOT IN (SELECT id FROM disputes)");
    await dbRun("DELETE FROM investigation_results WHERE caseId NOT IN (SELECT id FROM cases)");
    await dbRun("DELETE FROM audit_events WHERE caseId NOT IN (SELECT id FROM cases)");
    console.log('[RESET] Cleanup complete.\n');

    // 1. Authorization Security checks
    console.log('[TEST] 1. Checking investigator role authorization restrictions...');
    const forbiddenRes = await fetch(`${BACKEND_URL}/api/investigator/cases`, {
      headers: {
        'X-User-Role': 'cardmember',
        'X-Customer-Id': 'CUST-1008'
      }
    });
    assert.strictEqual(forbiddenRes.status, 403);
    console.log('[PASS] Card Member denied access to investigator routes.');

    const allowedRes = await fetch(`${BACKEND_URL}/api/investigator/cases`, {
      headers: {
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      }
    });
    assert.strictEqual(allowedRes.status, 200);
    const allowedData = await allowedRes.json();
    assert.strictEqual(allowedData.ok, true);
    console.log('[PASS] Investigator successfully authorized.');

    // 2. Metrics SQLite Endpoint checks
    console.log('[TEST] 2. Retrieving case metrics...');
    const metricsRes = await fetch(`${BACKEND_URL}/api/investigator/metrics`, {
      headers: {
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      }
    });
    assert.strictEqual(metricsRes.status, 200);
    const metricsData = await metricsRes.json();
    assert.strictEqual(metricsData.ok, true);
    assert.ok(metricsData.metrics.openCases >= 0);
    assert.ok(metricsData.metrics.highPriority >= 0);
    assert.ok(metricsData.metrics.aiReady >= 0);
    assert.ok(metricsData.metrics.underReview >= 0);
    console.log('[PASS] Real-time metrics successfully retrieved.');

    // 3. Submit a new dispute
    console.log('[TEST] 3. Submitting dispute for transaction TX-1003...');
    const disputePayload = {
      transactionId: 'TX-1003', // Apple Store, $1299.00
      reason: 'Refund not received',
      mappedCode: '4554',
      questionnaire: {
        contactedMerchant: 'Yes',
        additionalInfo: 'I cancelled my booking and the merchant said a refund was issued, but I haven\'t received it.'
      },
      completenessScore: 82,
      customerName: 'David K.',
      evidenceFiles: [
        { name: 'cancellation_email_LH-928.pdf', size: '1.2 MB', category: 'Merchant Email' }
      ]
    };

    const submitRes = await fetch(`${BACKEND_URL}/api/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'cardmember',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify(disputePayload)
    });

    const submitData = await submitRes.json();
    assert.strictEqual(submitRes.status, 200);
    assert.strictEqual(submitData.ok, true);
    assert.ok(submitData.disputeId);
    assert.ok(submitData.caseId);
    console.log(`[PASS] Dispute created. Case ID: ${submitData.caseId}`);

    // Wait for background AI investigation orchestrator to run
    console.log('[TEST] 4. Waiting for automated Resolve AI investigation to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify status is AI_READY
    const detailsRes = await fetch(`${BACKEND_URL}/api/investigator/cases/${submitData.caseId}/investigation`, {
      headers: {
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      }
    });
    const detailsData = await detailsRes.json();
    assert.strictEqual(detailsData.case.status, 'AI_READY');
    console.log('[PASS] Case successfully compiled in AI_READY status.');

    // 4. Start Review Action
    console.log('[TEST] 5. Investigator opening case to start review (AI_READY -> UNDER_REVIEW)...');
    const reviewRes = await fetch(`${BACKEND_URL}/api/cases/${submitData.caseId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify({ action: 'start-review' })
    });
    const reviewData = await reviewRes.json();
    assert.strictEqual(reviewRes.status, 200);
    assert.strictEqual(reviewData.ok, true);
    assert.strictEqual(reviewData.status, 'UNDER_REVIEW');
    console.log('[PASS] Case successfully transitioned to UNDER_REVIEW.');

    // Duplicate Start Review check
    const repeatRes = await fetch(`${BACKEND_URL}/api/cases/${submitData.caseId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify({ action: 'start-review' })
    });
    const repeatData = await repeatRes.json();
    assert.strictEqual(repeatRes.status, 200);
    assert.strictEqual(repeatData.status, 'UNDER_REVIEW');
    console.log('[PASS] Repeated start review does not generate duplicate transition error.');

    // 5. Validation Check: Request Info / Escalate missing reason
    console.log('[TEST] 6. Verifying parameter validations for human review actions...');
    const badEscalateRes = await fetch(`${BACKEND_URL}/api/cases/${submitData.caseId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify({ action: 'escalate', reason: '' })
    });
    assert.strictEqual(badEscalateRes.status, 400);
    console.log('[PASS] Escalation action without reason successfully rejected.');

    // Escalate with reason
    const goodEscalateRes = await fetch(`${BACKEND_URL}/api/cases/${submitData.caseId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify({ action: 'escalate', reason: 'Conflicting transaction details need senior auditor review.' })
    });
    const goodEscalateData = await goodEscalateRes.json();
    assert.strictEqual(goodEscalateRes.status, 200);
    assert.strictEqual(goodEscalateData.status, 'ESCALATED');
    console.log('[PASS] Case successfully escalated with reason.');

    // 6. Invalid transition rejection (ESCALATED -> UNDER_REVIEW is illegal in stateMachine)
    console.log('[TEST] 7. Verifying invalid state transitions rejection...');
    const illegalRes = await fetch(`${BACKEND_URL}/api/cases/${submitData.caseId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify({ action: 'start-review' })
    });
    assert.strictEqual(illegalRes.status, 400);
    console.log('[PASS] Invalid transition correctly rejected by state machine.');

    // 7. Override options validation
    console.log('[TEST] 8. Verifying Override validations...');
    // Override without reason
    const badOverrideRes = await fetch(`${BACKEND_URL}/api/cases/${submitData.caseId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify({ action: 'override', targetAction: 'APPROVE', reason: ' ' })
    });
    assert.strictEqual(badOverrideRes.status, 400);
    console.log('[PASS] Override without reason rejected.');

    // Override with reason (Approve dispute)
    const goodOverrideRes = await fetch(`${BACKEND_URL}/api/cases/${submitData.caseId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'investigator',
        'X-Customer-Id': 'CUST-1008'
      },
      body: JSON.stringify({ action: 'override', targetAction: 'APPROVE', reason: 'Strong cancellation evidence matches transaction ledger. Approved.' })
    });
    const goodOverrideData = await goodOverrideRes.json();
    assert.strictEqual(goodOverrideRes.status, 200);
    assert.strictEqual(goodOverrideData.status, 'RESOLVED');
    console.log('[PASS] Override with reason successfully applied.');

    // 8. Confirm Cardmember status update and audit trail events
    console.log('[TEST] 9. Checking Card Member tracking update and audit trail events...');
    const verifyRes = await fetch(`${BACKEND_URL}/api/customer/cases/${submitData.caseId}`, {
      headers: {
        'X-User-Role': 'cardmember',
        'X-Customer-Id': 'CUST-1008'
      }
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.case.status, 'RESOLVED');
    
    const events = verifyData.case.auditTrail.map(e => e.action);
    assert.ok(events.includes('REVIEW_STARTED'));
    assert.ok(events.includes('CASE_ESCALATED'));
    assert.ok(events.includes('AI_RECOMMENDATION_OVERRIDDEN'));
    assert.ok(events.includes('CASE_RESOLVED'));
    console.log('[PASS] Card Member status updated to RESOLVED and all timeline events logged.');

    console.log('\n==================================================');
    console.log('INTEGRATION TEST SUCCESSFUL - ALL CHECKPOINTS PASSED');
    console.log('==================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n[FAIL] E2E Integration test failed:', err);
    process.exit(1);
  }
};

runIntegrationTest();
