import React from 'react';
import { DestinationTone } from '@/lib/schemas/ruleset';

interface DestinationPanelProps {
  label: string;
  tone: DestinationTone;
}

export function DestinationPanel({ label, tone }: DestinationPanelProps) {
  const getToneStyles = (tone: DestinationTone) => {
    switch (tone) {
      case 'recycle':
        return {
          backgroundColor: 'var(--bin-recycle)',
          color: '#ffffff',
          icon: (
            <svg
              className="h-9 w-9 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
              <path d="M11 19h8.2a1.8 1.8 0 0 0 1.55-.89 1.8 1.8 0 0 0 0-1.78L17.5 11" />
              <path d="m14 2-5 8h10l-5-8z" />
            </svg>
          ),
        };
      case 'landfill':
        return {
          backgroundColor: 'var(--bin-landfill)',
          color: '#ffffff',
          icon: (
            <svg
              className="h-9 w-9 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          ),
        };
      case 'special':
        return {
          backgroundColor: 'var(--bin-special)',
          color: '#ffffff',
          icon: (
            <svg
              className="h-9 w-9 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      case 'yard':
        return {
          backgroundColor: 'var(--bin-yard)',
          color: '#ffffff',
          icon: (
            <svg
              className="h-9 w-9 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          ),
        };
      case 'manual':
      default:
        return {
          backgroundColor: 'var(--bin-manual-bg)',
          color: 'var(--bin-manual)',
          isStriped: true,
          icon: (
            <svg
              className="h-9 w-9 shrink-0 text-ink"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
    }
  };

  const styleInfo = getToneStyles(tone);

  return (
    <div
      className={`relative w-full rounded-t-lg transition-transform duration-300 ease-out ${
        styleInfo.isStriped ? 'border-2 border-line' : ''
      }`}
      style={{
        backgroundColor: styleInfo.backgroundColor,
        backgroundImage: styleInfo.isStriped
          ? 'repeating-linear-gradient(45deg, #f1f4f1, #f1f4f1 10px, #ffffff 10px, #ffffff 20px)'
          : undefined,
        color: styleInfo.color,
      }}
    >
      {/* Lid overhang lip */}
      <div className="h-2 w-full rounded-t-lg bg-black/15" aria-hidden="true" />

      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="destination-heading"
            tabIndex={-1}
            className="text-left font-extrabold uppercase tracking-tight leading-none"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)' }}
          >
            {label}
          </h2>
          <div className="mt-1 shrink-0">{styleInfo.icon}</div>
        </div>
      </div>
    </div>
  );
}
