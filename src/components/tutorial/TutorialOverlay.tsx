import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { TutorialStepDefinition } from './types';
import { measureTutorialTarget } from './tutorialTargets';

const PAD = 8;
const TOOLTIP_MAX_W = 360;
const OVERLAY_BG = 'rgba(15, 23, 42, 0.34)';
const OVERLAY_BLUR = 'blur(0.75px)';
const SCROLL_KEYS = new Set([
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

export interface TutorialOverlayProps {
  steps: TutorialStepDefinition[];
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  onDismiss: () => void;
  onFinish: () => void;
}

function clampTooltipLeft(left: number, width: number): number {
  const margin = 12;
  return Math.max(margin, Math.min(left, window.innerWidth - width - margin));
}

function clampTooltipTop(top: number, height: number): number {
  const margin = 12;
  return Math.max(margin, Math.min(top, window.innerHeight - height - margin));
}

function getSchoolAdminViewportInsets(): { top: number; left: number } {
  const shell = document.querySelector('[data-school-admin-shell]');
  if (!shell) return { top: 0, left: 0 };
  const appBar = shell.querySelector('[data-school-admin-appbar]');
  const sidebar = shell.querySelector('[data-school-admin-sidebar]');
  const top = appBar instanceof HTMLElement ? appBar.getBoundingClientRect().height : 0;
  const left =
    sidebar instanceof HTMLElement && sidebar.getBoundingClientRect().width > 0
      ? sidebar.getBoundingClientRect().width
      : 0;
  return { top, left };
}

function buildSpotlightRect(targetRect: NonNullable<ReturnType<typeof measureTutorialTarget>>) {
  const rawTop = targetRect.top - PAD;
  const rawBottom = targetRect.top + targetRect.height + PAD;
  const rawLeft = targetRect.left - PAD;
  const rawRight = targetRect.left + targetRect.width + PAD;

  const { top: topInset, left: leftInset } = getSchoolAdminViewportInsets();
  const top = Math.max(topInset, rawTop);
  const targetIsInsideSidebar = leftInset > 0 && rawRight <= leftInset;
  const left = targetIsInsideSidebar ? Math.max(0, rawLeft) : Math.max(leftInset, rawLeft);
  const bottom = Math.min(window.innerHeight, rawBottom);
  const right = Math.min(window.innerWidth, rawRight);

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  steps,
  stepIndex,
  onStepIndexChange,
  onDismiss,
  onFinish,
}) => {
  const step = steps[stepIndex];
  const [targetRect, setTargetRect] = useState<ReturnType<typeof measureTutorialTarget>>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: TOOLTIP_MAX_W, height: 200 });

  const remeasure = useCallback(() => {
    if (!step) {
      setTargetRect(null);
      return;
    }
    setTargetRect(measureTutorialTarget(step.targetId));
  }, [step]);

  useLayoutEffect(() => {
    if (!step) return undefined;
    remeasure();
    const raf = window.requestAnimationFrame(remeasure);
    const timeout = window.setTimeout(remeasure, 380);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [remeasure, step, stepIndex]);

  useEffect(() => {
    remeasure();
    const onResize = () => remeasure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const interval = window.setInterval(remeasure, 400);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      window.clearInterval(interval);
    };
  }, [remeasure]);

  useEffect(() => {
    if (steps.length === 0) return undefined;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;
    const prevBodyOverscrollBehavior = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };
    const preventScrollKeys = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-tutorial-tooltip="true"]')
      ) {
        return;
      }
      if (SCROLL_KEYS.has(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener('wheel', preventScroll, { capture: true, passive: false });
    window.addEventListener('touchmove', preventScroll, { capture: true, passive: false });
    window.addEventListener('keydown', preventScrollKeys, { capture: true });

    return () => {
      window.removeEventListener('wheel', preventScroll, { capture: true });
      window.removeEventListener('touchmove', preventScroll, { capture: true });
      window.removeEventListener('keydown', preventScrollKeys, { capture: true });
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscrollBehavior;
      document.body.style.overscrollBehavior = prevBodyOverscrollBehavior;
    };
  }, [steps.length]);

  if (!step || steps.length === 0) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const counter = `${stepIndex + 1}/${steps.length}`;

  const placement = step.placement ?? 'auto';
  let tooltipTop = window.innerHeight / 2 - tooltipSize.height / 2;
  let tooltipLeft = window.innerWidth / 2 - tooltipSize.width / 2;

  if (targetRect) {
    const centerX = targetRect.left + targetRect.width / 2;
    const preferBottom =
      placement === 'bottom' ||
      (placement === 'auto' && targetRect.top < window.innerHeight * 0.45);
    const preferTop = placement === 'top';
    const preferRight = placement === 'right';
    const preferLeft = placement === 'left';

    if (preferRight) {
      tooltipLeft = targetRect.left + targetRect.width + PAD + 12;
      tooltipTop = targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
    } else if (preferLeft) {
      tooltipLeft = targetRect.left - tooltipSize.width - PAD - 12;
      tooltipTop = targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
    } else if (preferTop) {
      tooltipTop = targetRect.top - tooltipSize.height - PAD - 12;
      tooltipLeft = centerX - tooltipSize.width / 2;
    } else if (preferBottom) {
      tooltipTop = targetRect.top + targetRect.height + PAD + 12;
      tooltipLeft = centerX - tooltipSize.width / 2;
    }
  }

  tooltipLeft = clampTooltipLeft(tooltipLeft, tooltipSize.width);
  tooltipTop = clampTooltipTop(tooltipTop, tooltipSize.height);

  const spotlight = targetRect ? buildSpotlightRect(targetRect) : null;

  const content = (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 14000,
        pointerEvents: 'auto',
        touchAction: 'none',
        overscrollBehavior: 'none',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-step-title"
    >
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 14000,
          bgcolor: 'transparent',
          touchAction: 'none',
          overscrollBehavior: 'none',
          cursor: 'default',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      {spotlight ? (
        <>
          <Box
            sx={{
              position: 'fixed',
              zIndex: 14001,
              top: 0,
              left: 0,
              right: 0,
              height: spotlight.top,
              bgcolor: OVERLAY_BG,
              backdropFilter: OVERLAY_BLUR,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'fixed',
              zIndex: 14001,
              top: spotlight.top,
              left: 0,
              width: spotlight.left,
              height: spotlight.height,
              bgcolor: OVERLAY_BG,
              backdropFilter: OVERLAY_BLUR,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'fixed',
              zIndex: 14001,
              top: spotlight.top,
              left: spotlight.left + spotlight.width,
              right: 0,
              height: spotlight.height,
              bgcolor: OVERLAY_BG,
              backdropFilter: OVERLAY_BLUR,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'fixed',
              zIndex: 14001,
              top: spotlight.top + spotlight.height,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: OVERLAY_BG,
              backdropFilter: OVERLAY_BLUR,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 14001,
            inset: 0,
            bgcolor: OVERLAY_BG,
            backdropFilter: OVERLAY_BLUR,
            pointerEvents: 'none',
          }}
        />
      )}
      {spotlight && (
        <Box
          sx={{
            position: 'fixed',
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: 2,
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.28)',
            border: '2px solid rgba(125, 211, 252, 0.72)',
            pointerEvents: 'none',
            zIndex: 14002,
          }}
        />
      )}
      <Box
        ref={(node) => {
          const el = node as HTMLDivElement | null;
          if (el) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
              setTooltipSize((prev) =>
                prev.width !== r.width || prev.height !== r.height
                  ? { width: r.width, height: r.height }
                  : prev
              );
            }
          }
        }}
        sx={{
          position: 'fixed',
          top: tooltipTop,
          left: tooltipLeft,
          width: 'min(92vw, 360px)',
          maxWidth: TOOLTIP_MAX_W,
          zIndex: 14003,
          bgcolor: 'rgba(30, 41, 59, 0.96)',
          color: '#e2e8f0',
          borderRadius: 2,
          boxShadow: '0 18px 44px rgba(2, 6, 23, 0.28)',
          border: '1px solid rgba(125, 211, 252, 0.26)',
          p: 2,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        data-tutorial-tooltip="true"
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography
            id="tutorial-step-title"
            sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc', pr: 1 }}
          >
            {step.title}
          </Typography>
          <IconButton
            size="small"
            aria-label="Dismiss tutorial for this page"
            onClick={onDismiss}
            sx={{ mt: -0.5, mr: -0.5, color: '#cbd5e1', '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.14)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, mb: 2 }}>
          {step.body}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd' }}>{counter}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" color="inherit" onClick={onDismiss} sx={{ textTransform: 'none', color: '#cbd5e1' }}>
              Dismiss
            </Button>
            {!isFirst && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onStepIndexChange(stepIndex - 1)}
                sx={{
                  textTransform: 'none',
                  borderColor: 'rgba(203, 213, 225, 0.35)',
                  color: '#e2e8f0',
                  '&:hover': {
                    borderColor: 'rgba(203, 213, 225, 0.55)',
                    bgcolor: 'rgba(148, 163, 184, 0.12)',
                  },
                }}
              >
                Back
              </Button>
            )}
            {isLast ? (
              <Button
                size="small"
                variant="contained"
                onClick={onFinish}
                sx={{
                  textTransform: 'none',
                  bgcolor: '#38bdf8',
                  color: '#082f49',
                  '&:hover': { bgcolor: '#7dd3fc' },
                }}
              >
                Finish
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={() => onStepIndexChange(stepIndex + 1)}
                sx={{
                  textTransform: 'none',
                  bgcolor: '#38bdf8',
                  color: '#082f49',
                  '&:hover': { bgcolor: '#7dd3fc' },
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return createPortal(content, document.body);
};

export default TutorialOverlay;
