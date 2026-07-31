import { AIProviderInterface } from './AIProviderInterface.js';

export class MockAIProvider extends AIProviderInterface {
  /**
   * Classifies the dispute case based on natural language keywords and context.
   * @param {object} context - Intake normalized context.
   * @returns {Promise<{ classification: string, reason: string }>}
   */
  async classifyCase(context) {
    const text = `${context.disputeReason} ${context.customerStatement}`.toLowerCase();
    
    let classification = 'OTHER';
    let reason = 'OTHER';

    if (
      text.includes('unauthorized') || 
      text.includes('fraud') || 
      text.includes('not recognize') || 
      text.includes('never made') || 
      text.includes('did not make') ||
      text.includes('stolen') ||
      text.includes('lost')
    ) {
      classification = 'FRAUD';
      reason = 'FRAUD';
    } else if (
      text.includes('twice') || 
      text.includes('double') || 
      text.includes('duplicate') || 
      text.includes('charged twice')
    ) {
      classification = 'DUPLICATE_CHARGE';
      reason = 'DUPLICATE_CHARGE';
    } else if (
      text.includes('refund') || 
      text.includes('cancelled') || 
      text.includes('canceled')
    ) {
      classification = 'MERCHANT_DISPUTE';
      reason = 'REFUND_NOT_RECEIVED';
    } else if (
      text.includes('never arrived') || 
      text.includes('not received') || 
      text.includes('never received') || 
      text.includes('did not arrive') ||
      text.includes('missing package')
    ) {
      classification = 'MERCHANT_DISPUTE';
      reason = 'PRODUCT_NOT_RECEIVED';
    } else if (
      text.includes('service') || 
      text.includes('contractor') || 
      text.includes('job') ||
      text.includes('work not completed')
    ) {
      classification = 'MERCHANT_DISPUTE';
      reason = 'SERVICE_NOT_RECEIVED';
    } else if (
      text.includes('amount') || 
      text.includes('overcharged') || 
      text.includes('incorrect') || 
      text.includes('wrong amount')
    ) {
      classification = 'INCORRECT_AMOUNT';
      reason = 'INCORRECT_AMOUNT';
    }

    return { classification, reason };
  }

  /**
   * Analyzes evidence files, extracting facts based on file characteristics and seeded metadata.
   * @param {object} context 
   * @param {Array} evidenceFiles 
   * @returns {Promise<Array>}
   */
  async analyzeEvidence(context, evidenceFiles) {
    const facts = [];
    evidenceFiles.forEach(file => {
      const name = file.name.toLowerCase();
      let data = {};
      if (file.extractedData) {
        try {
          data = typeof file.extractedData === 'string' ? JSON.parse(file.extractedData) : file.extractedData;
        } catch (e) {
          // Ignore parsing error
        }
      }

      // Add basic fact details
      const fact = {
        fileId: file.id,
        fileName: file.name,
        label: file.category,
        merchant: data.merchant || context.merchant,
        amount: data.amount || context.amount,
        ...data
      };

      // Rules to infer facts from filename if not explicitly in extractedData
      if (name.includes('invoice') || name.includes('receipt') || name.includes('booking')) {
        fact.purchaseEvidence = true;
      }
      if (name.includes('cancel') || name.includes('refund') || name.includes('communication') || name.includes('email') || name.includes('chat')) {
        fact.merchantAcknowledgement = true;
        fact.refundPromised = name.includes('refund');
        fact.cancellationDate = context.transactionDate;
      }

      facts.push(fact);
    });

    return facts;
  }

  /**
   * Generates a recommended action based on context.
   * @param {object} context 
   * @returns {Promise<{ recommendedAction: string, recommendationExplanation: string }>}
   */
  async generateRecommendation(context) {
    return {
      recommendedAction: 'MANUAL_REVIEW',
      recommendationExplanation: 'Mock AI Provider analysis complete.'
    };
  }
}
export default MockAIProvider;
