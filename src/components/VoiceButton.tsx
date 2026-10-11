import React from 'react';

interface VoiceButtonProps {
  disabled?: boolean;
}

export function VoiceButton({ disabled = true }: VoiceButtonProps) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={disabled}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-muted opacity-60 cursor-not-allowed"
        title="Spoken narration integration arriving in Phase 5"
        aria-label="Spoken results (unconfigured in this phase)"
      >
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
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <span>Hear it (Phase 5)</span>
      </button>
      <span className="text-[11px] text-muted">Spoken narration enabled with ElevenLabs</span>
    </div>
  );
}
