import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../resolve.db');

const db = new sqlite3.Database(dbPath);

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Database initialization
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          merchant TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT NOT NULL,
          disputeEligible INTEGER NOT NULL,
          disputeId TEXT,
          customerId TEXT NOT NULL
        )
      `);

      // Create disputes table
      db.run(`
        CREATE TABLE IF NOT EXISTS disputes (
          id TEXT PRIMARY KEY,
          transactionId TEXT NOT NULL,
          customerId TEXT NOT NULL,
          reason TEXT NOT NULL,
          mappedCode TEXT NOT NULL,
          status TEXT NOT NULL,
          submittedAt TEXT NOT NULL,
          expectedResolution TEXT NOT NULL,
          questionnaire TEXT NOT NULL,
          completenessScore INTEGER NOT NULL,
          customerName TEXT,
          decisionExplanation TEXT
        )
      `);

      // Create cases table
      db.run(`
        CREATE TABLE IF NOT EXISTS cases (
          id TEXT PRIMARY KEY,
          disputeId TEXT NOT NULL,
          customerId TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Create evidence_files table
      db.run(`
        CREATE TABLE IF NOT EXISTS evidence_files (
          id TEXT PRIMARY KEY,
          disputeId TEXT NOT NULL,
          name TEXT NOT NULL,
          size TEXT NOT NULL,
          category TEXT NOT NULL,
          extractedData TEXT
        )
      `);

      // Create investigation_results table
      db.run(`
        CREATE TABLE IF NOT EXISTS investigation_results (
          caseId TEXT PRIMARY KEY,
          classification TEXT NOT NULL,
          reason TEXT NOT NULL,
          riskLevel TEXT NOT NULL,
          confidenceScore INTEGER NOT NULL,
          findings TEXT NOT NULL,
          signals TEXT NOT NULL,
          missingInformation TEXT NOT NULL,
          recommendedAction TEXT NOT NULL,
          recommendationExplanation TEXT NOT NULL,
          provider TEXT NOT NULL,
          investigatedAt TEXT NOT NULL
        )
      `);

      // Create audit_events table
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_events (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          actorType TEXT NOT NULL,
          actorId TEXT,
          caseId TEXT NOT NULL,
          action TEXT NOT NULL,
          metadata TEXT
        )
      `);

      // Seed initial transactions & disputes if empty
      db.get("SELECT COUNT(*) as count FROM transactions", [], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count === 0) {
          try {
            await seedDemoData();
            resolve();
          } catch (e) {
            reject(e);
          }
        } else {
          resolve();
        }
      });
    });
  });
};

export const seedDemoData = async () => {
  console.log('[DATABASE] Starting fresh demo data seed...');
  await dbRun("DELETE FROM transactions");
  await dbRun("DELETE FROM disputes");
  await dbRun("DELETE FROM cases");
  await dbRun("DELETE FROM evidence_files");
  await dbRun("DELETE FROM investigation_results");
  await dbRun("DELETE FROM audit_events");

  // 1. Transactions Seeding
  const transactions = [
    // David K CUST-1008
    { id: 'TX-1000', merchant: 'Luxe Hotel', amount: 1200.00, date: '2026-07-25', category: 'Travel', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1008', disputeId: null },
    { id: 'TX-1001', merchant: 'Delta Air Lines', amount: 654.20, date: '2026-07-24', category: 'Travel', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1008', disputeId: null },
    { id: 'TX-1002', merchant: 'Amazon.com', amount: 129.99, date: '2026-07-23', category: 'Shopping', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1008', disputeId: null },
    { id: 'TX-1003', merchant: 'Apple Store', amount: 1299.00, date: '2026-07-20', category: 'Electronics', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1008', disputeId: null },
    { id: 'TX-1004', merchant: 'Uber Trip', amount: 24.50, date: '2026-07-19', category: 'Ride Share', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1008', disputeId: null },
    { id: 'TX-1005', merchant: 'Starbucks Coffee', amount: 15.75, date: '2026-07-19', category: 'Dining', status: 'Pending', disputeEligible: 0, customerId: 'CUST-1008', disputeId: null },
    { id: 'TX-1006', merchant: 'Best Buy', amount: 459.99, date: '2026-07-15', category: 'Electronics', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1008', disputeId: 'AMEX-2026-00451' },
    { id: 'TX-1007', merchant: 'Target Stores', amount: 89.50, date: '2026-06-18', category: 'Shopping', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1008', disputeId: 'AMEX-2026-00210' },

    // Alex Morgan CUST-1009 (Golden Demo Case Candidate)
    { id: 'TX-1200', merchant: 'Luxe Hotel', amount: 1200.00, date: '2026-07-25', category: 'Travel', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1009', disputeId: null },
    { id: 'TX-1201', merchant: 'Luxe Hotel', amount: 300.00, date: '2026-06-15', category: 'Travel', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1009', disputeId: null }, // context builder
    { id: 'TX-1202', merchant: 'Starbucks', amount: 8.50, date: '2026-07-24', category: 'Dining', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1009', disputeId: null },
    { id: 'TX-1203', merchant: 'Delta Air Lines', amount: 520.00, date: '2026-07-20', category: 'Travel', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1009', disputeId: null },
    { id: 'TX-1204', merchant: 'Uber Trip', amount: 18.50, date: '2026-07-22', category: 'Ride Share', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1009', disputeId: null },
    { id: 'TX-1205', merchant: 'Whole Foods', amount: 64.20, date: '2026-07-23', category: 'Groceries', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1009', disputeId: null },

    // Sarah Jenkins CUST-1010
    { id: 'TX-1011', merchant: 'Walmart Stores', amount: 85.50, date: '2026-07-28', category: 'Shopping', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1010', disputeId: 'AMEX-2026-10001' },
    { id: 'TX-1012', merchant: 'Uber Trip', amount: 14.20, date: '2026-07-27', category: 'Ride Share', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1010', disputeId: 'AMEX-2026-10002' },
    { id: 'TX-1020', merchant: 'Walmart Stores', amount: 85.50, date: '2026-07-28', category: 'Shopping', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1010', disputeId: null }, // duplicate charge match
    { id: 'TX-1021', merchant: 'Whole Foods', amount: 120.40, date: '2026-07-26', category: 'Groceries', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1010', disputeId: null },
    { id: 'TX-1022', merchant: 'Starbucks', amount: 4.50, date: '2026-07-27', category: 'Dining', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1010', disputeId: null },

    // Marcus Vance CUST-1011
    { id: 'TX-1013', merchant: 'Best Buy', amount: 649.99, date: '2026-07-26', category: 'Electronics', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1011', disputeId: 'AMEX-2026-10003' },
    { id: 'TX-1014', merchant: 'Target Stores', amount: 120.00, date: '2026-07-25', category: 'Shopping', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1011', disputeId: 'AMEX-2026-10004' },
    { id: 'TX-1030', merchant: 'Starbucks', amount: 12.50, date: '2026-07-24', category: 'Dining', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1011', disputeId: null },
    { id: 'TX-1031', merchant: 'Best Buy', amount: 45.99, date: '2026-05-12', category: 'Electronics', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1011', disputeId: null },
    { id: 'TX-1032', merchant: 'Target Stores', amount: 12.00, date: '2026-07-20', category: 'Shopping', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1011', disputeId: null },

    // Elena Rostova CUST-1012
    { id: 'TX-1015', merchant: 'Delta Air Lines', amount: 450.00, date: '2026-07-24', category: 'Travel', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1012', disputeId: 'AMEX-2026-10005' },
    { id: 'TX-1016', merchant: 'Unknown Online Seller', amount: 950.00, date: '2026-07-23', category: 'Electronics', status: 'Disputed', disputeEligible: 0, customerId: 'CUST-1012', disputeId: 'AMEX-2026-10006' },
    { id: 'TX-1040', merchant: 'Starbucks', amount: 6.20, date: '2026-07-22', category: 'Dining', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1012', disputeId: null },
    { id: 'TX-1041', merchant: 'Uber Trip', amount: 22.40, date: '2026-07-21', category: 'Ride Share', status: 'Posted', disputeEligible: 1, customerId: 'CUST-1012', disputeId: null }
  ];

  for (const tx of transactions) {
    await dbRun(
      `INSERT INTO transactions (id, merchant, amount, date, category, status, disputeEligible, disputeId, customerId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tx.id, tx.merchant, tx.amount, tx.date, tx.category, tx.status, tx.disputeEligible, tx.disputeId, tx.customerId]
    );
  }

  // 2. Disputes Seeding
  const disputes = [
    {
      id: 'AMEX-2026-10001',
      transactionId: 'TX-1011',
      customerId: 'CUST-1010',
      reason: 'Incorrect Amount',
      mappedCode: '4555',
      status: 'Submitted',
      submittedAt: '2026-07-29',
      expectedResolution: '7 Business Days',
      questionnaire: JSON.stringify({ contactedMerchant: 'Yes', additionalInfo: 'Billed $85.50 instead of $58.50 on my discount tab.' }),
      completenessScore: 90,
      customerName: 'Sarah Jenkins',
      decisionExplanation: null
    },
    {
      id: 'AMEX-2026-10002',
      transactionId: 'TX-1012',
      customerId: 'CUST-1010',
      reason: 'Duplicate Charge',
      mappedCode: '4554',
      status: 'Evidence Gathering',
      submittedAt: '2026-07-28',
      expectedResolution: '5 Business Days',
      questionnaire: JSON.stringify({ contactedMerchant: 'No', additionalInfo: 'Billed twice for identical Uber ride.' }),
      completenessScore: 75,
      customerName: 'Sarah Jenkins',
      decisionExplanation: null
    },
    {
      id: 'AMEX-2026-10003',
      transactionId: 'TX-1013',
      customerId: 'CUST-1011',
      reason: 'Product Not Received',
      mappedCode: '4555',
      status: 'Evidence Gathering',
      submittedAt: '2026-07-27',
      expectedResolution: '5 Business Days',
      questionnaire: JSON.stringify({ contactedMerchant: 'Yes', additionalInfo: 'Courier indicates package left in lobby, but security confirmed no deliveries.' }),
      completenessScore: 85,
      customerName: 'Marcus Vance',
      decisionExplanation: null
    },
    {
      id: 'AMEX-2026-10004',
      transactionId: 'TX-1014',
      customerId: 'CUST-1011',
      reason: 'Incorrect Amount',
      mappedCode: '4555',
      status: 'Evidence Gathering',
      submittedAt: '2026-07-27',
      expectedResolution: '5 Business Days',
      questionnaire: JSON.stringify({ contactedMerchant: 'Yes', additionalInfo: 'Merchant charged for two items instead of one.' }),
      completenessScore: 80,
      customerName: 'Marcus Vance',
      decisionExplanation: null
    },
    {
      id: 'AMEX-2026-10005',
      transactionId: 'TX-1015',
      customerId: 'CUST-1012',
      reason: 'Refund Not Received',
      mappedCode: '4554',
      status: 'More Information Required',
      submittedAt: '2026-07-26',
      expectedResolution: '10 Business Days',
      questionnaire: JSON.stringify({ contactedMerchant: 'Yes', additionalInfo: 'Cancelled booking email received but refund has not posted to statement.' }),
      completenessScore: 92,
      customerName: 'Elena Rostova',
      decisionExplanation: null
    },
    {
      id: 'AMEX-2026-10006',
      transactionId: 'TX-1016',
      customerId: 'CUST-1012',
      reason: 'Unauthorized Transaction',
      mappedCode: '4554',
      status: 'Evidence Gathering',
      submittedAt: '2026-07-26',
      expectedResolution: '5 Business Days',
      questionnaire: JSON.stringify({ contactedMerchant: 'No', additionalInfo: 'I do not recognize this online charge. Card in possession.' }),
      completenessScore: 68,
      customerName: 'Elena Rostova',
      decisionExplanation: null
    },
    {
      id: 'AMEX-2026-00451',
      transactionId: 'TX-1006',
      customerId: 'CUST-1008',
      reason: 'Unauthorized Transaction',
      mappedCode: '4554',
      status: 'Approved',
      submittedAt: '2026-07-16',
      expectedResolution: 'Completed',
      questionnaire: JSON.stringify({ contactedMerchant: 'Yes', additionalInfo: 'Card in possession, charges not authorized by me.' }),
      completenessScore: 82,
      customerName: 'David K.',
      decisionExplanation: 'Approved. Unauthorized transaction confirmed. Charge reversed in customer favor.'
    },
    {
      id: 'AMEX-2026-00210',
      transactionId: 'TX-1007',
      customerId: 'CUST-1008',
      reason: 'Defective Product',
      mappedCode: '4555',
      status: 'Rejected',
      submittedAt: '2026-06-20',
      expectedResolution: 'Completed',
      questionnaire: JSON.stringify({ contactedMerchant: 'Yes' }),
      completenessScore: 40,
      customerName: 'David K.',
      decisionExplanation: 'Rejected. Merchant provided delivery confirmation. Cardholder failed to upload photos showing item defects or proof of item return.'
    }
  ];

  for (const disp of disputes) {
    await dbRun(
      `INSERT INTO disputes (id, transactionId, customerId, reason, mappedCode, status, submittedAt, expectedResolution, questionnaire, completenessScore, customerName, decisionExplanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [disp.id, disp.transactionId, disp.customerId, disp.reason, disp.mappedCode, disp.status, disp.submittedAt, disp.expectedResolution, disp.questionnaire, disp.completenessScore, disp.customerName, disp.decisionExplanation]
    );
  }

  // 3. Cases Seeding
  const cases = [
    { id: 'CASE-AMEX-2026-10001', disputeId: 'AMEX-2026-10001', customerId: 'CUST-1010', status: 'SUBMITTED', createdAt: '2026-07-29T10:00:00.000Z', updatedAt: '2026-07-29T10:00:00.000Z' },
    { id: 'CASE-AMEX-2026-10002', disputeId: 'AMEX-2026-10002', customerId: 'CUST-1010', status: 'AI_INVESTIGATING', createdAt: '2026-07-28T09:15:00.000Z', updatedAt: '2026-07-28T09:30:00.000Z' },
    { id: 'CASE-AMEX-2026-10003', disputeId: 'AMEX-2026-10003', customerId: 'CUST-1011', status: 'AI_READY', createdAt: '2026-07-27T11:45:00.000Z', updatedAt: '2026-07-27T12:00:00.000Z' },
    { id: 'CASE-AMEX-2026-10004', disputeId: 'AMEX-2026-10004', customerId: 'CUST-1011', status: 'UNDER_REVIEW', createdAt: '2026-07-27T08:30:00.000Z', updatedAt: '2026-07-28T14:15:00.000Z' },
    { id: 'CASE-AMEX-2026-10005', disputeId: 'AMEX-2026-10005', customerId: 'CUST-1012', status: 'MORE_INFO_REQUIRED', createdAt: '2026-07-26T14:00:00.000Z', updatedAt: '2026-07-28T10:30:00.000Z' },
    { id: 'CASE-AMEX-2026-10006', disputeId: 'AMEX-2026-10006', customerId: 'CUST-1012', status: 'ESCALATED', createdAt: '2026-07-26T15:20:00.000Z', updatedAt: '2026-07-27T09:45:00.000Z' },
    { id: 'CASE-AMEX-2026-00451', disputeId: 'AMEX-2026-00451', customerId: 'CUST-1008', status: 'RESOLVED', createdAt: '2026-07-16T12:00:00.000Z', updatedAt: '2026-07-17T15:30:00.000Z' },
    { id: 'CASE-AMEX-2026-00210', disputeId: 'AMEX-2026-00210', customerId: 'CUST-1008', status: 'RESOLVED', createdAt: '2026-06-20T10:00:00.000Z', updatedAt: '2026-06-21T11:00:00.000Z' }
  ];

  for (const c of cases) {
    await dbRun(
      `INSERT INTO cases (id, disputeId, customerId, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.id, c.disputeId, c.customerId, c.status, c.createdAt, c.updatedAt]
    );
  }

  // 4. Evidence Files Seeding
  const evidenceFiles = [
    { id: 'ev-1', disputeId: 'AMEX-2026-10003', name: 'delivery_slip_unsigned.jpg', size: '850 KB', category: 'Invoices', extractedData: JSON.stringify({ courier: 'FedEx', deliveryStatus: 'Delivered Without Signature', packageWeight: '1.2 lbs' }) },
    { id: 'ev-2', disputeId: 'AMEX-2026-10004', name: 'receipt_target_stores.pdf', size: '1.1 MB', category: 'Receipts', extractedData: JSON.stringify({ itemizedTotal: 100.00, tax: 8.00, couponCode: 'SAVE20_EXPIRED' }) },
    { id: 'ev-3', disputeId: 'AMEX-2026-10005', name: 'airline_flight_cancel_email.pdf', size: '1.5 MB', category: 'Merchant Email', extractedData: JSON.stringify({ bookingCode: 'DL-92831', cancellationStatus: 'Confirmed', promisedRefundAmount: 450.00 }) },
    { id: 'ev-4', disputeId: 'AMEX-2026-00451', name: 'invoice_statement.png', size: '1.4 MB', category: 'Invoices', extractedData: JSON.stringify({ merchant: 'Best Buy', amount: 459.99 }) }
  ];

  for (const f of evidenceFiles) {
    await dbRun(
      `INSERT INTO evidence_files (id, disputeId, name, size, category, extractedData)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [f.id, f.disputeId, f.name, f.size, f.category, f.extractedData]
    );
  }

  // 5. Investigation Results Seeding (for cases in AI_READY and onwards)
  const results = [
    {
      caseId: 'CASE-AMEX-2026-10003',
      classification: 'MERCHANT_DISPUTE',
      reason: 'PRODUCT_NOT_RECEIVED',
      riskLevel: 'HIGH',
      confidenceScore: 65,
      findings: JSON.stringify([
        'Case classified as merchant dispute.',
        'Dispute reason isolated as product not received.',
        'No shipping carrier signature obtained by merchant.',
        'Confidence score calculated at 65%.'
      ]),
      signals: JSON.stringify([
        { type: 'WARNING', code: 'HIGH_VALUE_TRANSACTION', label: 'High value transaction requires courier verification', weight: -10 },
        { type: 'POSITIVE', code: 'SUPPORTING_EVIDENCE_UPLOADED', label: 'Supporting evidence documents uploaded', weight: 15 }
      ]),
      missingInformation: JSON.stringify(['Official merchant courier delivery photo or signature proof']),
      recommendedAction: 'MANUAL_REVIEW',
      recommendationExplanation: 'Resolve AI recommends manual investigator review due to high dollar value and ambiguous courier signature.',
      provider: 'mock',
      investigatedAt: '2026-07-27T12:00:00.000Z'
    },
    {
      caseId: 'CASE-AMEX-2026-10004',
      classification: 'INCORRECT_AMOUNT',
      reason: 'INCORRECT_AMOUNT',
      riskLevel: 'LOW',
      confidenceScore: 82,
      findings: JSON.stringify([
        'Case classified as incorrect amount.',
        'Billed amount matches catalog item price.',
        'Coupon code SAVE20 was expired at transaction execution.',
        'Confidence score calculated at 82%.'
      ]),
      signals: JSON.stringify([
        { type: 'POSITIVE', code: 'SUPPORTING_EVIDENCE_UPLOADED', label: 'Supporting evidence documents uploaded', weight: 15 },
        { type: 'WARNING', code: 'COUPON_EXPIRED_ON_RECEIPT', label: 'Billing receipt coupon matches expired date criteria', weight: -5 }
      ]),
      missingInformation: JSON.stringify([]),
      recommendedAction: 'MANUAL_REVIEW',
      recommendationExplanation: 'Billed amount was correct at checkout time. Expired coupon code applied. Routing for review.',
      provider: 'mock',
      investigatedAt: '2026-07-28T14:15:00.000Z'
    },
    {
      caseId: 'CASE-AMEX-2026-10005',
      classification: 'MERCHANT_DISPUTE',
      reason: 'REFUND_NOT_RECEIVED',
      riskLevel: 'MEDIUM',
      confidenceScore: 78,
      findings: JSON.stringify([
        'Case classified as merchant dispute.',
        'Dispute reason refund not received verified.',
        'No matching negative refund transaction found in customer history.',
        'Confidence score calculated at 78%.'
      ]),
      signals: JSON.stringify([
        { type: 'POSITIVE', code: 'SUPPORTING_EVIDENCE_UPLOADED', label: 'Cancellation notice uploaded', weight: 15 },
        { type: 'POSITIVE', code: 'REFUND_NOT_FOUND_IN_HISTORY', label: 'No refund posted to statement', weight: 15 }
      ]),
      missingInformation: JSON.stringify(['Merchant credit voucher number or reference code']),
      recommendedAction: 'REQUEST_MERCHANT_EVIDENCE',
      recommendationExplanation: 'Cancellation notice verified. Resolve AI recommends requesting merchant evidence of credit processing.',
      provider: 'mock',
      investigatedAt: '2026-07-28T10:30:00.000Z'
    },
    {
      caseId: 'CASE-AMEX-2026-10006',
      classification: 'FRAUD',
      reason: 'FRAUD',
      riskLevel: 'HIGH',
      confidenceScore: 42,
      findings: JSON.stringify([
        'Case classified as fraud.',
        'Merchant: Unknown Online Seller has no history for cardmember.',
        'Unusual spending context matching geographic fraud lists.',
        'Confidence score calculated at 42%.'
      ]),
      signals: JSON.stringify([
        { type: 'WARNING', code: 'HIGH_VALUE_TRANSACTION', label: 'High value transaction detected', weight: -10 },
        { type: 'WARNING', code: 'NEW_MERCHANT_FOR_CUSTOMER', label: 'New merchant for customer', weight: -5 }
      ]),
      missingInformation: JSON.stringify(['Police report scan or physical card loss report details']),
      recommendedAction: 'ESCALATE',
      recommendationExplanation: 'High-value potential fraud case detected. Routing to Senior Fraud Escalation Unit.',
      provider: 'mock',
      investigatedAt: '2026-07-27T09:45:00.000Z'
    },
    {
      caseId: 'CASE-AMEX-2026-00451',
      classification: 'FRAUD',
      reason: 'FRAUD',
      riskLevel: 'HIGH',
      confidenceScore: 88,
      findings: JSON.stringify([
        'Case classified as fraud.',
        'Unauthorized purchase at Best Buy.',
        'Cardholder in possession of card, device trace doesn\'t match usual geolocations.'
      ]),
      signals: JSON.stringify([
        { type: 'POSITIVE', code: 'SUPPORTING_EVIDENCE_UPLOADED', label: 'Verification data matches', weight: 15 }
      ]),
      missingInformation: JSON.stringify([]),
      recommendedAction: 'APPROVE',
      recommendationExplanation: 'Approve dispute and credit cardholder. Fraud score verified.',
      provider: 'mock',
      investigatedAt: '2026-07-17T15:30:00.000Z'
    },
    {
      caseId: 'CASE-AMEX-2026-00210',
      classification: 'MERCHANT_DISPUTE',
      reason: 'PRODUCT_NOT_RECEIVED',
      riskLevel: 'MEDIUM',
      confidenceScore: 35,
      findings: JSON.stringify([
        'Case classified as product not received.',
        'Customer failed to provide invoice or return slip.'
      ]),
      signals: JSON.stringify([
        { type: 'WARNING', code: 'MISSING_EVIDENCE', label: 'Missing invoice or proof of purchase', weight: -18 }
      ]),
      missingInformation: JSON.stringify(['Invoice proof', 'Item photos']),
      recommendedAction: 'REJECT',
      recommendationExplanation: 'Dispute rejected due to delivery confirmation and lack of customer evidence.',
      provider: 'mock',
      investigatedAt: '2026-06-21T11:00:00.000Z'
    }
  ];

  for (const r of results) {
    await dbRun(
      `INSERT INTO investigation_results (caseId, classification, reason, riskLevel, confidenceScore, findings, signals, missingInformation, recommendedAction, recommendationExplanation, provider, investigatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.caseId, r.classification, r.reason, r.riskLevel, r.confidenceScore, r.findings, r.signals, r.missingInformation, r.recommendedAction, r.recommendationExplanation, r.provider, r.investigatedAt]
    );
  }

  // 6. Audit Events Seeding
  const auditEvents = [
    // Sarah Jenkins Walmart Claim
    { id: 'ae-1', timestamp: '2026-07-29T10:00:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1010', caseId: 'CASE-AMEX-2026-10001', action: 'CASE_CREATED', metadata: JSON.stringify({}) },

    // Sarah Jenkins Uber Claim
    { id: 'ae-2', timestamp: '2026-07-28T09:15:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1010', caseId: 'CASE-AMEX-2026-10002', action: 'CASE_CREATED', metadata: JSON.stringify({}) },
    { id: 'ae-3', timestamp: '2026-07-28T09:30:00.000Z', actorType: 'SYSTEM', actorId: 'RESOLVE-SYSTEM', caseId: 'CASE-AMEX-2026-10002', action: 'INVESTIGATION_STARTED', metadata: JSON.stringify({ provider: 'mock' }) },

    // Marcus Vance Best Buy Claim
    { id: 'ae-4', timestamp: '2026-07-27T11:45:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1011', caseId: 'CASE-AMEX-2026-10003', action: 'CASE_CREATED', metadata: JSON.stringify({}) },
    { id: 'ae-5', timestamp: '2026-07-27T12:00:00.000Z', actorType: 'SYSTEM', actorId: 'RESOLVE-SYSTEM', caseId: 'CASE-AMEX-2026-10003', action: 'INVESTIGATION_COMPLETED', metadata: JSON.stringify({ status: 'AI_READY' }) },

    // Marcus Vance Target Claim
    { id: 'ae-6', timestamp: '2026-07-27T08:30:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1011', caseId: 'CASE-AMEX-2026-10004', action: 'CASE_CREATED', metadata: JSON.stringify({}) },
    { id: 'ae-7', timestamp: '2026-07-28T14:15:00.000Z', actorType: 'SYSTEM', actorId: 'RESOLVE-SYSTEM', caseId: 'CASE-AMEX-2026-10004', action: 'INVESTIGATION_COMPLETED', metadata: JSON.stringify({ status: 'AI_READY' }) },
    { id: 'ae-8', timestamp: '2026-07-28T15:00:00.000Z', actorType: 'INVESTIGATOR', actorId: 'investigator@amex.com', caseId: 'CASE-AMEX-2026-10004', action: 'REVIEW_STARTED', metadata: JSON.stringify({}) },

    // Elena Rostova flight refund claim
    { id: 'ae-9', timestamp: '2026-07-26T14:00:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1012', caseId: 'CASE-AMEX-2026-10005', action: 'CASE_CREATED', metadata: JSON.stringify({}) },
    { id: 'ae-10', timestamp: '2026-07-28T10:30:00.000Z', actorType: 'SYSTEM', actorId: 'RESOLVE-SYSTEM', caseId: 'CASE-AMEX-2026-10005', action: 'INVESTIGATION_COMPLETED', metadata: JSON.stringify({ status: 'AI_READY' }) },
    { id: 'ae-11', timestamp: '2026-07-28T11:00:00.000Z', actorType: 'INVESTIGATOR', actorId: 'investigator@amex.com', caseId: 'CASE-AMEX-2026-10005', action: 'REVIEW_STARTED', metadata: JSON.stringify({}) },
    { id: 'ae-12', timestamp: '2026-07-28T11:30:00.000Z', actorType: 'INVESTIGATOR', actorId: 'investigator@amex.com', caseId: 'CASE-AMEX-2026-10005', action: 'MORE_INFO_REQUESTED', metadata: JSON.stringify({ reason: 'Requesting credit voucher confirmation reference code.' }) },

    // Elena Rostova Unknown Online Seller claim
    { id: 'ae-13', timestamp: '2026-07-26T15:20:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1012', caseId: 'CASE-AMEX-2026-10006', action: 'CASE_CREATED', metadata: JSON.stringify({}) },
    { id: 'ae-14', timestamp: '2026-07-27T09:45:00.000Z', actorType: 'SYSTEM', actorId: 'RESOLVE-SYSTEM', caseId: 'CASE-AMEX-2026-10006', action: 'INVESTIGATION_COMPLETED', metadata: JSON.stringify({ status: 'AI_READY' }) },
    { id: 'ae-15', timestamp: '2026-07-27T10:00:00.000Z', actorType: 'INVESTIGATOR', actorId: 'investigator@amex.com', caseId: 'CASE-AMEX-2026-10006', action: 'CASE_ESCALATED', metadata: JSON.stringify({ reason: 'High value transaction from unauthorized merchant geolocated abroad.' }) },

    // David K Best Buy resolved approved
    { id: 'ae-16', timestamp: '2026-07-16T12:00:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1008', caseId: 'CASE-AMEX-2026-00451', action: 'CASE_CREATED', metadata: JSON.stringify({}) },
    { id: 'ae-17', timestamp: '2026-07-17T15:30:00.000Z', actorType: 'INVESTIGATOR', actorId: 'investigator@amex.com', caseId: 'CASE-AMEX-2026-00451', action: 'CASE_RESOLVED', metadata: JSON.stringify({ outcome: 'APPROVED', reason: 'Disputed charge reversed in customer favor.' }) },

    // David K Target resolved rejected
    { id: 'ae-18', timestamp: '2026-06-20T10:00:00.000Z', actorType: 'CUSTOMER', actorId: 'CUST-1008', caseId: 'CASE-AMEX-2026-00210', action: 'CASE_CREATED', metadata: JSON.stringify({}) },
    { id: 'ae-19', timestamp: '2026-06-21T11:00:00.000Z', actorType: 'INVESTIGATOR', actorId: 'investigator@amex.com', caseId: 'CASE-AMEX-2026-00210', action: 'CASE_REJECTED', metadata: JSON.stringify({ outcome: 'REJECTED', reason: 'Merchant delivery receipt proof confirmed.' }) }
  ];

  for (const event of auditEvents) {
    await dbRun(
      `INSERT INTO audit_events (id, timestamp, actorType, actorId, caseId, action, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event.id, event.timestamp, event.actorType, event.actorId, event.caseId, event.action, event.metadata]
    );
  }

  console.log('[DATABASE] fresh demo data seeding successfully completed.');
};
