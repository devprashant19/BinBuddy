import React, { useEffect, useRef, useState } from 'react';
import { Decision } from '@/lib/schemas/result';
import { Classification } from '@/lib/schemas/classification';
import { DestinationTone } from '@/lib/schemas/ruleset';
import { DestinationPanel } from './DestinationPanel';
import { VoiceButton } from './VoiceButton';

interface ResultSheetProps {
  decision: Decision;
  classification: Classification;
  destinationLabel: string;
  destinationTone: DestinationTone;
  rulesetVersion: string;
  source: 'live' | 'cache' | 'demo-sample' | 'manual';
  onTryAnother: () => void;
  onMarkSorted: () => void;
  isSorted?: boolean;
}

export function ResultSheet({
  decision,
  classification,
  destinationLabel,
  destinationTone,
  rulesetVersion,
  source,
  onTryAnother,
  onMarkSorted,
  isSorted = false,
}: ResultSheetProps) {
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus management: move focus to destination heading when result appears
    const heading = document.getElementById('destination-heading');
    if (heading) {
      heading.focus();
    }
  }, [decision]);

  return (
    <article
      ref={containerRef}
      aria-labelledby="destination-heading"
      className="flex flex-col rounded-lg border border-line bg-surface shadow-md overflow-hidden text-left"
    >
      {/* 1. Open Lid Banner */}
      <DestinationPanel label={destinationLabel} tone={destinationTone} />

      {/* 2. Decision Reason & Actions */}
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Destination & Rationale
          </span>
          <p className="mt-1 text-base sm:text-lg font-medium text-ink leading-relaxed">
            {decision.reason}
          </p>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[140px]">
            <VoiceButton disabled={true} />
          </div>

          <button
            type="button"
            onClick={onMarkSorted}
            disabled={isSorted}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              isSorted
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-ink bg-ink text-wash hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink'
            }`}
          >
            {isSorted ? (
              <>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Sorted!</span>
              </>
            ) : (
              <span>I sorted it</span>
            )}
          </button>

          <button
            type="button"
            onClick={onTryAnother}
            className="min-h-[44px] rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Try another
          </button>
        </div>

        {/* Source Badge */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Source:</span>
          <span className="rounded bg-line/40 px-2 py-0.5 font-mono text-[11px] text-ink">
            {source}
          </span>
        </div>

        {/* 3. "Why this answer" Expandable Disclosure */}
        <div className="border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setDisclosureOpen(!disclosureOpen)}
            aria-expanded={disclosureOpen}
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink hover:text-muted focus:outline-none focus:ring-2 focus:ring-ink"
          >
            <span>Why this answer</span>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${disclosureOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {disclosureOpen && (
            <div className="mt-3 space-y-2 text-xs text-muted border-t border-line/40 pt-3">
              <div>
                <span className="font-medium text-ink">Detected item: </span>
                <span>{classification.shortDescription || 'Item'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-ink">Material: </span>
                  <span>{classification.material}</span>
                </div>
                <div>
                  <span className="font-medium text-ink">Condition: </span>
                  <span>{classification.condition}</span>
                </div>
                <div>
                  <span className="font-medium text-ink">Resin code: </span>
                  <span>{classification.visibleResinCode}</span>
                </div>
                <div>
                  <span className="font-medium text-ink">Confidence: </span>
                  <span>{Math.round(classification.confidence * 100)}%</span>
                </div>
              </div>

              <div>
                <span className="font-medium text-ink">Rule applied: </span>
                <span className="font-mono">{decision.ruleId}</span>
              </div>

              {decision.matchedBecause.length > 0 && (
                <div>
                  <span className="font-medium text-ink">Matched because: </span>
                  <span>{decision.matchedBecause.join(', ')}</span>
                </div>
              )}

              <div className="pt-1">
                <span className="font-medium text-ink">Official source: </span>
                <a
                  href={decision.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-ink break-all"
                >
                  {decision.sourceUrl}
                </a>
              </div>

              <div className="text-[11px] text-muted/80">Ruleset Version: {rulesetVersion}</div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
