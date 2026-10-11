import React, { useEffect } from 'react';
import { DestinationPanel } from './DestinationPanel';

interface ManualCheckPanelProps {
  reason: string;
  sourceUrl: string;
  onPickYourself: () => void;
  onTryAnother: () => void;
}

export function ManualCheckPanel({
  reason,
  sourceUrl,
  onPickYourself,
  onTryAnother,
}: ManualCheckPanelProps) {
  useEffect(() => {
    const heading = document.getElementById('destination-heading');
    if (heading) heading.focus();
  }, []);

  return (
    <article
      aria-labelledby="destination-heading"
      className="flex flex-col rounded-lg border border-line bg-surface shadow-md overflow-hidden text-left"
    >
      <DestinationPanel label="Manual check" tone="manual" />

      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Official Guidance Required
          </span>
          <p className="mt-1 text-base sm:text-lg font-medium text-ink leading-relaxed">{reason}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-wash hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Check city guidance
          </a>

          <button
            type="button"
            onClick={onPickYourself}
            className="min-h-[44px] flex-1 rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Pick it yourself
          </button>

          <button
            type="button"
            onClick={onTryAnother}
            className="min-h-[44px] rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Try another
          </button>
        </div>
      </div>
    </article>
  );
}
