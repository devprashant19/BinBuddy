import { ClassifierProvider } from './types';
import { mockProvider } from './mock';
import { GeminiClassifierProvider } from './gemini';
import { getEnv } from '../config/env';

let cachedGeminiProvider: GeminiClassifierProvider | null = null;

export function getClassifierProvider(): ClassifierProvider {
  const env = getEnv();

  // Test failure injection (strictly bypassed in production)
  if (env.FORCE_FAILURE === 'gemini' || env.FORCE_FAILURE === 'both') {
    throw new Error('CLASSIFIER_UNAVAILABLE: Injected simulated provider failure.');
  }

  if (env.PROVIDER_MODE !== 'mock' && env.GEMINI_API_KEY) {
    if (!cachedGeminiProvider) {
      cachedGeminiProvider = new GeminiClassifierProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
    }
    return cachedGeminiProvider;
  }

  return mockProvider;
}
