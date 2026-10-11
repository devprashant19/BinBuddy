import React, { useState } from 'react';
import { Material, Condition, ResinCode, ItemType } from '@/lib/schemas/classification';

interface ManualPickerProps {
  onSubmit: (data: {
    material: Material;
    itemType: ItemType;
    condition: Condition;
    resinCode: ResinCode;
  }) => void;
  onCancel: () => void;
}

const MATERIALS: Array<{ label: string; value: Material; defaultType: ItemType }> = [
  { label: 'Plastic', value: 'plastic', defaultType: 'bottle' },
  { label: 'Paper', value: 'paper', defaultType: 'paper' },
  { label: 'Cardboard', value: 'cardboard', defaultType: 'cardboard_box' },
  { label: 'Metal', value: 'metal', defaultType: 'can' },
  { label: 'Glass', value: 'glass', defaultType: 'bottle' },
  { label: 'Carton', value: 'carton', defaultType: 'carton' },
  { label: 'Battery', value: 'battery', defaultType: 'battery' },
  { label: 'Electronics', value: 'electronic', defaultType: 'electronics' },
  { label: 'Textile', value: 'textile', defaultType: 'textile' },
  { label: 'Organic / Food', value: 'organic', defaultType: 'other' },
];

export function ManualPicker({ onSubmit, onCancel }: ManualPickerProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material>('plastic');
  const [selectedCondition, setSelectedCondition] = useState<Condition>('clean');
  const [selectedResin, setSelectedResin] = useState<ResinCode>('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matConfig = MATERIALS.find((m) => m.value === selectedMaterial);
    const itemType = matConfig ? matConfig.defaultType : 'other';

    onSubmit({
      material: selectedMaterial,
      itemType,
      condition: selectedCondition,
      resinCode: selectedMaterial === 'plastic' ? selectedResin : 'not_applicable',
    });
  };

  return (
    <section
      aria-labelledby="manual-picker-heading"
      className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-6 shadow-sm text-left"
    >
      <div className="border-b border-line pb-3">
        <h2 id="manual-picker-heading" className="text-xl font-bold text-ink">
          Pick the item yourself
        </h2>
        <p className="mt-1 text-xs text-muted">
          Select what the item is made of and whether it has food residue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Material Selection Grid */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Material
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MATERIALS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedMaterial(m.value)}
                className={`min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedMaterial === m.value
                    ? 'border-ink bg-ink text-wash'
                    : 'border-line bg-surface text-ink hover:bg-wash'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Condition Toggle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Cleanliness Condition
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedCondition('clean')}
              className={`min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium ${
                selectedCondition === 'clean'
                  ? 'border-ink bg-ink text-wash'
                  : 'border-line bg-surface text-ink hover:bg-wash'
              }`}
            >
              Clean & empty
            </button>
            <button
              type="button"
              onClick={() => setSelectedCondition('soiled')}
              className={`min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium ${
                selectedCondition === 'soiled'
                  ? 'border-ink bg-ink text-wash'
                  : 'border-line bg-surface text-ink hover:bg-wash'
              }`}
            >
              Food-soiled or greasy
            </button>
          </div>
        </div>

        {/* Resin Code (if plastic) */}
        {selectedMaterial === 'plastic' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Resin Number (if marked)
            </label>
            <div className="flex flex-wrap gap-2">
              {(['1', '2', '3', '4', '5', '6', '7', 'not_visible'] as ResinCode[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedResin(r)}
                  className={`min-h-[44px] min-w-[44px] rounded-md border px-3 py-2 text-xs font-medium ${
                    selectedResin === r
                      ? 'border-ink bg-ink text-wash'
                      : 'border-line bg-surface text-ink hover:bg-wash'
                  }`}
                >
                  {r === 'not_visible' ? 'No number' : `#${r}`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <button
            type="submit"
            className="min-h-[48px] flex-1 rounded-md bg-ink px-4 py-2.5 text-base font-medium text-wash hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Find bin
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
