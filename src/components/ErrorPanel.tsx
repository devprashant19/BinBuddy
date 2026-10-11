import React from 'react';

interface ErrorPanelProps {
  message: string;
  hint?: string;
  onRetry: () => void;
  onUseSample: () => void;
  onManualPick: () => void;
}

export function ErrorPanel({ message, hint, onRetry, onUseSample, onManualPick }: ErrorPanelProps) {
  return (
    <section
      role="alert"
      aria-labelledby="error-heading"
      className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-6 shadow-sm text-left"
    >
      <div className="border-b border-line pb-4">
        <h2 id="error-heading" className="text-lg font-bold text-ink">
          Analysis uncompleted
        </h2>
        <p className="mt-2 text-sm text-ink">{message}</p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] flex-1 rounded-md bg-ink px-4 py-2 text-sm font-medium text-wash hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onUseSample}
          className="min-h-[44px] flex-1 rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Use a sample
        </button>
        <button
          type="button"
          onClick={onManualPick}
          className="min-h-[44px] flex-1 rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Pick it yourself
        </button>
      </div>
    </section>
  );
}
