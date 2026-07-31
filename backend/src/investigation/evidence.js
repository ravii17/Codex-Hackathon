import { dbAll } from '../db.js';

/**
 * Evidence Analysis Step: Loads uploaded evidence from the database and runs provider analysis.
 * @param {object} provider - AI provider instance
 * @param {object} context - Normalized intake context
 * @returns {Promise<{ evidenceFilesCount: number, evidenceFacts: Array }>}
 */
export const analyzeEvidence = async (provider, context) => {
  if (!provider || typeof provider.analyzeEvidence !== 'function') {
    throw new Error('Evidence analysis failed: invalid AI provider');
  }

  // Load evidence files from SQLite for this dispute
  const evidenceFiles = await dbAll(
    'SELECT * FROM evidence_files WHERE disputeId = ?',
    [context.disputeId]
  );

  // Run provider analysis on the files
  const facts = await provider.analyzeEvidence(context, evidenceFiles);

  return {
    evidenceFilesCount: evidenceFiles.length,
    evidenceFacts: facts
  };
};
