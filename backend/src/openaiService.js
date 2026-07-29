import { OpenAI } from 'openai';
import { config } from './config.js';

let openaiClient = null;

/**
 * Returns the initialized OpenAI client.
 * Throws an error if OPENAI_API_KEY is not configured.
 * @returns {OpenAI}
 */
export const getOpenAIClient = () => {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  return openaiClient;
};
