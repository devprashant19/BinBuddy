import React from 'react';
import { Clarification } from '@/lib/schemas/result';
import { Classification } from '@/lib/schemas/classification';

interface ClarifyPanelProps {
  clarification: Clarification;
  classification: Classification;
  onAnswer: (value: string) => void;
  onCancel: () => void;
}

export function ClarifyPanel({
  clarification,
  classification,
  onAnswer,
  onCancel,
}: ClarifyPanelProps) {
  return (
    <section
      aria-labelledby="clarify-heading"
      className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-6 shadow-sm text-left"
    >
      <div className="border-b border-line pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Need clarification
        </span>
        <h2 id="clarify-heading" className="mt-1 text-xl font-bold text-ink">
          {clarification.question}
        </h2>
        <p className="mt-1.5 text-xs text-muted">
          BinBuddy saw: {classification.shortDescription || 'an item'}.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {clarification.options.map((opt: { label: string; value: string }) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAnswer(opt.value)}
            className="flex min-h-[48px] w-full items-center justify-between rounded-md border border-line bg-wash/60 px-5 py-3 text-left text-sm font-medium text-ink hover:bg-line/40 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
          >
            <span>{opt.label}</span>
            <svg
              className="h-4 w-4 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-muted underline hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Cancel and try another
        </button>
      </div>
    </section>
  );
}
