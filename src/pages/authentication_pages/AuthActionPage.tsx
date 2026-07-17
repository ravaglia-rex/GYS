import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { verifyPasswordResetCode } from "firebase/auth";
import VerifyEmail from "../../components/auth/VerifyEmailComponent";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import InvalidAuthAction from "./InvalidAuthAction";
import SchoolAdminPasswordSetupFromLink from "../../components/auth/SchoolAdminPasswordSetupFromLink";
import PasswordActionLayout from "../../components/auth/PasswordActionLayout";
import { parseFirebaseAuthActionParams } from "./parseFirebaseAuthActionParams";
import { isPasswordResetInProgress } from "./authActionSession";
import { LoadingSpinner as Spinner } from "../../components/ui/spinner";
import { auth } from "../../firebase/firebase";
import type { AuthLinkExpiredFlow, AuthLinkExpiredLocationState } from "./authLinkExpiredState";

function isExpiredOrInvalidActionCode(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "auth/expired-action-code" || code === "auth/invalid-action-code";
}

const AuthActionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, oobCode } = useMemo(
    () => parseFirebaseAuthActionParams(location.search, location.hash),
    [location.search, location.hash]
  );

  const hasCode = Boolean(oobCode);
  const verifyEmailPage = mode === "verifyEmail" && hasCode;
  const resetPasswordPage = mode === "resetPassword" && hasCode;
  const setupPasswordPage = mode === "setupPassword" && hasCode;
  const isPasswordAction = resetPasswordPage || setupPasswordPage;

  const [passwordCodeStatus, setPasswordCodeStatus] = useState<
    "idle" | "checking" | "valid" | "redirecting" | "failed"
  >(isPasswordAction ? "checking" : "idle");

  useEffect(() => {
    if (!isPasswordAction || !oobCode) {
      setPasswordCodeStatus("idle");
      return;
    }

    let cancelled = false;
    setPasswordCodeStatus("checking");

    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        if (!cancelled) setPasswordCodeStatus("valid");
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        if (isExpiredOrInvalidActionCode(error)) {
          setPasswordCodeStatus("redirecting");
          const flow: AuthLinkExpiredFlow = mode === "setupPassword" ? "setupPassword" : "resetPassword";
          const state: AuthLinkExpiredLocationState = { authLinkExpired: true, flow };
          navigate("/login", { replace: true, state });
          return;
        }

        Sentry.withScope((scope) => {
          scope.setTag("location", "AuthActionPage.verifyPasswordResetCode");
          Sentry.captureException(error);
        });
        setPasswordCodeStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [isPasswordAction, oobCode, mode, navigate]);

  // After confirmPasswordReset(), Firebase can remove oobCode from the URL while async work continues.
  if (isPasswordResetInProgress() && !hasCode) {
    return (
      <PasswordActionLayout
        title="Finishing your password setup"
        description="We’re completing your account and will redirect you to the login page in a moment."
      >
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PasswordActionLayout>
    );
  }

  if (isPasswordAction && (passwordCodeStatus === "checking" || passwordCodeStatus === "redirecting")) {
    return (
      <PasswordActionLayout
        title={passwordCodeStatus === "redirecting" ? "This link isn’t valid anymore" : "Checking your link"}
        description={
          passwordCodeStatus === "redirecting"
            ? "Taking you to sign-in so you can request a new password link…"
            : "One moment while we confirm this password link is still valid."
        }
      >
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PasswordActionLayout>
    );
  }

  if (resetPasswordPage && passwordCodeStatus === "valid") {
    return (
      <Sentry.ErrorBoundary
        beforeCapture={(scope) => {
          scope.setTag("location", "NewPasswordForm");
        }}
      >
        <PasswordActionLayout title="Create your password">
          <NewPasswordForm actionCode={oobCode!} />
        </PasswordActionLayout>
      </Sentry.ErrorBoundary>
    );
  }

  if (setupPasswordPage && passwordCodeStatus === "valid") {
    return (
      <Sentry.ErrorBoundary
        beforeCapture={(scope) => {
          scope.setTag("location", "SchoolAdminPasswordSetup");
        }}
      >
        <PasswordActionLayout
          title="Finish your school account setup"
          description="Create a password for your official school email. You’ll use it whenever you sign in to the school dashboard."
        >
          <SchoolAdminPasswordSetupFromLink actionCode={oobCode!} />
        </PasswordActionLayout>
      </Sentry.ErrorBoundary>
    );
  }

  if (passwordCodeStatus === "failed") {
    return <InvalidAuthAction />;
  }

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag("location", "VerifyEmail");
      }}
    >
      {verifyEmailPage && <VerifyEmail actionCode={oobCode!} />}
      {!verifyEmailPage && <InvalidAuthAction />}
    </Sentry.ErrorBoundary>
  );
};

export default AuthActionPage;
