import React from "react";

interface PasswordActionLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Full-viewport layout for /auth/action password flows (not Firebase’s default small hosted card).
 */
const PasswordActionLayout: React.FC<PasswordActionLayoutProps> = ({ title, description, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col">
        <header className="shrink-0 border-b border-white/10 bg-black/25 px-4 py-5 sm:px-8">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <img src="/argus_A_logo.png" alt="" className="h-10 w-10 rounded-lg shadow-lg" width={40} height={40} />
            <div>
              <span className="text-lg font-semibold tracking-tight text-white">Argus Assessment Portal</span>
              <p className="text-xs text-slate-400">School &amp; student access</p>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
          <div className="w-full max-w-xl">
            <div className="mb-8 text-center sm:mb-10">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
              <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
                {description}
              </p>
            </div>
            {children}
          </div>
        </main>

        <footer className="shrink-0 border-t border-white/10 bg-black/20 px-4 py-6 text-center text-xs text-slate-500 sm:px-8">
          <p>Thank you for working with Argus.</p>
          <p className="mt-1">
            Questions?{" "}
            <a href="mailto:talentsearch@argus.ai" className="font-medium text-indigo-300 hover:text-indigo-200 hover:underline">
              talentsearch@argus.ai
            </a>
          </p>
          <p className="mt-3 text-slate-600">— The Argus Team</p>
        </footer>
      </div>
    </div>
  );
};

export default PasswordActionLayout;
