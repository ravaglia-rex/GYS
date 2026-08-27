import { useContext, useEffect, useRef } from 'react';
import { MathJaxBaseContext } from 'better-react-mathjax';

/**
 * Typeset TeX once per contentKey under MathJaxContext.
 * Skips re-typeset on unrelated React re-renders and swallows DOM races on unmount
 * (better-react-mathjax `dynamic` re-typesets every render and throws on stale nodes).
 */
export function useExamMathTypeset(contentKey: string, enabled = true) {
  const ref = useRef<HTMLElement | null>(null);
  const ctx = useContext(MathJaxBaseContext);

  useEffect(() => {
    if (!enabled || !contentKey.trim()) return;
    const el = ref.current;
    if (!el || !ctx?.promise || ctx.version !== 3) return;

    let cancelled = false;

    ctx.promise
      .then((mjx) => {
        if (cancelled || !ref.current) return null;
        mjx.typesetClear([ref.current]);
        return mjx.typesetPromise([ref.current]);
      })
      .catch((err) => {
        if (!cancelled && process.env.NODE_ENV !== 'production') {
          console.warn('[ExamMath] typeset skipped:', err);
        }
      });

    return () => {
      cancelled = true;
      ctx.promise
        ?.then((mjx) => {
          try {
            mjx.typesetClear([el]);
          } catch {
            // Node may already be detached during React unmount.
          }
        })
        .catch(() => {});
    };
  }, [ctx, enabled, contentKey]);

  return ref;
}
