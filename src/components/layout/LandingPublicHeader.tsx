import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LandingHeaderScrollProgress } from '../landing/LandingScrollChrome';
import PublicSamplesNavMenu from './PublicSamplesNavMenu';
import { GYS_BLUE } from '../../constants/gysBrand';

const MAIN_NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'For Students', path: '/students' },
  { label: 'For Schools', path: '/for-schools' },
] as const;

const EXPLORE_LINKS = [
  { label: 'Assessments', path: '/about/assessments' },
  { label: 'Student Dashboard', path: '/students/preview/dashboard' },
  { label: 'School Dashboard', path: '/for-schools/preview/dashboard' },
] as const;

export type LandingPublicHeaderSignUp =
  | { show: false }
  | { show: true; path: string; variant: 'filled' | 'outline' };

type LandingPublicHeaderProps = {
  scrollProgress: number;
  signUp?: LandingPublicHeaderSignUp;
};

const LandingPublicHeader: React.FC<LandingPublicHeaderProps> = ({
  scrollProgress,
  signUp = { show: true, path: '/signup', variant: 'filled' },
}) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onEscape);
    };
  }, [mobileOpen]);

  const go = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const loginButtonClass =
    'rounded-xl border-2 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:px-5 sm:py-2.5';

  const signUpButtonClass =
    'rounded-xl border-2 border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:px-5 sm:py-2.5';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur relative">
      <LandingHeaderScrollProgress scrollProgress={scrollProgress} />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={() => go('/')}
          className="group flex min-w-0 items-center gap-3 text-left"
          aria-label="Go to homepage"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-bold text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
            style={{ backgroundColor: GYS_BLUE }}
          >
            GYS
          </div>
          <div className="hidden min-w-0 sm:block">
            <h1 className="font-bold text-lg tracking-tight text-gray-900">Global Young Scholar</h1>
            <p className="text-xs text-gray-500">Powered by Argus, Access&nbsp;USA, EducationWorld</p>
          </div>
        </button>

        <nav className="hidden items-center gap-8 text-base font-semibold md:flex" aria-label="Main">
          {MAIN_NAV_LINKS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="text-gray-600 transition-colors duration-150 hover:text-gray-900"
            >
              {item.label}
            </button>
          ))}
          <PublicSamplesNavMenu />
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={loginButtonClass}
              style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
            >
              Log In
            </button>
            {signUp.show ? (
              <button
                type="button"
                onClick={() => navigate(signUp.path)}
                className={signUpButtonClass}
                style={{ backgroundColor: GYS_BLUE }}
              >
                Sign up
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="landing-public-mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className={`${loginButtonClass} md:hidden`}
            style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
          >
            Log In
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`fixed inset-0 z-40 bg-slate-950/15 transition-opacity duration-300 ease-out md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Close menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />
      <nav
        id="landing-public-mobile-nav"
        className={`absolute left-3 right-3 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur transition-[max-height,opacity,transform,border-color] duration-300 ease-out md:hidden ${
          mobileOpen
            ? 'max-h-[min(70vh,28rem)] translate-y-0 border-slate-200 opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-2 border-transparent opacity-0'
        }`}
        aria-label="Mobile"
        aria-hidden={!mobileOpen}
      >
        <div
          className={`mx-auto max-w-6xl p-2 transition-[opacity,transform] duration-300 ease-out ${
            mobileOpen ? 'translate-y-0 opacity-100 delay-75' : '-translate-y-1 opacity-0'
          }`}
        >
          {MAIN_NAV_LINKS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => go(item.path)}
              className="block w-full rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-slate-900 transition-colors hover:bg-blue-50"
            >
              {item.label}
            </button>
          ))}
          <div className="my-1 h-px bg-slate-100" aria-hidden />
          {EXPLORE_LINKS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => go(item.path)}
              className="block w-full rounded-xl px-4 py-2.5 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {item.label}
            </button>
          ))}
          {signUp.show ? (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => go(signUp.path)}
                className={`w-full ${signUpButtonClass}`}
                style={{ backgroundColor: GYS_BLUE }}
              >
                Sign up
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
};

export default LandingPublicHeader;
