'use client';

import React, { useState, useEffect } from 'react';
import { getTally } from '@/lib/client/tally';
import { SettingsModal } from './SettingsModal';

export function TallyBar() {
  const [tally, setTally] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setTally(getTally());

    const handleTallyUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === 'number') {
        setTally(customEvent.detail);
      } else {
        setTally(getTally());
      }
    };

    window.addEventListener('binbuddy:tally-updated', handleTallyUpdate);
    return () => {
      window.removeEventListener('binbuddy:tally-updated', handleTallyUpdate);
    };
  }, []);

  return (
    <>
      <section
        aria-label="Personal sorting tally"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-wash/60 px-4 py-3 text-xs text-muted"
      >
        <span data-testid="tally-count" className="font-medium text-ink">
          Items you marked as sorted: {tally} (your own count)
        </span>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          data-testid="settings-button"
          className="rounded border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Settings
        </button>
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onTallyReset={() => setTally(0)}
      />
    </>
  );
}
