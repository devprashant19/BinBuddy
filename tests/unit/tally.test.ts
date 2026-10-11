import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTally, incrementTally, resetTally } from '@/lib/client/tally';

describe('Tally manager (lib/client/tally)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    resetTally();

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });

    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    });
  });

  it('initializes to 0 when storage is empty', () => {
    expect(getTally()).toBe(0);
  });

  it('increments tally sequentially and updates storage', () => {
    expect(incrementTally()).toBe(1);
    expect(incrementTally()).toBe(2);
    expect(getTally()).toBe(2);
    expect(mockStorage['binbuddy.tally.v1']).toBe('2');
  });

  it('resets tally to 0', () => {
    incrementTally();
    incrementTally();
    expect(getTally()).toBe(2);

    resetTally();
    expect(getTally()).toBe(0);
    expect(mockStorage['binbuddy.tally.v1']).toBe('0');
  });

  it('recovers gracefully from corrupted non-numeric storage values', () => {
    mockStorage['binbuddy.tally.v1'] = 'invalid_corrupted_data';
    expect(getTally()).toBe(0);
    expect(mockStorage['binbuddy.tally.v1']).toBe('0');
  });

  it('recovers gracefully from negative storage values', () => {
    mockStorage['binbuddy.tally.v1'] = '-15';
    expect(getTally()).toBe(0);
    expect(mockStorage['binbuddy.tally.v1']).toBe('0');
  });

  it('survives when localStorage.getItem throws SecurityError (private mode / blocked)', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('SecurityError: Access is denied for this document.');
      }),
      setItem: vi.fn(),
    });

    expect(() => getTally()).not.toThrow();
    expect(getTally()).toBe(0);
  });

  it('survives when localStorage.setItem throws QuotaExceededError', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => '3'),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
    });

    expect(() => incrementTally()).not.toThrow();
    // in-memory tally is updated to 4
    expect(incrementTally()).toBe(4);
  });
});
