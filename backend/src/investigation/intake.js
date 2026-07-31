/**
 * Intake Step: Normalizes structured context from case, dispute, and transaction details.
 * @param {object} caseRecord 
 * @param {object} disputeRecord 
 * @param {object} transactionRecord 
 * @returns {object} Intake normalized context
 */
export const runIntake = (caseRecord, disputeRecord, transactionRecord) => {
  if (!caseRecord || !disputeRecord || !transactionRecord) {
    throw new Error('Intake failed: missing required records');
  }

  // Validate required information
  if (!disputeRecord.reason || !transactionRecord.merchant) {
    throw new Error('Intake failed: missing required fields');
  }

  let questionnaireObj = {};
  try {
    questionnaireObj = typeof disputeRecord.questionnaire === 'string' 
      ? JSON.parse(disputeRecord.questionnaire) 
      : (disputeRecord.questionnaire || {});
  } catch (e) {
    // Ignore parsing issues, default to empty
  }

  return {
    caseId: caseRecord.id,
    disputeId: disputeRecord.id,
    transactionId: transactionRecord.id,
    customerId: caseRecord.customerId,
    merchant: transactionRecord.merchant,
    amount: transactionRecord.amount,
    transactionDate: transactionRecord.date,
    disputeReason: disputeRecord.reason,
    customerStatement: questionnaireObj.additionalInfo || ''
  };
};
