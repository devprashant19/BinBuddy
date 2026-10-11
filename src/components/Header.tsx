import React from 'react';

interface HeaderProps {
  isDemo?: boolean;
  isDraft?: boolean;
  cityName?: string;
}

export function Header({ isDemo = true, isDraft = false, cityName = 'Houston, TX' }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between border-b border-line pb-4 pt-2">
      <div className="flex items-center gap-2.5">
        {/* Custom inline SVG bin glyph */}
        <svg
          className="h-7 w-7 text-ink"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
        <h1 className="text-xl font-bold tracking-tight text-ink">BinBuddy</h1>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
          {cityName}
        </span>
        {isDraft && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Draft rules
          </span>
        )}
        {isDemo && (
          <span
            id="demo-mode-chip"
            className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium text-wash"
          >
            Demo mode
          </span>
        )}
      </div>
    </header>
  );
}
