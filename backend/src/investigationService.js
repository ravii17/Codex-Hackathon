const transactions = [
  { id: 'TX-1000', merchant: 'Luxe Hotel', amount: 1200, date: '2026-07-25', category: 'Travel', customerId: 'CUST-1008' },
  { id: 'TX-1001', merchant: 'Delta Air Lines', amount: 654.2, date: '2026-07-24', category: 'Travel', customerId: 'CUST-1008' },
  { id: 'TX-1002', merchant: 'Amazon.com', amount: 129.99, date: '2026-07-23', category: 'Shopping', customerId: 'CUST-1008' }
];

const disputes = [
  {
    id: 'AMEX-2026-DEMO',
    transactionId: 'TX-1000',
    customerId: 'CUST-1008',
    reason: 'Refund not received',
    customerStatement: "I cancelled the booking and the hotel told me they refunded me, but I haven't received it.",
    evidenceFiles: [
      { id: 'EV-1', name: 'luxe_hotel_cancellation_refund_email_LH-92831.pdf', category: 'Merchant Email' }
    ],
    createdAt: new Date().toISOString()
  }
];

const cases = new Map();

const normalize = value => String(value || '').toLowerCase();

const classify = (reason, statement) => {
  const text = normalize(`${reason} ${statement}`);
  if (text.includes('unauthorized') || text.includes('fraud') || text.includes('not authorized')) {
    return { classification: 'FRAUD', reason: 'FRAUD' };
  }
  if (text.includes('duplicate') || text.includes('charged twice')) {
    return { classification: 'DUPLICATE_CHARGE', reason: 'DUPLICATE_CHARGE' };
  }
  if (text.includes('refund')) {
    return { classification: 'MERCHANT_DISPUTE', reason: 'REFUND_NOT_RECEIVED' };
  }
  if (text.includes('not received') || text.includes('never arrived')) {
    return { classification: 'MERCHANT_DISPUTE', reason: 'PRODUCT_NOT_RECEIVED' };
  }
  if (text.includes('service')) {
    return { classification: 'MERCHANT_DISPUTE', reason: 'SERVICE_NOT_RECEIVED' };
  }
  if (text.includes('amount') || text.includes('overcharged')) {
    return { classification: 'INCORRECT_AMOUNT', reason: 'INCORRECT_AMOUNT' };
  }
  return { classification: 'OTHER', reason: 'OTHER' };
};

const evidenceSignals = files => {
  const labels = files.map(file => normalize(file.name));
  return {
    hasEvidence: files.length > 0,
    hasCancellation: labels.some(name => name.includes('cancel')),
    hasRefundPromise: labels.some(name => name.includes('refund')),
    hasMerchantCommunication: labels.some(name => name.includes('email') || name.includes('chat'))
  };
};

const scoreRisk = ({ dispute, transaction, reason }) => {
  const evidence = evidenceSignals(dispute.evidenceFiles || []);
  const statement = normalize(dispute.customerStatement);
  const refundFound = transactions.some(tx =>
    tx.customerId === dispute.customerId &&
    tx.merchant === transaction.merchant &&
    tx.amount < 0 &&
    Math.abs(tx.amount) === transaction.amount
  );

  const signals = [];
  if (evidence.hasEvidence) signals.push({ type: 'POSITIVE', label: 'Supporting evidence uploaded', weight: 22 });
  else signals.push({ type: 'WARNING', label: 'No supporting evidence uploaded', weight: -18 });
  if (statement.includes('cancel')) signals.push({ type: 'POSITIVE', label: 'Customer reports cancelling the booking', weight: 10 });
  if (statement.includes('refund')) signals.push({ type: 'POSITIVE', label: 'Customer reports that the merchant promised a refund', weight: 14 });
  if (evidence.hasRefundPromise || evidence.hasMerchantCommunication) signals.push({ type: 'POSITIVE', label: 'Evidence references merchant communication or refund promise', weight: 20 });
  if (reason === 'REFUND_NOT_RECEIVED' && !refundFound) signals.push({ type: 'WARNING', label: 'No matching refund was found in available transaction data', weight: -4 });
  if (transaction.amount >= 1000) signals.push({ type: 'WARNING', label: 'High value transaction requires merchant validation', weight: -6 });

  const confidenceScore = Math.max(0, Math.min(94, 58 + signals.reduce((sum, signal) => sum + signal.weight, 0)));
  const riskLevel = confidenceScore >= 95 ? 'LOW' : confidenceScore >= 65 ? 'MEDIUM' : 'HIGH';
  return { riskLevel, confidenceScore, signals };
};

