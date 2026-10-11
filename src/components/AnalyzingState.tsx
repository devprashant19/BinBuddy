import React from 'react';

interface AnalyzingStateProps {
  onCancel: () => void;
}

export function AnalyzingState({ onCancel }: AnalyzingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-6 shadow-sm"
    >
      {/* Skeleton lid */}
      <div className="h-32 w-full animate-pulse rounded-t-lg bg-line/60" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          <p className="text-base font-medium text-ink">Looking at your item</p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-line/40" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-line/30" />
      </div>
    </div>
  );
}
