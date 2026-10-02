import type { ArOptionFigureLayout, OptionFigureSliceRect } from './arOptionFigureModel';

export type SavedOptionFigureCrops = {
  layout: ArOptionFigureLayout;
  naturalWidth: number;
  naturalHeight: number;
  slices: OptionFigureSliceRect[];
  stemSlice: OptionFigureSliceRect | null;
};

/** Filename of a figure URL after query/hash strip (e.g. item_38_….svg). */
export function optionFigureCropKey(src: string | undefined | null): string {
  if (!src) return '';
  const path = src.trim().split('#')[0].split('?')[0].replace(/\\/g, '/');
  return path.split('/').pop() || '';
}

/** Clamp stem crop to the figure canvas (oversized hPct leaves empty gap under stems). */
export function sanitizeOptionFigureCrops(
  crops: SavedOptionFigureCrops | null | undefined
): SavedOptionFigureCrops | null {
  if (!crops) return null;
  const slices = Array.isArray(crops.slices) ? crops.slices : [];
  let stem = crops.stemSlice;
  let changed = false;

  // Older stamps omitted stemSlice when options started just under 40% (ssw2_06).
  // Synthesize a stem ending above the OPTIONS / A–D label band.
  if (!stem && slices.length >= 2) {
    const minY = Math.min(...slices.map((s) => s.yPct));
    if (Number.isFinite(minY) && minY >= 32 && minY < 40) {
      const hPct = Math.max(10, minY - 12);
      stem = { xPct: 0, yPct: 0, wPct: 100, hPct, kind: 'wide' };
      changed = true;
    }
  }

  if (!stem) return changed ? { ...crops, stemSlice: stem } : crops;

  let yPct = stem.yPct;
  let hPct = stem.hPct;

  if (stem.hPct > 100 || stem.yPct < 0) {
    yPct = Math.max(0, Math.min(100, stem.yPct));
    hPct = Math.min(100, Math.max(8, stem.hPct));
    hPct = Math.min(hPct, Math.max(8, 100 - yPct));
    changed = true;
  }

  // Stamps that set stem.hPct ≈ min(option.yPct) (through OPTIONS / A–D labels).
  // Only pull back when the stem butts against the option band — not when it
  // already ends well above (e.g. vw2_05 TARGET under ANSWER CARDS).
  if (slices.length >= 2) {
    const minY = Math.min(...slices.map((s) => s.yPct));
    if (Number.isFinite(minY) && minY >= 32) {
      const optionCap = minY - 0.6;
      if (hPct > optionCap - 2.5 && hPct <= minY + 0.05) {
        const trimmed = Math.max(8, minY - 12);
        if (trimmed + 0.05 < hPct) {
          hPct = trimmed;
          changed = true;
        }
      }
    }
  }

  if (!changed) return crops;
  return {
    ...crops,
    stemSlice: {
      ...stem,
      yPct,
      hPct,
    },
  };
}
