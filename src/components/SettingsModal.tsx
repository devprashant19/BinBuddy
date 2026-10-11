'use client';

import React, { useState, useEffect } from 'react';
import { getAutoSpeakPreference, setAutoSpeakPreference } from '@/lib/client/speech';
import { resetTally } from '@/lib/client/tally';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTallyReset?: () => void;
}

export function SettingsModal({ isOpen, onClose, onTallyReset }: SettingsModalProps) {
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAutoSpeak(getAutoSpeakPreference());
      setShowConfirmReset(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleAutoSpeak = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoSpeak(val);
    setAutoSpeakPreference(val);
  };

  const handleConfirmReset = () => {
    resetTally();
    setShowConfirmReset(false);
    if (onTallyReset) onTallyReset();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 id="settings-heading" className="text-lg font-bold text-ink">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-wash hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-5">
          {/* Voice Setting */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="settings-auto-speak" className="block text-sm font-medium text-ink cursor-pointer">
                Speak results automatically
              </label>
              <p className="text-xs text-muted">Narration plays upon result arrival without tapping</p>
            </div>
            <input
              id="settings-auto-speak"
              type="checkbox"
              checked={autoSpeak}
              onChange={handleToggleAutoSpeak}
              className="h-4 w-4 rounded border-line text-ink focus:ring-ink"
            />
          </div>

          {/* Reset Tally */}
          <div className="border-t border-line pt-4">
            {!showConfirmReset ? (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="w-full rounded border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
              >
                Reset sorted count
              </button>
            ) : (
              <div className="flex flex-col gap-2 rounded bg-wash p-3">
                <p className="text-xs text-ink font-medium">Reset your personal sorted count to 0?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="flex-1 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-wash hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ink"
                  >
                    Yes, reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 rounded border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded bg-ink py-2 text-sm font-medium text-wash hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
