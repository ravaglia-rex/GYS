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
  const stem = crops.stemSlice;
  if (!stem) return crops;
  if (!(stem.hPct > 100) && !(stem.yPct < 0)) return crops;
  const yPct = Math.max(0, Math.min(100, stem.yPct));
  const hPct = Math.min(100, Math.max(8, stem.hPct));
  return {
    ...crops,
    stemSlice: {
      ...stem,
      yPct,
      hPct: Math.min(hPct, Math.max(8, 100 - yPct)),
    },
  };
}
