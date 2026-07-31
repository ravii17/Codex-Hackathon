import assert from 'node:assert';
import { CASE_STATUS, isValidTransition } from './investigation/stateMachine.js';
import { runIntake } from './investigation/intake.js';
import { MockAIProvider } from './investigation/providers/MockAIProvider.js';
import { calculateRiskAndConfidence } from './investigation/riskEngine.js';
import { generateRecommendation } from './investigation/recommendation.js';

// Central Test Runner for Resolve AI Investigation Engine
console.log('==================================================');
console.log('RESOLVE AI - ENGINE TEST SUITE RUNNER');
console.log('==================================================\n');

let passedTests = 0;
let failedTests = 0;

const runTest = (name, fn) => {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    failedTests++;
  }
};

// 1. STATE MACHINE TRANSITIONS
runTest('State Machine transitions validation', () => {
  // Valid transitions
  assert.strictEqual(isValidTransition(CASE_STATUS.SUBMITTED, CASE_STATUS.AI_INVESTIGATING), true);
  assert.strictEqual(isValidTransition(CASE_STATUS.AI_INVESTIGATING, CASE_STATUS.AI_READY), true);
  assert.strictEqual(isValidTransition(CASE_STATUS.AI_READY, CASE_STATUS.RESOLVED), true);
  assert.strictEqual(isValidTransition(CASE_STATUS.UNDER_REVIEW, CASE_STATUS.RESOLVED), true);
  
  // Invalid transitions
  assert.strictEqual(isValidTransition(CASE_STATUS.SUBMITTED, CASE_STATUS.RESOLVED), false);
  assert.strictEqual(isValidTransition(CASE_STATUS.RESOLVED, CASE_STATUS.AI_INVESTIGATING), false);
});

// 2. INTAKE Normalization
runTest('Intake node normalizes details and checks missing data', () => {
  const caseRec = { id: 'CASE-1', customerId: 'CUST-1008' };
  const disputeRec = { id: 'AMEX-1', reason: 'Billing Discrepancy', questionnaire: JSON.stringify({ additionalInfo: 'Cancelled booking' }) };
  const txRec = { id: 'TX-1', merchant: 'Delta Air Lines', amount: 350.0, date: '2026-07-24' };

  const context = runIntake(caseRec, disputeRec, txRec);
  assert.strictEqual(context.caseId, 'CASE-1');
  assert.strictEqual(context.disputeReason, 'Billing Discrepancy');
  assert.strictEqual(context.customerStatement, 'Cancelled booking');

  // Verify it throws when critical data is missing
  assert.throws(() => runIntake(null, disputeRec, txRec));
});

// 3. MOCK AI PROVIDER CLASSIFICATION SCENARIOS
const mockProvider = new MockAIProvider();

runTest('Mock AI Provider - Scenario A (Refund not received)', async () => {
  const context = {
    disputeReason: 'Refund not received',
    customerStatement: "I cancelled my booking and the merchant said a refund was issued, but I haven't received it."
  };
  const result = await mockProvider.classifyCase(context);
  assert.strictEqual(result.classification, 'MERCHANT_DISPUTE');
  assert.strictEqual(result.reason, 'REFUND_NOT_RECEIVED');
});

runTest('Mock AI Provider - Scenario B (Fraud)', async () => {
  const context = {
    disputeReason: 'Fraud Claim',
    customerStatement: "I don't recognize this merchant and never made this purchase."
  };
  const result = await mockProvider.classifyCase(context);
  assert.strictEqual(result.classification, 'FRAUD');
});

runTest('Mock AI Provider - Scenario C (Duplicate charge)', async () => {
  const context = {
    disputeReason: 'Charged Twice',
    customerStatement: 'I was charged twice for the same purchase.'
  };
  const result = await mockProvider.classifyCase(context);
  assert.strictEqual(result.classification, 'DUPLICATE_CHARGE');
});

runTest('Mock AI Provider - Scenario D (Product not received)', async () => {
  const context = {
    disputeReason: 'Item Not Received',
    customerStatement: 'I ordered the product but it never arrived.'
  };
  const result = await mockProvider.classifyCase(context);
  assert.strictEqual(result.classification, 'MERCHANT_DISPUTE');
  assert.strictEqual(result.reason, 'PRODUCT_NOT_RECEIVED');
});

// 4. RISK & CONFIDENCE SCORING ENGINE
runTest('Risk Engine - High value risk scoring', () => {
  const context = { amount: 1500.0 };
  const classification = { classification: 'FRAUD', reason: 'FRAUD' };
  const signals = { matchingRefundFound: false, possibleDuplicateFound: false, merchantPreviouslyUsed: true };
  const evidence = { evidenceFilesCount: 0, evidenceFacts: [] };

  const riskResult = calculateRiskAndConfidence(context, classification, signals, evidence);
  assert.strictEqual(riskResult.riskLevel, 'HIGH');
  assert.ok(riskResult.signals.some(s => s.code === 'HIGH_VALUE_TRANSACTION'));
});

// 5. RECOMMENDATION RULES
runTest('Recommendation Engine - Auto duplicate charge approval', () => {
  const context = { amount: 50.0 };
  const classification = { classification: 'DUPLICATE_CHARGE', reason: 'DUPLICATE_CHARGE' };
  const risk = {
    riskLevel: 'LOW',
    confidenceScore: 85,
    signals: [{ type: 'POSITIVE', code: 'DUPLICATE_TRANSACTION_IDENTIFIED', label: 'Duplicate found', weight: 20 }]
  };
  const evidence = { evidenceFilesCount: 0, evidenceFacts: [] };

  const recResult = generateRecommendation(context, classification, risk, evidence);
  assert.strictEqual(recResult.recommendedAction, 'APPROVE');
});

runTest('Recommendation Engine - Fraud escalation', () => {
  const context = { amount: 1200.0 };
  const classification = { classification: 'FRAUD', reason: 'FRAUD' };
  const risk = {
    riskLevel: 'HIGH',
    confidenceScore: 40,
    signals: [{ type: 'WARNING', code: 'HIGH_VALUE_TRANSACTION', label: 'High value', weight: -10 }]
  };
  const evidence = { evidenceFilesCount: 0, evidenceFacts: [] };

  const recResult = generateRecommendation(context, classification, risk, evidence);
  assert.strictEqual(recResult.recommendedAction, 'ESCALATE');
});

// Print summary
console.log('\n==================================================');
console.log('TEST SUMMARY');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('==================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
