import { useCallback, useEffect } from 'react';
import { useBeforeUnload, useNavigate } from 'react-router-dom';
import { STUDENT_SIGNUP_BEFORE_UNLOAD_HINT } from '../constants/studentSignupExit';
import { useStudentSignupExit } from '../contexts/StudentSignupExitContext';

const ALLOWED_REGISTER_PATHS = new Set([
  '/students/register',
  '/students/register/school',
  '/students/register/membership',
  '/students/register/payment',
  '/students/register/welcome',
]);

function normalizePath(pathname: string): string {
  const p = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  return p;
}

function isAllowedSignupDestination(destPathname: string): boolean {
  return ALLOWED_REGISTER_PATHS.has(normalizePath(destPathname));
}

/**
 * Tab close/refresh: native beforeunload (browser UI). In-app: exam-style modal via context.
 * Must run under StudentRegistrationFlowLayout.
 */
export function useStudentSignupExitGuard(enabled: boolean) {
  const { requestLeave } = useStudentSignupExit();
  const navigate = useNavigate();

  const onBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.returnValue = STUDENT_SIGNUP_BEFORE_UNLOAD_HINT;
    },
    [enabled]
  );
  useBeforeUnload(onBeforeUnload);

  useEffect(() => {
    if (!enabled) return;

    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (target.closest('[data-skip-student-signup-exit-guard="true"]')) return;

      const a = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!a?.href) return;
      if (a.target === '_blank' || a.getAttribute('download') != null) return;

      try {
        const url = new URL(a.href);
        if (url.origin !== window.location.origin) return;
        if (isAllowedSignupDestination(url.pathname)) return;

        e.preventDefault();
        e.stopPropagation();
        const dest = `${url.pathname}${url.search}${url.hash}`;
        requestLeave(() => {
          navigate(dest);
        });
      } catch {
        /* ignore invalid href */
      }
    };

    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, [enabled, navigate, requestLeave]);
}
