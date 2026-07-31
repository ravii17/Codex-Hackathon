/**
 * Deterministic Risk & Confidence Scoring Engine.
 * Consumes transaction context, classification, evidence facts, and database signals.
 * @param {object} context - Intake normalized context
 * @param {object} classificationObj - Classified results (classification, reason)
 * @param {object} contextSignals - SQLite database context retrieval signals
 * @param {object} evidenceObj - Analyzed evidence facts
 * @returns {{ riskLevel: string, confidenceScore: number, signals: Array }}
 */
export const calculateRiskAndConfidence = (context, classificationObj, contextSignals, evidenceObj) => {
  const signals = [];
  let baseScore = 55;

  const { amount } = context;
  const { classification, reason } = classificationObj;
  const { matchingRefundFound, possibleDuplicateFound, merchantPreviouslyUsed } = contextSignals;
  const { evidenceFilesCount, evidenceFacts } = evidenceObj;

  // 1. High Value Risk Signal
  if (amount >= 1000) {
    signals.push({
      type: 'WARNING',
      code: 'HIGH_VALUE_TRANSACTION',
      label: 'High value transaction requires merchant validation',
      weight: -10
    });
  }

  // 2. Evidence Signals
  if (evidenceFilesCount > 0) {
    signals.push({
      type: 'POSITIVE',
      code: 'SUPPORTING_EVIDENCE_UPLOADED',
      label: 'Supporting evidence documents uploaded',
      weight: 15
    });
  } else {
    signals.push({
      type: 'WARNING',
      code: 'MISSING_EVIDENCE',
      label: 'No supporting evidence files uploaded by customer',
      weight: -18
    });
  }

  // 3. Merchant History Signals
  if (merchantPreviouslyUsed) {
    signals.push({
      type: 'POSITIVE',
      code: 'ESTABLISHED_MERCHANT_HISTORY',
      label: 'Customer has previous successful history with this merchant',
      weight: 10
    });
  } else {
    signals.push({
      type: 'WARNING',
      code: 'NEW_MERCHANT_FOR_CUSTOMER',
      label: 'No previous history with this merchant found for customer',
      weight: -5
    });
  }

  // 4. Reason-Specific Signals (Refund, Duplicate, Fraud)
  if (reason === 'REFUND_NOT_RECEIVED') {
    if (matchingRefundFound) {
      signals.push({
        type: 'WARNING',
        code: 'REFUND_TRANSACTION_FOUND',
        label: 'A matching negative (refund) transaction was found in history',
        weight: -15
      });
    } else {
      signals.push({
        type: 'POSITIVE',
        code: 'REFUND_NOT_FOUND_IN_HISTORY',
        label: 'No matching refund was found in transaction history',
        weight: 15
      });
    }
  }

  if (reason === 'DUPLICATE_CHARGE') {
    if (possibleDuplicateFound) {
      signals.push({
        type: 'POSITIVE',
        code: 'DUPLICATE_TRANSACTION_IDENTIFIED',
        label: 'A matching transaction with the same amount was found within 7 days',
        weight: 20
      });
    } else {
      signals.push({
        type: 'WARNING',
        code: 'DUPLICATE_NOT_FOUND',
        label: 'No duplicate transaction with same amount found within close dates',
        weight: -20
      });
    }
  }

  if (classification === 'FRAUD') {
    if (merchantPreviouslyUsed) {
      signals.push({
        type: 'WARNING',
        code: 'FRAUD_CLAIM_ON_PREVIOUSLY_USED_MERCHANT',
        label: 'Fraud claimed on a merchant the customer has used in the past',
        weight: -12
      });
    }
  }

  // 5. Evidence Fact Signals
  const hasAcknowledgement = evidenceFacts.some(f => f.merchantAcknowledgement);
  const hasRefundPromise = evidenceFacts.some(f => f.refundPromised);
  const hasPurchaseReceipt = evidenceFacts.some(f => f.purchaseEvidence);

  if (hasAcknowledgement) {
    signals.push({
      type: 'POSITIVE',
      code: 'MERCHANT_ACKNOWLEDGED_REFUND',
      label: 'Evidence indicates merchant acknowledged cancellation or refund promise',
      weight: 20
    });
  }
  if (hasRefundPromise) {
    signals.push({
      type: 'POSITIVE',
      code: 'REFUND_PROMISE_EVIDENCE',
      label: 'Uploaded document references a specific promised refund amount',
      weight: 15
    });
  }
  if (hasPurchaseReceipt) {
    signals.push({
      type: 'POSITIVE',
      code: 'PURCHASE_RECEIPT_PROVIDED',
      label: 'Customer provided original invoice/receipt file',
      weight: 10
    });
  }

  // Calculate final score
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const confidenceScore = Math.max(0, Math.min(100, baseScore + totalWeight));

  // Determine Risk Level
  let riskLevel = 'MEDIUM';
  if (confidenceScore >= 80 && amount < 1000) {
    riskLevel = 'LOW';
  } else if (confidenceScore < 50 || amount >= 1000 || classification === 'FRAUD') {
    riskLevel = 'HIGH';
  }

  return {
    riskLevel,
    confidenceScore,
    signals
  };
};
