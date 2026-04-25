import { useCallback, useEffect, useState, type RefObject } from 'react';

export function landingPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export function scrollToLandingSectionId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({
    behavior: landingPrefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
}

/** Document scroll depth 0–100 for header progress bar */
export function useLandingScrollProgress(): number {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const docEl = document.documentElement;
      const total = docEl.scrollHeight - window.innerHeight;
      const p = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setScrollProgress(p);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return scrollProgress;
}

/**
 * Highlights whichever section id is nearest the upper viewport band.
 * Pass `sectionIds.join('|')` from a module-level id list so the key is stable across renders.
 */
export function useLandingSectionSpy(sectionIdsJoined: string): string {
  const sectionIds = sectionIdsJoined ? sectionIdsJoined.split('|') : [];
  const [activeSectionId, setActiveSectionId] = useState<string>(() => sectionIds[0] ?? '');

  useEffect(() => {
    const ids = sectionIdsJoined ? sectionIdsJoined.split('|') : [];
    let ticking = false;
    const update = () => {
      ticking = false;
      const midY = window.innerHeight * 0.34;
      let active = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= midY + 40) active = id;
      }
      setActiveSectionId(active);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sectionIdsJoined]);

  return activeSectionId;
}

/** Adds `landing-reveal-visible` to `[data-landing-reveal]` nodes inside `rootRef` when they enter view */
export function useLandingRevealInContainer(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const nodes = root.querySelectorAll('[data-landing-reveal]');
    if (nodes.length === 0) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('landing-reveal-visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [rootRef]);
}

export function useScrollToSectionHandler(): (id: string) => void {
  return useCallback((id: string) => {
    scrollToLandingSectionId(id);
  }, []);
}
