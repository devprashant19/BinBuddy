const TALLY_STORAGE_KEY = 'binbuddy.tally.v1';

let inMemoryTally = 0;

/**
 * Safely retrieve the current tally count.
 * Handles storage errors (e.g. private browsing or disabled storage) and corrupted values.
 */
export function getTally(): number {
  if (typeof window === 'undefined') {
    return inMemoryTally;
  }

  try {
    const raw = localStorage.getItem(TALLY_STORAGE_KEY);
    if (raw === null) {
      return inMemoryTally;
    }

    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0) {
      localStorage.setItem(TALLY_STORAGE_KEY, '0');
      inMemoryTally = 0;
      return 0;
    }

    inMemoryTally = parsed;
    return parsed;
  } catch {
    return inMemoryTally;
  }
}

/**
 * Safely increment the tally by 1.
 * Returns the updated tally count.
 */
export function incrementTally(): number {
  const current = getTally();
  const next = current + 1;
  inMemoryTally = next;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TALLY_STORAGE_KEY, next.toString());
      window.dispatchEvent(new CustomEvent('binbuddy:tally-updated', { detail: next }));
    } catch {
      // Storage unavailable or full; in-memory count remains valid for current session
    }
  }

  return next;
}

/**
 * Safely reset the tally to 0.
 */
export function resetTally(): void {
  inMemoryTally = 0;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TALLY_STORAGE_KEY, '0');
      window.dispatchEvent(new CustomEvent('binbuddy:tally-updated', { detail: 0 }));
    } catch {
      // Storage unavailable
    }
  }
}
