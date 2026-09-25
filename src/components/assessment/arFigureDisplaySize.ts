/**
 * Per-item figure display sizes for AR stem + option tiles.
 * Mirrors backend `arFigureDisplaySize.ts`.
 */
export type ArFigureDisplaySize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

/** Bank / API value: canonical sizes plus legacy `normal` (= medium). */
export type ArFigureDisplaySizeInput = ArFigureDisplaySize | 'normal' | null;

export const AR_FIGURE_DISPLAY_SIZES: readonly ArFigureDisplaySize[] = [
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
] as const;

/** Multipliers vs the default medium exam caps. */
export const AR_FIGURE_SIZE_MULTIPLIER: Record<ArFigureDisplaySize, number> = {
  xsmall: 0.5,
  small: 0.75,
  medium: 1,
  large: 1.5,
  xlarge: 2,
};

export const AR_FIGURE_SIZE_LABEL: Record<ArFigureDisplaySize, string> = {
  xsmall: '0.5×',
  small: '0.75×',
  medium: '1×',
  large: '1.5×',
  xlarge: '2×',
};

export function normalizeArFigureDisplaySize(
  raw: unknown,
  fallback: ArFigureDisplaySize = 'medium'
): ArFigureDisplaySize {
  if (
    raw === 'xsmall' ||
    raw === 'small' ||
    raw === 'medium' ||
    raw === 'large' ||
    raw === 'xlarge'
  ) {
    return raw;
  }
  if (raw === 'normal') return 'medium';
  return fallback;
}

export function arFigureSizeMultiplier(
  size: ArFigureDisplaySizeInput | undefined
): number {
  return AR_FIGURE_SIZE_MULTIPLIER[normalizeArFigureDisplaySize(size)];
}

export function scaleExamFigureCaps(
  baseWidth: number,
  baseHeight: number,
  size: ArFigureDisplaySizeInput | undefined
): { maxWidth: number; maxHeight: number } {
  const m = arFigureSizeMultiplier(size);
  return {
    maxWidth: Math.round(baseWidth * m),
    maxHeight: Math.round(baseHeight * m),
  };
}

/** Canonical text MCQ option arrangements (stored on `presentation.option_layout`). */
export type ArTextOptionLayout = '2x2' | '1x4' | '4x1';

export const AR_TEXT_OPTION_LAYOUTS: readonly ArTextOptionLayout[] = [
  '2x2',
  '1x4',
  '4x1',
] as const;

export const AR_TEXT_OPTION_LAYOUT_LABEL: Record<ArTextOptionLayout, string> = {
  '2x2': '2×2',
  '1x4': '1×4',
  '4x1': '4×1',
};

/** Bank `presentation.option_layout` values that place A–D text tiles in a 2×2. */
export function isArTextOptionGrid2x2(optionLayout?: string | null): boolean {
  return normalizeArTextOptionLayout(optionLayout) === '2x2';
}

/**
 * Map freeform bank `option_layout` to a canonical tile arrangement.
 * Returns null when unset / unrecognized (caller may apply ascii heuristic).
 */
export function normalizeArTextOptionLayout(
  optionLayout?: string | null
): ArTextOptionLayout | null {
  const v = String(optionLayout ?? '')
    .toLowerCase()
    .trim();
  if (!v) return null;
  if (v === '2x2' || v === 'grid' || v.includes('2x2') || /(^|[_\s-])grid([_\s-]|$)/.test(v)) {
    return '2x2';
  }
  if (
    v === '4x1' ||
    v === 'row' ||
    v === 'horizontal' ||
    v.includes('4x1') ||
    /(^|[_\s-])row([_\s-]|$)/.test(v)
  ) {
    return '4x1';
  }
  if (
    v === '1x4' ||
    v === 'list' ||
    v === 'stack' ||
    v === 'column' ||
    v === 'vertical' ||
    v.includes('1x4') ||
    /(^|[_\s-])(list|stack|column)([_\s-]|$)/.test(v)
  ) {
    return '1x4';
  }
  return null;
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

/**
 * Resolve text option tile layout: explicit bank value wins; else ascii heuristic → 2×2;
 * else vertical 1×4 list.
 */
export function resolveArTextOptionLayout(
  optionLayout?: string | null,
  optionTexts?: Array<string | null | undefined> | null
): ArTextOptionLayout {
  const explicit = normalizeArTextOptionLayout(optionLayout);
  if (explicit) return explicit;
  if (looksLikeArAsciiGridOptionTexts(optionTexts)) return '2x2';
  return '1x4';
}

/** Map figure-crop layout enum ↔ text option layout labels (same UX control). */
export function arTextOptionLayoutFromFigureCrop(
  cropLayout?: 'row' | 'stack' | 'grid' | string | null
): ArTextOptionLayout | null {
  const v = String(cropLayout ?? '')
    .toLowerCase()
    .trim();
  if (v === 'grid') return '2x2';
  if (v === 'stack') return '1x4';
  if (v === 'row') return '4x1';
  return null;
}

export function arFigureCropLayoutFromTextOption(
  layout: ArTextOptionLayout
): 'row' | 'stack' | 'grid' {
  if (layout === '2x2') return 'grid';
  if (layout === '1x4') return 'stack';
  return 'row';
}

/**
 * Edit-dialog seed: figure-tile items show crops.layout on screen (often `grid` = 2×2)
 * even when `option_layout` is unset. Prefer crops when display_mode is figure_tiles
 * or when option_layout is empty and crops exist.
 */
export function resolveArOptionLayoutForEdit(opts: {
  optionLayout?: string | null;
  optionCropsLayout?: 'row' | 'stack' | 'grid' | string | null;
  displayMode?: string | null;
  optionTexts?: Array<string | null | undefined> | null;
}): ArTextOptionLayout {
  const fromCrops = arTextOptionLayoutFromFigureCrop(opts.optionCropsLayout);
  const fromText = normalizeArTextOptionLayout(opts.optionLayout);
  if (opts.displayMode === 'figure_tiles' && fromCrops) return fromCrops;
  if (fromText) return fromText;
  if (fromCrops) return fromCrops;
  return resolveArTextOptionLayout(opts.optionLayout, opts.optionTexts);
}

/** CSS for text A–D option containers (admin preview + learner exam). */
export function arTextOptionLayoutContainerSx(
  layout: ArTextOptionLayout,
  opts?: { gap?: number; mb?: number | string; alignItems?: 'start' | 'stretch' }
): Record<string, unknown> | undefined {
  const gap = opts?.gap ?? 1.25;
  const alignItems = opts?.alignItems ?? 'stretch';
  const mb = opts?.mb;
  if (layout === '2x2') {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      alignItems,
      gap,
      ...(mb !== undefined ? { mb } : {}),
    };
  }
  if (layout === '4x1') {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      alignItems,
      gap,
      ...(mb !== undefined ? { mb } : {}),
    };
  }
  // 1×4 vertical list — callers that need flex column pass their own sx.
  return undefined;
}
