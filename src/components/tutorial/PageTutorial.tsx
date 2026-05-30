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
const PHONE_BREAKPOINT = 600;
const PHONE_TOOLTIP_RESERVED_HEIGHT = 260;
const TUTORIAL_STEP_CHANGE_EVENT = 'argus:tutorial-step-change';

function getViewportHeight(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

function isPhoneViewport(): boolean {
  return (window.visualViewport?.width ?? window.innerWidth) <= PHONE_BREAKPOINT;
}

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
  const phoneBottomRoom = isPhoneViewport() ? PHONE_TOOLTIP_RESERVED_HEIGHT : 0;
  const maxBottom = getViewportHeight() - FIXED_HEADER_GAP - phoneBottomRoom;
  const rect = target.getBoundingClientRect();
  const availableHeight = Math.max(160, maxBottom - minTop);

  if (step.scrollBlock === 'nearest' && rect.top >= minTop && rect.bottom <= maxBottom) {
    return;
  }

  if (step.scrollBlock === 'center' || rect.height > availableHeight) {
    scrollByOffset(scrollParent, rect.top + rect.height / 2 - (minTop + availableHeight / 2));
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
  }, [pageKey, isDismissed]);

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
    window.dispatchEvent(
      new CustomEvent(TUTORIAL_STEP_CHANGE_EVENT, {
        detail: { targetId: activeStep.targetId, pageKey },
      })
    );
    const scrollTarget = findTutorialTarget(activeStep.scrollTargetId ?? activeStep.targetId);
    if (scrollTarget) {
      scrollTutorialTargetIntoView(scrollTarget, activeStep);
    }
  }, [active, activeStep, pageKey]);

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
