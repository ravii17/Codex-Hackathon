import { dbGet, dbRun } from '../db.js';
import { runIntake } from './intake.js';
import { runClassification } from './classifier.js';
import { retrieveContext } from './context.js';
import { analyzeEvidence } from './evidence.js';
import { calculateRiskAndConfidence } from './riskEngine.js';
import { generateRecommendation } from './recommendation.js';
import { MockAIProvider } from './providers/MockAIProvider.js';
import { CASE_STATUS } from './stateMachine.js';

// Helper to log audit events into the database
export const logAuditEvent = async (caseId, action, actorType, actorId = null, metadata = {}) => {
  const id = `${action}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  await dbRun(
    `INSERT INTO audit_events (id, timestamp, actorType, actorId, caseId, action, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, new Date().toISOString(), actorType, actorId, caseId, action, JSON.stringify(metadata)]
  );
};

/**
 * Runs the complete Resolve AI investigation workflow on a dispute case.
 * @param {string} caseId 
 * @returns {Promise<object>} Resulting case record
 */
export const investigateCase = async (caseId) => {
  console.log(`[ORCHESTRATOR] Starting investigation for case: ${caseId}`);
  
  // 1. Load Case
  const caseRecord = await dbGet('SELECT * FROM cases WHERE id = ?', [caseId]);
  if (!caseRecord) {
    throw new Error(`Case ${caseId} not found`);
  }

  // 2. Load Dispute
  const disputeRecord = await dbGet('SELECT * FROM disputes WHERE id = ?', [caseRecord.disputeId]);
  if (!disputeRecord) {
    throw new Error(`Dispute associated with case ${caseId} not found`);
  }

  // 3. Load Transaction
  const transactionRecord = await dbGet('SELECT * FROM transactions WHERE id = ?', [disputeRecord.transactionId]);
  if (!transactionRecord) {
    throw new Error(`Transaction associated with dispute ${disputeRecord.id} not found`);
  }

  // Transition status to AI_INVESTIGATING
  await dbRun('UPDATE cases SET status = ?, updatedAt = ? WHERE id = ?', [
    CASE_STATUS.AI_INVESTIGATING,
    new Date().toISOString(),
    caseId
  ]);
  await logAuditEvent(caseId, 'INVESTIGATION_STARTED', 'AI', 'RESOLVE-AI', { provider: 'mock' });

  // Instantiate AI Provider (Extensible for OpenAIProvider later)
  const provider = new MockAIProvider();

  try {
    // 4. Run Intake
    console.log(`[ORCHESTRATOR] Running intake...`);
    const intakeContext = runIntake(caseRecord, disputeRecord, transactionRecord);
    await logAuditEvent(caseId, 'INTAKE_COMPLETED', 'SYSTEM', 'RESOLVE-SYSTEM', {
      transactionId: intakeContext.transactionId,
      disputeReason: intakeContext.disputeReason
    });

    // 5. Run Classification
    console.log(`[ORCHESTRATOR] Running classification...`);
    const classificationObj = await runClassification(provider, intakeContext);
    await logAuditEvent(caseId, 'CASE_CLASSIFIED', 'AI', 'RESOLVE-AI', {
      classification: classificationObj.classification,
      reason: classificationObj.reason
    });

    // 6. Retrieve Context
    console.log(`[ORCHESTRATOR] Retrieving context database signals...`);
    const contextSignals = await retrieveContext(intakeContext);
    await logAuditEvent(caseId, 'CONTEXT_RETRIEVED', 'SYSTEM', 'RESOLVE-SYSTEM', {
      recentTransactionsCount: contextSignals.recentTransactionsCount,
      matchingRefundFound: contextSignals.matchingRefundFound,
      possibleDuplicateFound: contextSignals.possibleDuplicateFound
    });

    // 7. Analyze Evidence
    console.log(`[ORCHESTRATOR] Analyzing evidence facts...`);
    const evidenceObj = await analyzeEvidence(provider, intakeContext);
    await logAuditEvent(caseId, 'EVIDENCE_ANALYZED', 'AI', 'RESOLVE-AI', {
      evidenceFilesCount: evidenceObj.evidenceFilesCount,
      evidenceFactsCount: evidenceObj.evidenceFacts.length
    });

    // 8. Calculate Risk + Confidence
    console.log(`[ORCHESTRATOR] Calculating risk and confidence...`);
    const riskObj = calculateRiskAndConfidence(intakeContext, classificationObj, contextSignals, evidenceObj);
    await logAuditEvent(caseId, 'RISK_ASSESSED', 'AI', 'RESOLVE-AI', {
      riskLevel: riskObj.riskLevel,
      confidenceScore: riskObj.confidenceScore
    });

    // 9. Generate Recommendation
    console.log(`[ORCHESTRATOR] Generating recommendation...`);
    const recObj = generateRecommendation(intakeContext, classificationObj, riskObj, evidenceObj);
    await logAuditEvent(caseId, 'RECOMMENDATION_GENERATED', 'AI', 'RESOLVE-AI', {
      recommendedAction: recObj.recommendedAction
    });

    // 10. Persist complete investigation result in SQLite
    const investigatedAt = new Date().toISOString();
    await dbRun(`
      INSERT OR REPLACE INTO investigation_results (
        caseId, classification, reason, riskLevel, confidenceScore, findings, signals, missingInformation, recommendedAction, recommendationExplanation, provider, investigatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      caseId,
      classificationObj.classification,
      classificationObj.reason,
      riskObj.riskLevel,
      riskObj.confidenceScore,
      JSON.stringify(recObj.findings),
      JSON.stringify(riskObj.signals),
      JSON.stringify(recObj.missingInformation),
      recObj.recommendedAction,
      recObj.recommendationExplanation,
      'mock',
      investigatedAt
    ]);

    // 11. Set case status to AI_READY
    await dbRun('UPDATE cases SET status = ?, updatedAt = ? WHERE id = ?', [
      CASE_STATUS.AI_READY,
      investigatedAt,
      caseId
    ]);
    await logAuditEvent(caseId, 'INVESTIGATION_COMPLETED', 'SYSTEM', 'RESOLVE-SYSTEM', { status: CASE_STATUS.AI_READY });

    console.log(`[ORCHESTRATOR] Investigation completed successfully for case ${caseId}`);
    return { success: true, caseId };

  } catch (error) {
    console.error(`[ORCHESTRATOR] Investigation failed for case ${caseId}:`, error.message);
    
    // Fallback: Transition to MANUAL_REVIEW on failure
    await dbRun('UPDATE cases SET status = ?, updatedAt = ? WHERE id = ?', [
      CASE_STATUS.MANUAL_REVIEW,
      new Date().toISOString(),
      caseId
    ]);

    await logAuditEvent(caseId, 'INVESTIGATION_FAILED', 'SYSTEM', 'RESOLVE-SYSTEM', {
      error: error.message
    });

    return { success: false, caseId, error: error.message };
  }
};
