import { dbAll } from '../db.js';

/**
 * Context Retrieval Step: Queries SQLite to verify duplicate charges, recent history, merchant usage, and matching refunds.
 * @param {object} context - Normalized intake context
 * @returns {Promise<object>} Structured context signals
 */
export const retrieveContext = async (context) => {
  const customerId = context.customerId;
  const disputeTxId = context.transactionId;
  const merchant = context.merchant;
  const amount = context.amount;

  // Retrieve customer's transactions (excluding the disputed one itself)
  const recentTransactions = await dbAll(
    'SELECT * FROM transactions WHERE customerId = ? AND id != ? ORDER BY date DESC LIMIT 10',
    [customerId, disputeTxId]
  );

  // Retrieve transactions from same merchant (excluding current disputed one)
  const sameMerchantTransactions = await dbAll(
    'SELECT * FROM transactions WHERE customerId = ? AND merchant = ? AND id != ?',
    [customerId, merchant, disputeTxId]
  );

  // Check for duplicate charge (same merchant, same amount, date close to disputed date, e.g. within 7 days)
  const possibleDuplicate = sameMerchantTransactions.find(tx => {
    if (tx.amount !== amount) return false;
    const date1 = new Date(tx.date);
    const date2 = new Date(context.transactionDate);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  // Check for possible matching refund (negative amount equal to original transaction amount, same merchant)
  const possibleRefund = sameMerchantTransactions.find(tx => {
    return tx.amount === -amount;
  });

  // Check for merchant usage (if the customer has previously used this merchant successfully before)
  const merchantPreviouslyUsed = sameMerchantTransactions.some(tx => {
    const txDate = new Date(tx.date);
    const disputeDate = new Date(context.transactionDate);
    return txDate < disputeDate;
  });

  return {
    recentTransactionsCount: recentTransactions.length,
    matchingRefundFound: !!possibleRefund,
    possibleDuplicateFound: !!possibleDuplicate,
    merchantPreviouslyUsed: merchantPreviouslyUsed,
    refundTransactionId: possibleRefund ? possibleRefund.id : null,
    duplicateTransactionId: possibleDuplicate ? possibleDuplicate.id : null
  };
};
