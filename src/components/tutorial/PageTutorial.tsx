import React, { useEffect, useMemo, useState } from 'react';
import TutorialOverlay from './TutorialOverlay';
import { getTutorialSteps } from './tutorialRegistry';
import { findTutorialTarget, resolveVisibleTutorialSteps } from './tutorialTargets';
import { useTutorialContext } from './TutorialContext';
import type { TutorialPageKey, TutorialStepDefinition } from './types';
import { isTutorialPageDismissed } from './types';

interface PageTutorialProps {
  pageKey: TutorialPageKey;
  /** Delay showing until page content has rendered targets (ms). */
  startDelayMs?: number;
  /** Re-run target resolution when this changes (e.g. loading finished). */
  ready?: boolean;
}

const FIXED_HEADER_GAP = 24;

function getFixedHeaderBottom(): number {
  const header = document.querySelector('[data-school-admin-appbar], .MuiAppBar-positionFixed');
  if (!(header instanceof HTMLElement)) return 0;
  return Math.max(0, header.getBoundingClientRect().bottom);
}

function getScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (
      /(auto|scroll|overlay)/.test(overflowY) &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function scrollByOffset(scrollParent: HTMLElement | null, top: number): void {
  if (scrollParent) {
    scrollParent.scrollBy({ top, behavior: 'smooth' });
  } else {
    window.scrollBy({ top, behavior: 'smooth' });
  }
}

function scrollTutorialTargetIntoView(
  target: HTMLElement,
  step: TutorialStepDefinition
): void {
  const scrollParent = getScrollParent(target);
  const topTooltipRoom = step.placement === 'top' ? 170 : 0;
  const minTop = getFixedHeaderBottom() + FIXED_HEADER_GAP + topTooltipRoom;
  const maxBottom = window.innerHeight - FIXED_HEADER_GAP;
  const rect = target.getBoundingClientRect();

  if (step.scrollBlock === 'nearest' && rect.top >= minTop && rect.bottom <= maxBottom) {
    return;
  }

  if (step.scrollBlock === 'center') {
    scrollByOffset(scrollParent, rect.top + rect.height / 2 - window.innerHeight / 2);
    return;
  }

  if (rect.top < minTop || step.scrollBlock !== 'nearest') {
    scrollByOffset(scrollParent, rect.top - minTop);
  } else if (rect.bottom > maxBottom && rect.height < maxBottom - minTop) {
    scrollByOffset(scrollParent, rect.bottom - maxBottom);
  }
}

const PageTutorial: React.FC<PageTutorialProps> = ({
  pageKey,
  startDelayMs = 0,
  ready = true,
}) => {
  const ctx = useTutorialContext();
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(() => getTutorialSteps(pageKey));

  const dismissed = ctx?.dismissed ?? {};
  const isDismissed = isTutorialPageDismissed(dismissed, pageKey);

  useEffect(() => {
    setStepIndex(0);
  }, [pageKey]);

  useEffect(() => {
    if (!ready || !ctx?.ready || isDismissed) {
      setActive(false);
      return;
    }

    const registrySteps = getTutorialSteps(pageKey);
    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const tryStart = () => {
      const resolved = resolveVisibleTutorialSteps(registrySteps);
      if (cancelled) return;
      setVisibleSteps(resolved);
      if (resolved.length > 0) {
        setActive(true);
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = undefined;
        }
      }
    };

    const startPolling = () => {
      tryStart();
      pollTimer = setInterval(tryStart, 500);
    };

    if (startDelayMs > 0) {
      delayTimer = setTimeout(startPolling, startDelayMs);
    } else {
      startPolling();
    }

    return () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pageKey, ready, ctx?.ready, isDismissed, startDelayMs]);

  const steps = useMemo(() => visibleSteps, [visibleSteps]);
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const activeStep = steps[safeIndex];

  useEffect(() => {
    if (!active || !activeStep) return;
    const scrollTarget = findTutorialTarget(activeStep.scrollTargetId ?? activeStep.targetId);
    if (scrollTarget) {
      scrollTutorialTargetIntoView(scrollTarget, activeStep);
    }
  }, [active, activeStep]);

  const handleDismiss = async () => {
    setActive(false);
    if (ctx) {
      try {
        await ctx.dismissPage(pageKey);
      } catch {
        /* overlay already closed; user can retry on next visit if save failed */
      }
    }
  };

  const handleFinish = async () => {
    await handleDismiss();
  };

  if (!active || steps.length === 0 || isDismissed) {
    return null;
  }

  return (
    <TutorialOverlay
      steps={steps}
      stepIndex={safeIndex}
      onStepIndexChange={setStepIndex}
      onDismiss={handleDismiss}
      onFinish={handleFinish}
    />
  );
};

export default PageTutorial;
