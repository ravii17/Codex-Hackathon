/**
 * Recommendation Engine Step: Determines the next logical action based on case parameters.
 * @param {object} context - Normalized intake context
 * @param {object} classificationObj - Classified results (classification, reason)
 * @param {object} riskObj - Computed risk and confidence results
 * @param {object} evidenceObj - Analyzed evidence facts
 * @returns {{ recommendedAction: string, recommendationExplanation: string, findings: Array, missingInformation: Array }}
 */
export const generateRecommendation = (context, classificationObj, riskObj, evidenceObj) => {
  const { amount } = context;
  const { classification, reason } = classificationObj;
  const { riskLevel, confidenceScore, signals } = riskObj;
  const { evidenceFilesCount, evidenceFacts } = evidenceObj;

  let recommendedAction = 'MANUAL_REVIEW';
  let recommendationExplanation = 'Case routed for manual investigator review.';
  const findings = [];
  const missingInformation = [];

  // Populate basic findings
  findings.push(`Case classified as ${classification.toLowerCase().replace('_', ' ')}.`);
  findings.push(`Dispute reason isolated as ${reason.toLowerCase().replace('_', ' ')}.`);
  findings.push(`Confidence score calculated at ${confidenceScore}% (${riskLevel} risk level).`);

  // Analyze missing information
  if (evidenceFilesCount === 0) {
    missingInformation.push('Receipt, purchase invoice, or merchant correspondence');
  }
  if (reason === 'REFUND_NOT_RECEIVED' && !evidenceFacts.some(f => f.merchantAcknowledgement)) {
    missingInformation.push('Merchant refund promise email or cancellation confirmation');
  }

  // 1. High value fraud or severe high risk -> ESCALATE
  if (classification === 'FRAUD' && (amount >= 1000 || riskLevel === 'HIGH')) {
    recommendedAction = 'ESCALATE';
    recommendationExplanation = 'High-value potential fraud case detected. Routing to Senior Fraud Escalation Unit.';
    findings.push('Flagged for immediate fraud escalation due to high value or risk parameters.');
  }
  // 2. Strong refund claim but missing merchant-side verification -> REQUEST_MERCHANT_EVIDENCE
  else if (reason === 'REFUND_NOT_RECEIVED' && evidenceFilesCount > 0 && !signals.some(s => s.code === 'REFUND_TRANSACTION_FOUND')) {
    recommendedAction = 'REQUEST_MERCHANT_EVIDENCE';
    recommendationExplanation = 'Customer provided proof of cancellation. Resolve AI recommends requesting merchant evidence of credit processing.';
    findings.push('Customer cancellation evidence verified. Merchant-side proof of refund required.');
  }
  // 3. Duplicate charge identified in database -> APPROVE
  else if (reason === 'DUPLICATE_CHARGE' && signals.some(s => s.code === 'DUPLICATE_TRANSACTION_IDENTIFIED')) {
    recommendedAction = 'APPROVE';
    recommendationExplanation = 'Clear duplicate transaction signature found in statement database. Recommend chargeback approval.';
    findings.push('Matched duplicate charge identifier. Dual posting confirmed in ledger history.');
  }
  // 4. Missing basic customer documents -> REQUEST_CUSTOMER_INFO
  else if (evidenceFilesCount === 0 && (reason === 'REFUND_NOT_RECEIVED' || reason === 'PRODUCT_NOT_RECEIVED' || reason === 'SERVICE_NOT_RECEIVED')) {
    recommendedAction = 'REQUEST_CUSTOMER_INFO';
    recommendationExplanation = 'No supporting documentation uploaded. Requesting customer billing/cancellation receipts.';
    findings.push('Customer has not uploaded supporting receipts or cancellation confirmation.');
  }
  // 5. High-confidence merchant dispute with full evidence -> APPROVE
  else if (riskLevel === 'LOW' && confidenceScore >= 80) {
    recommendedAction = 'APPROVE';
    recommendationExplanation = 'Case exhibits high confidence score with supporting documentation. Recommend dispute approval.';
    findings.push('Ample supporting context and clean validation history.');
  }
  // 6. Default fallback -> MANUAL_REVIEW
  else {
    recommendedAction = 'MANUAL_REVIEW';
    recommendationExplanation = 'Case parameters do not match automated fast-track rules. Standard investigator queue routing applied.';
    findings.push('Parameters require manual investigator case evaluation.');
  }

  return {
    recommendedAction,
    recommendationExplanation,
    findings,
    missingInformation
  };
};
export default generateRecommendation;
