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

  const rects = targets.map((el) => el.getBoundingClientRect());
  const top = Math.min(...rects.map((rect) => rect.top));
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

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
