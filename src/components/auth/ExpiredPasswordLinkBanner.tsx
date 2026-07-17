import React from "react";
import { Link } from "react-router-dom";
import type { AuthLinkExpiredFlow } from "../../pages/authentication_pages/authLinkExpiredState";

interface ExpiredPasswordLinkBannerProps {
  flow: AuthLinkExpiredFlow;
  onDismiss: () => void;
}

/**
 * Shown on /login after an expired or already-used Firebase password setup/reset link.
 * Copy mirrors the recovery steps in invitation / welcome emails.
 */
const ExpiredPasswordLinkBanner: React.FC<ExpiredPasswordLinkBannerProps> = ({ flow, onDismiss }) => {
  const schoolFocused = flow === "setupPassword";

  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-5 shadow-sm sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-amber-950">This password link has expired</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
            Setup and reset links are valid for about <strong className="font-semibold">1 hour</strong>.
            You can request a new one as many times as you need — it does not limit how often you set up
            your account.
          </p>
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

      {schoolFocused ? (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-amber-950">
          <li>
            Check <strong className="font-semibold">I am a school official logging into the school dashboard</strong>{" "}
            below.
          </li>
          <li>Enter the same school email the invitation was sent to, then continue.</li>
          <li>Request a new password-setup link, open the new email, and set your password.</li>
        </ol>
      ) : (
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-amber-950">
          <div>
            <p className="font-semibold text-amber-950">Students</p>
            <ol className="mt-1.5 list-decimal space-y-1.5 pl-5">
              <li>
                Open{" "}
                <Link to="/reset-password" className="font-medium text-blue-800 underline-offset-2 hover:underline">
                  Forgot password
                </Link>{" "}
                (or continue below, then use Forgot password on the next screen).
              </li>
              <li>Enter the same email this message was sent to and submit.</li>
              <li>Check your inbox for a new link, set a password, then sign in here.</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-amber-950">School officials</p>
            <ol className="mt-1.5 list-decimal space-y-1.5 pl-5">
              <li>
                Check <strong className="font-semibold">I am a school official…</strong> below.
              </li>
              <li>Enter your school email, continue, and request a new password-setup link.</li>
              <li>Open the new email (check spam if needed) and set your password.</li>
            </ol>
          </div>
        </div>
      )}

      {!schoolFocused && (
        <div className="mt-4">
          <Link
            to="/reset-password"
            className="inline-flex items-center justify-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
          >
            Request a new student link
          </Link>
        </div>
      )}
    </div>
  );
};

export default ExpiredPasswordLinkBanner;
