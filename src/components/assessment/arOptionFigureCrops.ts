import type { ArOptionFigureLayout, OptionFigureSliceRect } from './arOptionFigureModel';
import savedCrops from './arOptionFigureCrops.json';

export type SavedOptionFigureCrops = {
  layout: ArOptionFigureLayout;
  naturalWidth: number;
  naturalHeight: number;
  slices: OptionFigureSliceRect[];
  stemSlice: OptionFigureSliceRect | null;
};

const CATALOG = savedCrops as Record<string, SavedOptionFigureCrops>;

/** Filename of a figure URL after query/hash strip (e.g. item_38_….svg). */
export function optionFigureCropKey(src: string | undefined | null): string {
  if (!src) return '';
  const path = src.trim().split('#')[0].split('?')[0].replace(/\\/g, '/');
  return path.split('/').pop() || '';
}

/** Precomputed A–D crop boxes for a public AR figure. Null if not in the catalog. */
export function lookupSavedOptionFigureCrops(
  src: string | undefined | null
): SavedOptionFigureCrops | null {
  const key = optionFigureCropKey(src);
  if (!key) return null;
  return CATALOG[key] ?? null;
}
