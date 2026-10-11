import React, { useRef } from 'react';
import { FixtureItem } from '@/lib/client/api';

interface CaptureZoneProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: (fixtureId: string) => void;
  onManualSelect: () => void;
  fixtures: FixtureItem[];
  disabled?: boolean;
}

export function CaptureZone({
  onFileSelect,
  onSampleSelect,
  onManualSelect,
  fixtures,
  disabled = false,
}: CaptureZoneProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  return (
    <section aria-label="Item input" className="flex flex-col gap-6 py-4">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
        data-testid="camera-input"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
        data-testid="upload-input"
      />

      <div className="text-left">
        <h2 className="text-lg font-semibold text-ink">Find the right bin</h2>
        <p className="mt-1 text-sm text-muted">
          Point your phone at an item, choose a sample, or pick the material yourself.
        </p>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md bg-ink px-6 py-3 text-base font-medium text-wash hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 disabled:opacity-50"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          Take a photo
        </button>

        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          disabled={disabled}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md border border-line bg-surface px-6 py-3 text-base font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 disabled:opacity-50"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload a photo
        </button>
      </div>

      {/* Sample Quick-Pick Chips */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Try a sample item:</p>
        <div className="flex flex-wrap gap-2">
          {fixtures.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSampleSelect(f.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSampleSelect(f.id);
                }
              }}
              disabled={disabled}
              className="min-h-[44px] rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 disabled:opacity-50"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Choice Link */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onManualSelect}
          disabled={disabled}
          className="text-sm font-medium text-ink underline hover:text-ink/80 focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Pick it yourself
        </button>
      </div>
    </section>
  );
}
