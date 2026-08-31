/**
 * Per-item figure display sizes for AR stem + option tiles.
 * Mirrors backend `arFigureDisplaySize.ts`.
 */
export type ArFigureDisplaySize = 'small' | 'medium' | 'large';

export const AR_FIGURE_DISPLAY_SIZES: readonly ArFigureDisplaySize[] = [
  'small',
  'medium',
  'large',
] as const;

/** Multipliers vs the default medium exam caps. */
export const AR_FIGURE_SIZE_MULTIPLIER: Record<ArFigureDisplaySize, number> = {
  small: 0.75,
  medium: 1,
  large: 1.75,
};

export function normalizeArFigureDisplaySize(
  raw: unknown,
  fallback: ArFigureDisplaySize = 'medium'
): ArFigureDisplaySize {
  if (raw === 'small' || raw === 'medium' || raw === 'large') return raw;
  if (raw === 'normal') return 'medium';
  return fallback;
}

export function arFigureSizeMultiplier(
  size: ArFigureDisplaySize | 'normal' | null | undefined
): number {
  return AR_FIGURE_SIZE_MULTIPLIER[normalizeArFigureDisplaySize(size)];
}

export function scaleExamFigureCaps(
  baseWidth: number,
  baseHeight: number,
  size: ArFigureDisplaySize | 'normal' | null | undefined
): { maxWidth: number; maxHeight: number } {
  const m = arFigureSizeMultiplier(size);
  return {
    maxWidth: Math.round(baseWidth * m),
    maxHeight: Math.round(baseHeight * m),
  };
}

/** Bank `presentation.option_layout` values that place A–D text tiles in a 2×2. */
export function isArTextOptionGrid2x2(optionLayout?: string | null): boolean {
  const v = String(optionLayout ?? '')
    .toLowerCase()
    .trim();
  if (!v) return false;
  return v === 'grid' || v === '2x2' || v.includes('2x2') || /(^|[_\s-])grid([_\s-]|$)/.test(v);
}

/** Ascii / symbol card options (IF-08 style) should tile 2×2 even if option_layout is missing. */
export function looksLikeArAsciiGridOptionTexts(
  texts: Array<string | null | undefined> | null | undefined
): boolean {
  const rows = (texts ?? [])
    .map((t) => String(t ?? '').replace(/\r\n/g, '\n').trim())
    .filter(Boolean);
  if (rows.length < 4) return false;
  return rows.slice(0, 4).every((t) => {
    const lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.length >= 2 && lines.every((l) => l.split(/\s+/).length >= 2);
  });
}