const recommend = ({ reason, riskLevel, signals }) => {
  const hasRefundGap = signals.some(signal => signal.label.includes('No matching refund'));
  if (riskLevel === 'HIGH') return 'ESCALATE';
  if (reason === 'REFUND_NOT_RECEIVED' && hasRefundGap) return 'REQUEST_MERCHANT_EVIDENCE';
  if (riskLevel === 'LOW') return 'APPROVE';
  return 'REQUEST_CUSTOMER_INFO';
};

const buildFindings = ({ reason, signals }) => {
  const findings = [];
  if (signals.some(signal => signal.label.includes('cancelling'))) findings.push('Customer reports cancelling the booking');
  if (signals.some(signal => signal.label.includes('promised a refund'))) findings.push('Customer reports that the merchant promised a refund');
  if (reason === 'REFUND_NOT_RECEIVED' && signals.some(signal => signal.label.includes('No matching refund'))) {
    findings.push('No matching refund was found in available transaction data');
  }
  if (findings.length === 0) findings.push('Case requires manual review based on available information');
  return findings;
};

export const investigateDispute = disputeId => {
  const dispute = disputes.find(item => item.id === disputeId);
  if (!dispute) {
    const error = new Error('Dispute not found');
    error.statusCode = 404;
    throw error;
  }

  const transaction = transactions.find(item => item.id === dispute.transactionId);
  if (!transaction) {
    const error = new Error('Transaction not found');
    error.statusCode = 404;
    throw error;
  }

  const createdAt = new Date().toISOString();
  try {
    const classification = classify(dispute.reason, dispute.customerStatement);
    const risk = scoreRisk({ dispute, transaction, reason: classification.reason });
    const recommendedAction = recommend({ reason: classification.reason, riskLevel: risk.riskLevel, signals: risk.signals });
    const caseRecord = {
      caseId: `CASE-${dispute.id}`,
      disputeId: dispute.id,
      transactionId: transaction.id,
      customerId: dispute.customerId,
      merchant: transaction.merchant,
      amount: transaction.amount,
      customerStatement: dispute.customerStatement,
      classification: classification.classification,
      reason: classification.reason,
      riskLevel: risk.riskLevel,
      confidenceScore: risk.confidenceScore,
      signals: risk.signals,
      findings: buildFindings({ reason: classification.reason, signals: risk.signals }),
      recommendedAction,
      recommendationExplanation: 'Resolve AI recommends the next action for investigator review. No financial decision has been made automatically.',
      status: 'AI_READY',
      createdAt,
      updatedAt: createdAt
    };
    cases.set(caseRecord.caseId, caseRecord);
    return caseRecord;
  } catch (error) {
    const failedCase = {
      caseId: `CASE-${dispute.id}`,
      disputeId: dispute.id,
      transactionId: transaction.id,
      customerId: dispute.customerId,
      merchant: transaction.merchant,
      amount: transaction.amount,
      customerStatement: dispute.customerStatement,
      classification: 'OTHER',
      reason: 'OTHER',
      riskLevel: 'HIGH',
      confidenceScore: 0,
      signals: [{ type: 'WARNING', label: 'Investigation failed and was routed to manual review', weight: 0 }],
      findings: ['Case received and routed to manual review'],
      recommendedAction: 'MANUAL_REVIEW',
      recommendationExplanation: 'Automated investigation failed safely. Investigator review is required.',
      status: 'MANUAL_REVIEW',
      createdAt,
      updatedAt: createdAt
    };
    cases.set(failedCase.caseId, failedCase);
    return failedCase;
  }
};

export const getInvestigatorCase = caseId => {
  if (!cases.has(caseId)) {
    const disputeId = caseId.replace(/^CASE-/, '');
    if (disputes.some(dispute => dispute.id === disputeId)) investigateDispute(disputeId);
  }
  return cases.get(caseId) || null;
};

export const getCustomerCase = (caseId, customerId) => {
  const record = getInvestigatorCase(caseId);
  if (!record || record.customerId !== customerId) return null;
  return {
    caseId: record.caseId,
    disputeId: record.disputeId,
    merchant: record.merchant,
    amount: record.amount,
    status: record.status,
    classification: record.classification,
    currentStage: record.status === 'AI_READY' ? 'Amex review' : 'Manual review',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
};

investigateDispute('AMEX-2026-DEMO');
