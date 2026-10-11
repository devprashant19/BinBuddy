import { Classification } from '../schemas/classification';
import { Result, Answers } from '../schemas/result';
import { ApiError } from '../schemas/errors';

export interface ClassifyResponse {
  requestId: string;
  source: 'live' | 'cache' | 'demo-sample' | 'manual';
  classification: Classification;
  result: Result;
}

export interface RulesResponse {
  rulesetId: string;
  version: string;
  city: { name: string; region: string; country: string };
  sourceUrl: string;
  lastVerifiedAt: string;
  draft: boolean;
  destinations: Array<{
    id: string;
    label: string;
    tone: 'recycle' | 'landfill' | 'special' | 'manual' | 'yard';
    description: string;
  }>;
}

export interface FixtureItem {
  id: string;
  label: string;
  description: string;
}

export interface HealthResponse {
  ok: boolean;
  version: string;
  rulesetId: string;
  rulesetVersion: string;
  draft: boolean;
  providers: {
    gemini: 'live' | 'demo';
    elevenlabs: 'live' | 'unconfigured';
  };
  time: string;
}

export class ClientApiError extends Error {
  public readonly code: string;
  public readonly hint: string;
  public readonly requestId?: string;

  constructor(error: ApiError['error']) {
    super(error.message);
    this.name = 'ClientApiError';
    this.code = error.code;
    this.hint = error.hint;
    this.requestId = error.requestId;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      throw new Error(`Server returned status ${res.status}`);
    }
    if (errorData?.error) {
      throw new ClientApiError(errorData.error);
    }
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch('/api/health', { signal });
  return handleResponse<HealthResponse>(res);
}

export async function fetchRules(signal?: AbortSignal): Promise<RulesResponse> {
  const res = await fetch('/api/rules', { signal });
  return handleResponse<RulesResponse>(res);
}

export async function fetchFixtures(signal?: AbortSignal): Promise<FixtureItem[]> {
  const res = await fetch('/api/fixtures', { signal });
  return handleResponse<FixtureItem[]>(res);
}

export async function classifyFixture(
  fixtureId: string,
  signal?: AbortSignal
): Promise<ClassifyResponse> {
  const res = await fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixtureId }),
    signal,
  });
  return handleResponse<ClassifyResponse>(res);
}

export async function classifyImage(
  file: Blob | File,
  signal?: AbortSignal
): Promise<ClassifyResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch('/api/classify', {
    method: 'POST',
    body: formData,
    signal,
  });
  return handleResponse<ClassifyResponse>(res);
}

export async function submitDecision(
  classification: Classification,
  answers: Answers = {},
  signal?: AbortSignal
): Promise<ClassifyResponse> {
  const res = await fetch('/api/decide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classification, answers }),
    signal,
  });
  return handleResponse<ClassifyResponse>(res);
}
