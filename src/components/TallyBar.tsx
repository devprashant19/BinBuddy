import React from 'react';

interface TallyBarProps {
  count?: number;
}

export function TallyBar({ count = 0 }: TallyBarProps) {
  return (
    <div
      role="region"
      aria-label="Item tally"
      className="flex items-center justify-between border-t border-line py-3 text-xs text-muted"
    >
      <span>Items you marked as sorted: {count} (your own count)</span>
    </div>
  );
}
