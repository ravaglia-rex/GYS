/** Returns true when the element is visible and has a non-zero layout box. */
export function isTutorialTargetVisible(el: HTMLElement | null): boolean {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  return true;
}

/**
 * Intersect an element's box with overflow/clip ancestors so spotlight math
 * does not use layout boxes that are scrolled out of a nested scroller
 * (e.g. sidebar nav items under the user profile card).
 */
export function getVisibleTargetRect(el: HTMLElement): TargetRect | null {
  let top = 0;
  let left = 0;
  let right = 0;
  let bottom = 0;
  const initial = el.getBoundingClientRect();
  top = initial.top;
  left = initial.left;
  right = initial.right;
  bottom = initial.bottom;

  let parent: HTMLElement | null = el.parentElement;
  while (parent && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent);
    const clips =
      /(auto|scroll|hidden|overlay)/.test(style.overflowX) ||
      /(auto|scroll|hidden|overlay)/.test(style.overflowY);
    if (clips) {
      const pr = parent.getBoundingClientRect();
      top = Math.max(top, pr.top);
      left = Math.max(left, pr.left);
      right = Math.min(right, pr.right);
      bottom = Math.min(bottom, pr.bottom);
    }
    parent = parent.parentElement;
  }

  top = Math.max(top, 0);
  left = Math.max(left, 0);
  right = Math.min(right, window.innerWidth);
  bottom = Math.min(bottom, window.innerHeight);

  const width = right - left;
  const height = bottom - top;
  if (width < 2 || height < 2) return null;

  return { top, left, width, height };
}

export function findTutorialTarget(targetId: string): HTMLElement | null {
  const el = document.querySelector(`[data-tutorial-id="${targetId}"], [data-tutorial-scroll-id="${targetId}"]`);
  return el instanceof HTMLElement ? el : null;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function measureTutorialTarget(targetId: string): TargetRect | null {
  const targets = Array.from(
    document.querySelectorAll(`[data-tutorial-id="${targetId}"], [data-tutorial-scroll-id="${targetId}"]`)
  ).filter((el): el is HTMLElement => el instanceof HTMLElement && isTutorialTargetVisible(el));

  if (targets.length === 0) return null;

  const rects = targets
    .map((el) => getVisibleTargetRect(el))
    .filter((rect): rect is TargetRect => rect != null);

  if (rects.length === 0) return null;

  const top = Math.min(...rects.map((rect) => rect.top));
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

export function resolveVisibleTutorialSteps<T extends { targetId: string }>(
  steps: T[]
): T[] {
  return steps.filter((step) => isTutorialTargetVisible(findTutorialTarget(step.targetId)));
}
