import { ClassifierProvider } from './types';
import { mockProvider } from './mock';
import { getEnv } from '../config/env';

export function getClassifierProvider(): ClassifierProvider {
  const env = getEnv();

  // Test failure injection (strictly bypassed in production)
  if (env.FORCE_FAILURE === 'gemini' || env.FORCE_FAILURE === 'both') {
    throw new Error('CLASSIFIER_UNAVAILABLE: Injected simulated provider failure.');
  }

  // Phase 2 uses mock provider. Phase 4 wires live Gemini when key present.
  return mockProvider;
}
