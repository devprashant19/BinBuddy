import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  PROVIDER_MODE: z.enum(['auto', 'mock']).default('auto'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  ELEVENLABS_API_KEY: z.string().optional().default(''),
  ELEVENLABS_VOICE_ID: z.string().default('EXAVITQu4vr4xnSDxMaL'),
  ELEVENLABS_MODEL_ID: z.string().default('eleven_flash_v2_5'),
  CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.65),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(8),
  RATE_LIMIT_PER_MIN: z.coerce.number().positive().default(20),
  RULESET_ID: z.string().default('houston-tx-curbside'),
  AUDIO_CACHE_DIR: z.string().default('.cache/audio'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  FORCE_FAILURE: z.enum(['none', 'gemini', 'elevenlabs', 'both']).default('none'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (typeof window !== 'undefined') {
    throw new Error('Environment configuration must only be accessed on the server side.');
  }

  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }

  const env = parsed.data;

  // In production, failure injection is strictly disabled
  if (env.NODE_ENV === 'production') {
    env.FORCE_FAILURE = 'none';
  }

  cachedEnv = env;
  return env;
}
