import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import {
  layoutFromAspect,
  layoutFromSvgText,
  optionFigureContentSlicesFromSvg,
  optionFigureGridSx,
  optionFigureSliceWindow,
  svgNaturalSizeFromText,
  type ArOptionFigureLayout,
  type ArOptionFigureRef,
  type OptionFigureSliceRect,
} from './arOptionFigureModel';

import { EXAM_FIGURE_MAX_WIDTH_PX } from './ExamMarkdown';

const borderMuted = '#e2e8f0';

export function useArOptionFigureMeta(
  src: string | undefined,
  optionCount = 4
): {
  layout: ArOptionFigureLayout;
  slices: OptionFigureSliceRect[] | null;
  naturalWidth: number;
  naturalHeight: number;
} {
  const [layout, setLayout] = useState<ArOptionFigureLayout>('grid');
  const [slices, setSlices] = useState<OptionFigureSliceRect[] | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const layoutFromSvgRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    layoutFromSvgRef.current = false;
    setLayout('grid');
    setSlices(null);
    setNaturalWidth(0);
    setNaturalHeight(0);
    if (!src) return undefined;

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
      img.src = src;
    };

    if (!/\.svg(\?|$)/i.test(src)) {
      applyAspect();
      return () => {
        cancelled = true;
      };
    }

    fetch(src)
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
  }, [src, optionCount]);

  return { layout, slices, naturalWidth, naturalHeight };
}

export function useArOptionFigureLayout(src: string | undefined): ArOptionFigureLayout {
  return useArOptionFigureMeta(src).layout;
}

export const ArOptionFigureSlice: React.FC<{
  figure: ArOptionFigureRef;
  index: number;
  optionCount?: number;
  layout: ArOptionFigureLayout;
  slice?: OptionFigureSliceRect | null;
  naturalWidth?: number;
  naturalHeight?: number;
}> = ({
  figure,
  index,
  optionCount = 4,
  layout,
  slice,
  naturalWidth = 0,
  naturalHeight = 0,
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
  const scale = Math.min(
    EXAM_FIGURE_MAX_WIDTH_PX / figW,
    72 / Math.max(natH, 1),
    140 / Math.max(natW, 1)
  );
  const sliceWidth = Math.max(1, natW * scale);
  const sliceHeight = Math.max(1, natH * scale);
  return (
    <Box
      sx={{
        flex: '0 0 auto',
        width: sliceWidth,
        height: sliceHeight,
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
        lineHeight: 0,
      }}
    >
      <Box
        component="img"
        src={figure.src}
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
        src={figure.src}
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
