import { describe, it, expect } from 'vitest';

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function getLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(parseHex(hex1));
  const l2 = getLuminance(parseHex(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Design Token Accessibility Contrast Ratios', () => {
  const white = '#FFFFFF';

  const binColors: Record<string, string> = {
    recycle: '#1a5fb4',
    landfill: '#3f4954',
    special: '#8a4500',
    yard: '#1a6b3f',
  };

  it.each(Object.entries(binColors))(
    'ensures %s (%s) against white text achieves >= 4.5:1 contrast ratio',
    (name, hex) => {
      const ratio = getContrastRatio(hex, white);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  );

  it('ensures ink text against wash background achieves >= 4.5:1 contrast', () => {
    const ink = '#16231f';
    const wash = '#f1f4f1';
    const ratio = getContrastRatio(ink, wash);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
