/**
 * Abstract class representing the AI Provider interface.
 * Any AI provider (Mock, OpenAI, etc.) must implement these methods.
 */
export class AIProviderInterface {
  /**
   * Classifies the dispute case.
   * @param {object} context - Intake normalized context.
   * @returns {Promise<{ classification: string, reason: string }>}
   */
  async classifyCase(context) {
    throw new Error('classifyCase not implemented');
  }

  /**
   * Evaluates facts extracted from evidence.
   * @param {object} context - Intake normalized context.
   * @param {Array} evidence - Uploaded evidence items with optional metadata.
   * @returns {Promise<Array>} List of extracted facts.
   */
  async analyzeEvidence(context, evidence) {
    throw new Error('analyzeEvidence not implemented');
  }

  /**
   * Generates a recommended action based on context.
   * @param {object} context - Investigation current context.
   * @returns {Promise<{ recommendedAction: string, recommendationExplanation: string }>}
   */
  async generateRecommendation(context) {
    throw new Error('generateRecommendation not implemented');
  }
}
