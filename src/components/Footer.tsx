import React from 'react';

interface FooterProps {
  sourceUrl?: string;
  rulesetVersion?: string;
  lastVerifiedAt?: string;
}

export function Footer({
  sourceUrl = 'https://www.houstontx.gov/solidwaste/recycling.html',
  rulesetVersion = '1.0.0',
  lastVerifiedAt = '2026-10-11',
}: FooterProps) {
  return (
    <footer className="mt-8 border-t border-line pt-4 text-xs text-muted">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span>Rules: </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-ink"
          >
            City of Houston Solid Waste Management
          </a>
          <span className="ml-1.5 text-muted/80">
            (v{rulesetVersion}, verified {lastVerifiedAt.slice(0, 10)})
          </span>
        </div>
        <div className="text-muted/80">Built during CodeRED: Orion • Hackathon 2026</div>
      </div>
      <p className="mt-2 text-muted/70">
        Photos are sent to Gemini to describe the item. BinBuddy does not store them.
      </p>
    </footer>
  );
}
