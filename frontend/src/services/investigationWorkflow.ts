import type { Dispute, DisputeFile, Transaction } from '../context/DisputeContext';

export type CaseClassification =
  | 'FRAUD'
  | 'MERCHANT_DISPUTE'
  | 'DUPLICATE_CHARGE'
  | 'INCORRECT_AMOUNT'
  | 'REFUND_NOT_RECEIVED'
  | 'PRODUCT_NOT_RECEIVED'
  | 'SERVICE_NOT_RECEIVED'
  | 'OTHER';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecommendationAction = 'APPROVE' | 'REQUEST_CUSTOMER_INFO' | 'REQUEST_MERCHANT_EVIDENCE' | 'ESCALATE' | 'MANUAL_REVIEW';
export type InvestigationStatus = 'AI_INVESTIGATING' | 'AI_READY' | 'UNDER_REVIEW' | 'MANUAL_REVIEW' | 'MORE_INFO_REQUIRED' | 'ESCALATED' | 'RESOLVED';
export type AuditActor = 'CUSTOMER' | 'AI' | 'SYSTEM' | 'INVESTIGATOR';
export type AuditAction =
  | 'CASE_CREATED'
  | 'INVESTIGATION_STARTED'
  | 'CONTEXT_RETRIEVED'
  | 'EVIDENCE_ANALYZED'
  | 'CASE_CLASSIFIED'
  | 'RISK_ASSESSED'
  | 'RECOMMENDATION_GENERATED'
  | 'INVESTIGATOR_OPENED_CASE'
  | 'RECOMMENDATION_APPROVED'
  | 'MORE_INFO_REQUESTED'
  | 'CASE_ESCALATED'
  | 'AI_RECOMMENDATION_OVERRIDDEN'
  | 'CASE_RESOLVED';

export interface InvestigationSignal {
  type: 'POSITIVE' | 'WARNING' | 'NEGATIVE';
  label: string;
  weight: number;
}

export interface EvidenceFact {
  fileId: string;
  fileName: string;
  label: string;
  value: string;
}

export interface WorkflowEvent {
  id: string;
  label: string;
  status: 'complete' | 'pending' | 'failed';
  timestamp: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorType: AuditActor;
  actorId?: string;
  caseId: string;
  action: AuditAction;
  metadata?: Record<string, string | number | boolean>;
}

export interface InvestigationResult {
  caseId: string;
  disputeId: string;
  transactionId: string;
  customerId: string;
  merchant: string;
  amount: number;
  customerStatement: string;
  classification: CaseClassification;
  reason: CaseClassification;
  riskLevel: RiskLevel;
  confidenceScore: number;
  findings: string[];
  signals: InvestigationSignal[];
  missingInformation: string[];
  recommendedAction: RecommendationAction;
  recommendationExplanation: string;
  status: InvestigationStatus;
  evidenceFacts: EvidenceFact[];
  workflowEvents: WorkflowEvent[];
  auditTrail: AuditEvent[];
  createdAt: string;
  updatedAt: string;
}

const now = () => new Date().toISOString();

