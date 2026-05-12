import React from "react";

interface PasswordActionLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Full-viewport layout for /auth/action password flows (not Firebase’s default small hosted card).
 * Root is viewport-height with no document scroll; the main region scrolls only when content overflows.
 */
const PasswordActionLayout: React.FC<PasswordActionLayoutProps> = ({ title, description, children }) => {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 text-slate-100">
      <header className="shrink-0 border-b border-white/10 bg-black/25 px-4 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <img src="/argus-logo.png" alt="" className="h-9 w-9 shrink-0 rounded-lg shadow-lg sm:h-10 sm:w-10" width={40} height={40} />
          <div className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-tight text-white sm:text-lg">
              Argus Assessment Portal
            </span>
            <p className="text-xs text-slate-400">School &amp; student access</p>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-2 sm:px-6 sm:py-5">
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center py-1">
          <div className="mb-4 w-full text-center sm:mb-6">
            <h1 className="text-balance text-xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="mx-auto mt-2 max-w-lg text-pretty text-sm leading-snug text-slate-400 sm:mt-3 sm:text-base sm:leading-relaxed">
              {description}
            </p>
          </div>
          {children}
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-black/20 px-4 py-3 text-center text-xs leading-relaxed text-slate-500 sm:px-8 sm:py-5 sm:leading-normal">
        <p>Thank you for working with Argus.</p>
        <p className="mt-0.5 sm:mt-1">
          Questions?{" "}
          <a
            href="mailto:globalyoungscholar@argus.ai"
            className="font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
          >
            globalyoungscholar@argus.ai
          </a>
        </p>
      
      </footer>
    </div>
  );
};

export default PasswordActionLayout;
