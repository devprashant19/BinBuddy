import { describe, it, expect, beforeEach } from 'vitest';
import { getEnv } from '@/lib/config/env';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset env vars before test
    process.env.PROVIDER_MODE = 'auto';
    process.env.CONFIDENCE_THRESHOLD = '0.65';
  });

  it('provides safe defaults for unconfigured environment', () => {
    const env = getEnv();
    expect(env.RULESET_ID).toBe('houston-tx-curbside');
    expect(env.CONFIDENCE_THRESHOLD).toBe(0.65);
    expect(env.MAX_UPLOAD_MB).toBe(8);
  });

  it('disables failure injection in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.FORCE_FAILURE = 'gemini';

    const env = getEnv();
    expect(env.FORCE_FAILURE).toBe('none');

    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
  });
});
