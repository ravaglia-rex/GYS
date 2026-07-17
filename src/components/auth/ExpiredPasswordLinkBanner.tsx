import React from "react";
import { Link } from "react-router-dom";
import type { AuthLinkExpiredFlow } from "../../pages/authentication_pages/authLinkExpiredState";

interface ExpiredPasswordLinkBannerProps {
  flow: AuthLinkExpiredFlow;
  onDismiss: () => void;
}

/**
 * Shown on /login after an expired or already-used Firebase password setup/reset link.
 */
const ExpiredPasswordLinkBanner: React.FC<ExpiredPasswordLinkBannerProps> = ({ flow, onDismiss }) => {
  const schoolFocused = flow === "setupPassword";

  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-5 shadow-sm sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-amber-950">This password link has expired</h2>
          {schoolFocused ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-amber-950">
              <li>Select “I am a school official…” below.</li>
              <li>Enter your school email and request a new link.</li>
            </ol>
          ) : (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-amber-950">
              <li>
                Go to{" "}
                <Link to="/reset-password" className="font-medium text-blue-800 underline-offset-2 hover:underline">
                  Forgot password
                </Link>
                .
              </li>
              <li>Enter your email to get a new link.</li>
            </ol>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-amber-800/80 hover:bg-amber-100 hover:text-amber-950"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ExpiredPasswordLinkBanner;
