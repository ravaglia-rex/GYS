import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import {
  arOptionFigureSliceDisplaySize,
  layoutFromAspect,
  layoutFromSvgText,
  optionFigureContentSlicesFromSvg,
  optionFigureGridSx,
  optionFigureSliceWindow,
  optionFigureStemSliceFromOptionSlices,
  svgNaturalSizeFromText,
  type ArOptionFigureLayout,
  type ArOptionFigureRef,
  type OptionFigureSliceRect,
} from './arOptionFigureModel';

import { resolveExamFigureSrc } from './examFigureSrc';
import {
  sanitizeOptionFigureCrops,
  type SavedOptionFigureCrops,
} from './arOptionFigureCrops';

const borderMuted = '#e2e8f0';

/**
 * Crop / layout meta for option figures.
 * Learner path: bank `option_crops` only (no FE catalog / SVG parse).
 * Platform Admin may pass `allowRuntimeFallback` while authoring.
 */
export function useArOptionFigureMeta(
  src: string | undefined,
  optionCount = 4,
  bankCrops?: SavedOptionFigureCrops | null,
  allowRuntimeFallback = false
): {
  layout: ArOptionFigureLayout;
  slices: OptionFigureSliceRect[] | null;
  stemSlice: OptionFigureSliceRect | null;
  includesStemContent: boolean;
  naturalWidth: number;
  naturalHeight: number;
} {
  const [layout, setLayout] = useState<ArOptionFigureLayout>('grid');
  const [slices, setSlices] = useState<OptionFigureSliceRect[] | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const layoutFromSvgRef = useRef(false);

  const saved = sanitizeOptionFigureCrops(bankCrops);

  useEffect(() => {
    let cancelled = false;
    layoutFromSvgRef.current = false;
    if (saved) {
      setLayout(saved.layout);
      setSlices(saved.slices);
      setNaturalWidth(saved.naturalWidth);
      setNaturalHeight(saved.naturalHeight);
      return undefined;
    }
    setLayout('grid');
    setSlices(null);
    setNaturalWidth(0);
    setNaturalHeight(0);
    if (!src || !allowRuntimeFallback) return undefined;
    const figureSrc = resolveExamFigureSrc(src);

    const applyAspect = () => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);
        if (!layoutFromSvgRef.current) {
          setLayout(layoutFromAspect(img.naturalWidth, img.naturalHeight));
        }
      };
      img.src = figureSrc;
    };

    if (!/\.svg(\?|$)/i.test(figureSrc)) {
      applyAspect();
      return () => {
        cancelled = true;
      };
    }

    fetch(figureSrc)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error('svg fetch failed'))))
      .then((text) => {
        if (cancelled) return;
        const parsed = layoutFromSvgText(text);
        if (parsed) {
          layoutFromSvgRef.current = true;
          setLayout(parsed);
        }
        setSlices(optionFigureContentSlicesFromSvg(text, optionCount));
        const size = svgNaturalSizeFromText(text);
        if (size) {
          setNaturalWidth(size.width);
          setNaturalHeight(size.height);
        }
        applyAspect();
      })
      .catch(() => {
        if (!cancelled) applyAspect();
      });

    return () => {
      cancelled = true;
    };
  }, [src, optionCount, saved, allowRuntimeFallback]);

  if (saved) {
    return {
      layout: saved.layout,
      slices: saved.slices,
      stemSlice: saved.stemSlice,
      includesStemContent: Boolean(saved.stemSlice),
      naturalWidth: saved.naturalWidth,
      naturalHeight: saved.naturalHeight,
    };
  }
  const stemSlice = allowRuntimeFallback
    ? optionFigureStemSliceFromOptionSlices(slices)
    : null;
  return {
    layout,
    slices: allowRuntimeFallback ? slices : null,
    stemSlice,
    includesStemContent: Boolean(stemSlice),
    naturalWidth,
    naturalHeight,
  };
}

export function useArOptionFigureLayout(src: string | undefined): ArOptionFigureLayout {
  return useArOptionFigureMeta(src, 4, null, true).layout;
}

