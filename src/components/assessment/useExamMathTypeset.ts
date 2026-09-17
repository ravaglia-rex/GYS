import { useContext, useLayoutEffect, useRef } from 'react';
import { MathJaxBaseContext } from 'better-react-mathjax';

/**
 * Typeset TeX under MathJaxContext.
 *
 * Runs after every layout commit while enabled so React reconciliations
 * (markdown re-renders, image state, parent card updates) that restore raw
 * `$...$` / `\\(...\\)` source get typeset again. better-react-mathjax's
 * `dynamic` mode re-typesets every render and races detached nodes; this keeps
 * a single scoped typesetPromise on the host element instead.
 */
export function useExamMathTypeset(contentKey: string, enabled = true) {
  const ref = useRef<HTMLElement | null>(null);
  const ctx = useContext(MathJaxBaseContext);
  const contentRef = useRef(contentKey);
  contentRef.current = contentKey;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useLayoutEffect(() => {
    const el = ref.current;
    const key = contentRef.current;
    const on = enabledRef.current;
    if (!on || !key.trim() || !el || !ctx?.promise || ctx.version !== 3) return;

    let cancelled = false;

    // ExamMathText owns its text via textContent so React children cannot wipe MathJax.
    if (el.dataset.examMathOwn === '1') {
      el.textContent = key;
    }

    ctx.promise
      .then((mjx) => {
        if (cancelled || !ref.current) return null;
        const node = ref.current;
        if (node.dataset.examMathOwn === '1') {
          node.textContent = contentRef.current;
        }
        try {
          mjx.typesetClear([node]);
        } catch {
          // Node may already be detached.
        }
        if (cancelled || !ref.current) return null;
        if (node.dataset.examMathOwn === '1') {
          node.textContent = contentRef.current;
        }
        return mjx.typesetPromise([node]);
      })
      .catch((err) => {
        if (!cancelled && process.env.NODE_ENV !== 'production') {
          console.warn('[ExamMath] typeset skipped:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  });

  return ref;
}
