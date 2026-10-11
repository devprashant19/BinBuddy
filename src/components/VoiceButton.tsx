import React, { useState, useEffect } from 'react';
import {
  speakNarration,
  stopCurrentSpeech,
  VoiceState,
  getAutoSpeakPreference,
  setAutoSpeakPreference,
} from '@/lib/client/speech';

interface VoiceButtonProps {
  ruleId: string;
  rulesetVersion: string;
  narration: string;
}

export function VoiceButton({ ruleId, rulesetVersion, narration }: VoiceButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [autoSpeak, setAutoSpeak] = useState(false);

  useEffect(() => {
    setAutoSpeak(getAutoSpeakPreference());
  }, []);

  // Handle auto-speak preference
  useEffect(() => {
    if (autoSpeak && ruleId && narration) {
      speakNarration({
        ruleId,
        rulesetVersion,
        narration,
        onStateChange: setVoiceState,
      });
    }

    return () => {
      stopCurrentSpeech();
    };
  }, [ruleId, rulesetVersion, narration, autoSpeak]);

  const handleToggleAutoSpeak = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setAutoSpeak(next);
    setAutoSpeakPreference(next);
  };

  const handleVoiceTap = () => {
    if (voiceState === 'playing' || voiceState === 'fallback') {
      stopCurrentSpeech();
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'loading') {
      return;
    }

    speakNarration({
      ruleId,
      rulesetVersion,
      narration,
      onStateChange: setVoiceState,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleVoiceTap}
          disabled={voiceState === 'unavailable'}
          data-testid="voice-button"
          className={`flex min-h-[44px] items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ink ${
            voiceState === 'playing' || voiceState === 'fallback'
              ? 'border-ink bg-ink text-wash'
              : voiceState === 'unavailable'
              ? 'cursor-not-allowed border-line bg-wash/50 text-muted opacity-60'
              : 'border-line bg-surface text-ink hover:bg-wash'
          }`}
          aria-label={
            voiceState === 'playing' || voiceState === 'fallback'
              ? 'Stop narration'
              : 'Hear result spoken aloud'
          }
        >
          {voiceState === 'loading' && (
            <svg
              className="h-4 w-4 animate-spin text-ink"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {voiceState !== 'loading' && (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}

          <span>
            {voiceState === 'idle' && 'Hear it'}
            {voiceState === 'loading' && 'Preparing audio...'}
            {voiceState === 'playing' && 'Playing'}
            {voiceState === 'fallback' && 'Playing (browser voice)'}
            {voiceState === 'unavailable' && 'Voice unavailable'}
          </span>
        </button>

        {voiceState === 'fallback' && (
          <span className="rounded bg-wash px-2 py-0.5 text-xs text-muted" data-testid="voice-fallback-label">
            browser voice
          </span>
        )}
      </div>

      {/* Optional Auto-speak toggle, off by default */}
      <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
        <input
          type="checkbox"
          checked={autoSpeak}
          onChange={handleToggleAutoSpeak}
          className="rounded border-line text-ink focus:ring-ink"
        />
        <span>Speak results automatically</span>
      </label>
    </div>
  );
}
