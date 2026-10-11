import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClassifierProvider } from '@/lib/providers/gemini';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN',
      ARRAY: 'ARRAY',
    },
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('GeminiClassifierProvider', () => {
  let provider: GeminiClassifierProvider;
  const dummyInput = {
    bytes: Buffer.from('fake-image-bytes'),
    mime: 'image/jpeg',
  };

  const validClassificationOutput = {
    itemType: 'bottle',
    material: 'plastic',
    condition: 'clean',
    visibleResinCode: '1',
    confidence: 0.95,
    shortDescription: 'Clear plastic water bottle',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiClassifierProvider('test-api-key', 'gemini-2.5-flash');
  });

  it('successfully classifies an image with valid structured JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(validClassificationOutput),
    });

    const result = await provider.classify(dummyInput);
    expect(result).toEqual(validClassificationOutput);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('retries once if model returns invalid JSON, then succeeds on retry', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({
        text: 'This is not json',
      })
      .mockResolvedValueOnce({
        text: JSON.stringify(validClassificationOutput),
      });

    const result = await provider.classify(dummyInput);
    expect(result).toEqual(validClassificationOutput);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('fails with CLASSIFIER_BAD_OUTPUT if JSON is invalid on both attempts', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({ text: 'Broken json 1' })
      .mockResolvedValueOnce({ text: 'Broken json 2' });

    await expect(provider.classify(dummyInput)).rejects.toThrow(/CLASSIFIER_BAD_OUTPUT/);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('strictly rejects response with extra injected fields (e.g. bin or advice)', async () => {
    const injectedOutput = {
      ...validClassificationOutput,
      bin: 'recycling_cart', // Not in Zod schema
    };

    mockGenerateContent
      .mockResolvedValueOnce({ text: JSON.stringify(injectedOutput) })
      .mockResolvedValueOnce({ text: JSON.stringify(injectedOutput) });

    await expect(provider.classify(dummyInput)).rejects.toThrow(/CLASSIFIER_BAD_OUTPUT/);
  });

  it('strictly rejects response with invalid material enum values', async () => {
    const invalidEnumOutput = {
      ...validClassificationOutput,
      material: 'uranium', // Not in material enum
    };

    mockGenerateContent
      .mockResolvedValueOnce({ text: JSON.stringify(invalidEnumOutput) })
      .mockResolvedValueOnce({ text: JSON.stringify(invalidEnumOutput) });

    await expect(provider.classify(dummyInput)).rejects.toThrow(/CLASSIFIER_BAD_OUTPUT/);
  });

  it('retries on transient 429 rate limit error with backoff and succeeds', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'))
      .mockResolvedValueOnce({
        text: JSON.stringify(validClassificationOutput),
      });

    const result = await provider.classify(dummyInput);
    expect(result).toEqual(validClassificationOutput);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('throws CLASSIFIER_UNAVAILABLE on repeated 500 errors', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('500 INTERNAL'))
      .mockRejectedValueOnce(new Error('500 INTERNAL'));

    await expect(provider.classify(dummyInput)).rejects.toThrow(/CLASSIFIER_UNAVAILABLE/);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });
});
