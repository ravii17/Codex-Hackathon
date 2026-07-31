/**
 * Classifier Step: Classifies the case using the selected AI Provider.
 * @param {object} provider - Selected AI Provider
 * @param {object} context - Normalized intake context
 * @returns {Promise<{ classification: string, reason: string }>}
 */
export const runClassification = async (provider, context) => {
  if (!provider || typeof provider.classifyCase !== 'function') {
    throw new Error('Classifier failed: invalid AI provider');
  }
  const result = await provider.classifyCase(context);
  return {
    classification: result.classification,
    reason: result.reason
  };
};