const audit = (caseId: string, action: AuditAction, actorType: AuditActor, metadata?: AuditEvent['metadata']): AuditEvent => ({
  id: `${action}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
  timestamp: now(),
  actorType,
  actorId: actorType === 'INVESTIGATOR' ? 'INV-001' : actorType,
  caseId,
  action,
  metadata
});

const event = (id: string, label: string): WorkflowEvent => ({
  id,
  label,
  status: 'complete',
  timestamp: now()
});

const normalize = (value: string) => value.toLowerCase();

const classifyCase = (reason: string, statement: string): { classification: CaseClassification; reason: CaseClassification } => {
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
  if (text.includes('amount') || text.includes('overcharged')) {
    return { classification: 'INCORRECT_AMOUNT', reason: 'INCORRECT_AMOUNT' };
  }
  return { classification: 'OTHER', reason: 'OTHER' };
};

const extractEvidenceFacts = (files: DisputeFile[]): EvidenceFact[] => {
  return files.flatMap(file => {
    const name = normalize(file.name);
    const facts: EvidenceFact[] = [];
    if (name.includes('booking') || name.includes('invoice') || name.includes('receipt')) {
      facts.push({ fileId: file.id, fileName: file.name, label: 'Purchase evidence', value: file.category });
    }
    if (name.includes('cancel')) {
      facts.push({ fileId: file.id, fileName: file.name, label: 'Cancellation evidence', value: 'Cancellation referenced by filename' });
    }
    if (name.includes('refund')) {
      facts.push({ fileId: file.id, fileName: file.name, label: 'Refund evidence', value: 'Refund referenced by filename' });
    }
    if (name.includes('chat') || name.includes('email')) {
      facts.push({ fileId: file.id, fileName: file.name, label: 'Merchant communication', value: 'Communication log supplied' });
    }
    return facts;
  });
};

const assessRisk = (
  dispute: Dispute,
  transactions: Transaction[],
  classification: CaseClassification,
  reason: CaseClassification,
  evidenceFacts: EvidenceFact[]
) => {
  const signals: InvestigationSignal[] = [];
  const statement = normalize(String(dispute.questionnaire.additionalInfo || ''));
  const sameMerchantRefund = transactions.some(tx =>
    tx.merchant === dispute.transaction.merchant &&
    tx.amount < 0 &&
    Math.abs(tx.amount) === dispute.transaction.amount
  );

  if (evidenceFacts.length > 0) {
    signals.push({ type: 'POSITIVE', label: 'Supporting evidence uploaded', weight: 22 });
  } else {
    signals.push({ type: 'WARNING', label: 'No supporting evidence uploaded', weight: -18 });
  }
  if (statement.includes('refund') || statement.includes('cancel')) {
    signals.push({ type: 'POSITIVE', label: 'Customer statement includes refund or cancellation context', weight: 18 });
  }
  if (evidenceFacts.some(f => f.label.includes('Merchant communication') || f.label.includes('Refund'))) {
    signals.push({ type: 'POSITIVE', label: 'Evidence references merchant communication or refund promise', weight: 24 });
  }
  if (reason === 'REFUND_NOT_RECEIVED' && !sameMerchantRefund) {
    signals.push({ type: 'WARNING', label: 'Matching refund transaction not found', weight: -10 });
  }
  if (dispute.transaction.amount >= 1000) {
    signals.push({ type: 'WARNING', label: 'High value transaction requires merchant validation', weight: -8 });
  }
  if (classification === 'FRAUD') {
    signals.push({ type: 'WARNING', label: 'Potential fraud case requires manual investigator review', weight: -12 });
  }

  const confidenceScore = Math.max(35, Math.min(94, 58 + signals.reduce((sum, signal) => sum + signal.weight, 0)));
  const riskLevel: RiskLevel = confidenceScore >= 95 ? 'LOW' : confidenceScore >= 65 ? 'MEDIUM' : 'HIGH';
  return { confidenceScore, riskLevel, signals };
};

const recommend = (
  classification: CaseClassification,
  reason: CaseClassification,
  confidenceScore: number,
  riskLevel: RiskLevel,
  signals: InvestigationSignal[],
  evidenceFacts: EvidenceFact[]
) => {
  const missingInformation: string[] = [];
  if (!evidenceFacts.some(f => f.label.includes('Merchant communication') || f.label.includes('Refund'))) {
    missingInformation.push('Merchant refund confirmation/reference');
  }
  if (evidenceFacts.length === 0) {
    missingInformation.push('Receipt, cancellation confirmation, or merchant email');
  }

  let recommendedAction: RecommendationAction = 'MANUAL_REVIEW';
  if (riskLevel === 'HIGH') recommendedAction = 'ESCALATE';
  else if (missingInformation.length > 0 && reason === 'REFUND_NOT_RECEIVED') recommendedAction = 'REQUEST_MERCHANT_EVIDENCE';
  else if (confidenceScore >= 88 && signals.some(signal => signal.type === 'POSITIVE')) recommendedAction = 'APPROVE';
  else recommendedAction = 'REQUEST_CUSTOMER_INFO';

  const findings = [
    `Case classified as ${classification.replaceAll('_', ' ').toLowerCase()}.`,
    `Dispute reason identified as ${reason.replaceAll('_', ' ').toLowerCase()}.`,
    `${evidenceFacts.length} evidence fact(s) extracted from uploaded files.`
  ];
  if (signals.some(signal => signal.label.includes('Matching refund transaction not found'))) {
    findings.push('No matching refund transaction was found in available transaction history.');
  }

  return {
    recommendedAction,
    missingInformation,
    findings,
    recommendationExplanation:
      recommendedAction === 'REQUEST_MERCHANT_EVIDENCE'
        ? 'Available context supports continued investigation, but merchant-side confirmation should be obtained before final resolution.'
        : recommendedAction === 'APPROVE'
          ? 'Evidence and transaction context are strong enough for investigator approval.'
          : recommendedAction === 'ESCALATE'
            ? 'Risk signals require senior review before any decision is made.'
            : 'Additional information is needed before the case can be resolved.'
  };
};

export const runInvestigationWorkflow = (dispute: Dispute, transactions: Transaction[]): InvestigationResult => {
  const customerStatement = String(dispute.questionnaire.additionalInfo || '');
  const createdAt = now();
  const classification = classifyCase(dispute.reason, customerStatement);
  const evidenceFacts = extractEvidenceFacts(dispute.evidenceFiles);
  const risk = assessRisk(dispute, transactions, classification.classification, classification.reason, evidenceFacts);
  const recommendation = recommend(classification.classification, classification.reason, risk.confidenceScore, risk.riskLevel, risk.signals, evidenceFacts);

  return {
    caseId: `CASE-${dispute.id}`,
    disputeId: dispute.id,
    transactionId: dispute.transaction.id,
    customerId: 'CUST-1008',
    merchant: dispute.transaction.merchant,
    amount: dispute.transaction.amount,
    customerStatement,
    classification: classification.classification,
    reason: classification.reason,
    riskLevel: risk.riskLevel,
    confidenceScore: risk.confidenceScore,
    findings: recommendation.findings,
    signals: risk.signals,
    missingInformation: recommendation.missingInformation,
    recommendedAction: recommendation.recommendedAction,
    recommendationExplanation: recommendation.recommendationExplanation,
    status: 'AI_READY',
    evidenceFacts,
    workflowEvents: [
      event('received', 'Dispute received'),
      event('transaction', 'Transaction analyzed'),
      event('classification', 'Case classified'),
      event('risk', 'Risk assessed'),
      event('recommendation', 'Recommendation generated')
    ],
    auditTrail: [
      audit(dispute.id, 'INVESTIGATION_STARTED', 'AI'),
      audit(dispute.id, 'CONTEXT_RETRIEVED', 'AI', { nearbyTransactions: transactions.length }),
      audit(dispute.id, 'EVIDENCE_ANALYZED', 'AI', { files: dispute.evidenceFiles.length, facts: evidenceFacts.length }),
      audit(dispute.id, 'CASE_CLASSIFIED', 'AI', { classification: classification.classification, reason: classification.reason }),
      audit(dispute.id, 'RISK_ASSESSED', 'AI', { riskLevel: risk.riskLevel, confidenceScore: risk.confidenceScore }),
      audit(dispute.id, 'RECOMMENDATION_GENERATED', 'AI', { recommendedAction: recommendation.recommendedAction })
    ],
    createdAt,
    updatedAt: createdAt
  };
};

export const createAuditEvent = audit;
