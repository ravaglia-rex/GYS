import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";
import VerifyEmail from "../../components/auth/VerifyEmailComponent";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import InvalidAuthAction from "./InvalidAuthAction";
import SchoolAdminPasswordSetupFromLink from "../../components/auth/SchoolAdminPasswordSetupFromLink";
import PasswordActionLayout from "../../components/auth/PasswordActionLayout";
import { parseFirebaseAuthActionParams } from "./parseFirebaseAuthActionParams";
import { isPasswordResetInProgress } from "./authActionSession";
import { LoadingSpinner as Spinner } from "../../components/ui/spinner";

const AuthActionPage: React.FC = () => {
  const location = useLocation();
  const { mode, oobCode } = useMemo(
    () => parseFirebaseAuthActionParams(location.search, location.hash),
    [location.search, location.hash]
  );

  const hasCode = Boolean(oobCode);
  const verifyEmailPage = mode === "verifyEmail" && hasCode;
  const resetPasswordPage = mode === "resetPassword" && hasCode;
  const setupPasswordPage = mode === "setupPassword" && hasCode;

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

  if (resetPasswordPage) {
    return (
      <Sentry.ErrorBoundary
        beforeCapture={(scope) => {
          scope.setTag("location", "NewPasswordForm");
        }}
      >
        <PasswordActionLayout
          title="Create your password"
          description="Choose a strong password for your Argus account. If you’re a school official, this step completes your first-time access after your school registered with us."
        >
          <NewPasswordForm actionCode={oobCode!} />
        </PasswordActionLayout>
      </Sentry.ErrorBoundary>
    );
  }

  if (setupPasswordPage) {
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