export const ArOptionFigureSlice: React.FC<{
  figure: ArOptionFigureRef;
  index: number;
  optionCount?: number;
  layout: ArOptionFigureLayout;
  slice?: OptionFigureSliceRect | null;
  naturalWidth?: number;
  naturalHeight?: number;
  /**
   * `exam` - size a figure crop to the full exam figure caps (crop box itself).
   * `stem` - same scale as ExamMarkdown would show the combined asset, capped
   * so a tight tray/grid crop is not blown up to the stem max box.
   * `option` / `crop` - size like ExamMarkdown would show the full asset, then
   * crop. That keeps option glyphs on the same scale as the stem figure.
   */
  fit?: 'option' | 'exam' | 'stem' | 'crop';
  /** Explicit bank size; falls back to filename exception list when unset. */
  optionDisplaySize?: 'small' | 'medium' | 'large' | 'normal' | null;
  stemDisplaySize?: 'small' | 'medium' | 'large' | 'normal' | null;
}> = ({
  figure,
  index,
  optionCount = 4,
  layout,
  slice,
  naturalWidth = 0,
  naturalHeight = 0,
  fit = 'option',
  optionDisplaySize = null,
  stemDisplaySize = null,
}) => {
  const win = optionFigureSliceWindow(layout, index, optionCount);
  const crop = slice ?? {
    xPct: (win.col / win.cols) * 100,
    yPct: (win.row / win.rows) * 100,
    wPct: (1 / win.cols) * 100,
    hPct: (1 / win.rows) * 100,
  };
  const figW = naturalWidth || 1;
  const figH = naturalHeight || 1;
  const natW = (crop.wPct / 100) * figW;
  const natH = (crop.hPct / 100) * figH;
  const { width: sliceWidth, height: sliceHeight } = arOptionFigureSliceDisplaySize(
    natW,
    natH,
    figW,
    figH,
    fit,
    slice,
    figure.src,
    optionDisplaySize,
    stemDisplaySize
  );
  const imgSrc = resolveExamFigureSrc(figure.src);
  // Prefer an explicit pixel width. `min(100%, Npx)` collapses to 0 inside
  // shrink-wrapped flex children (AdminExamOptionRow), which made Cover A–D
  // figure slices invisible while the stem crop (block layout) still showed.
  const boxWidth = Math.max(sliceWidth, 1);
  const aspectPadPct = (Math.max(sliceHeight, 1) / boxWidth) * 100;
  return (
    <Box
      sx={{
        flex: '0 1 auto',
        width: boxWidth,
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          lineHeight: 0,
          '&::before': {
            content: '""',
            display: 'block',
            paddingTop: `${aspectPadPct}%`,
          },
        }}
      >
        <Box
          component="img"
          src={imgSrc}
          alt={figure.alt || `Option ${String.fromCharCode(65 + index)}`}
          sx={{
            position: 'absolute',
            display: 'block',
            width: `${10000 / Math.max(crop.wPct, 0.01)}%`,
            height: `${10000 / Math.max(crop.hPct, 0.01)}%`,
            left: `${-(crop.xPct / Math.max(crop.wPct, 0.01)) * 100}%`,
            top: `${-(crop.yPct / Math.max(crop.hPct, 0.01)) * 100}%`,
            maxWidth: 'none',
          }}
        />
      </Box>
    </Box>
  );
};

export const ArOptionFigure: React.FC<{
  figure: ArOptionFigureRef;
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
  selectionLocked?: boolean;
  primary?: string;
  primarySoft?: string;
  optionCount?: number;
}> = ({
  figure,
  selectedIndex = null,
  onSelect,
  selectionLocked = false,
  primary = '#0d47a1',
  primarySoft = 'rgba(13,71,161,0.1)',
  optionCount = 4,
}) => {
  const interactive = typeof onSelect === 'function';
  const layout = useArOptionFigureLayout(figure.src);
  const count = Math.min(4, Math.max(2, optionCount));

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 760,
        borderRadius: 1.5,
        border: `1px solid ${borderMuted}`,
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src={resolveExamFigureSrc(figure.src)}
        alt={figure.alt || 'Answer choices'}
        sx={{
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
      {interactive ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            ...optionFigureGridSx(layout),
          }}
        >
          {Array.from({ length: count }, (_, idx) => {
            const selected = selectedIndex === idx;
            const letter = String.fromCharCode(65 + idx);
            return (
              <Box
                key={letter}
                component="button"
                type="button"
                aria-label={`Option ${letter}`}
                aria-pressed={selected}
                disabled={selectionLocked}
                onClick={() => {
                  if (selectionLocked) return;
                  onSelect?.(idx);
                }}
                sx={{
                  m: 0,
                  p: 0,
                  minWidth: 0,
                  border: '3px solid',
                  borderColor: selected ? primary : 'transparent',
                  borderRadius: 1,
                  bgcolor: selected ? primarySoft : 'transparent',
                  cursor: selectionLocked ? 'default' : 'pointer',
                  '&:hover': selectionLocked
                    ? {}
                    : { bgcolor: selected ? primarySoft : 'rgba(15, 23, 42, 0.04)' },
                  '&:focus-visible': {
                    outline: `2px solid ${primary}`,
                    outlineOffset: -2,
                  },
                }}
              />
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};
