import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useToast } from "../ui/use-toast";
import * as Sentry from "@sentry/react";
import { checkSchoolEmail, verifySchoolEmail } from "../../db/schoolAdminCollection";
import authTokenHandler from "../../functions/auth_token/auth_token_handler";

interface VerifyEmailProps {
  actionCode: string;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ actionCode }) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    applyActionCode(auth, actionCode)
      .then(async () => {
        setIsVerified(true);

        const user = auth.currentUser;
        if (user?.email) {
          try {
            const schoolInfo = await checkSchoolEmail(user.email);
            if (
              schoolInfo &&
              !schoolInfo.verified &&
              schoolInfo.registrationPaymentComplete === true
            ) {
              const authToken = await user.getIdToken();
              authTokenHandler.setAuthToken(authToken);
              await verifySchoolEmail(user.email);
            }
          } catch (error) {
            console.error("Error verifying school email:", error);
          }
        }

        toast({
          variant: "default",
          title: "Email verified",
          description: "Redirecting to login…",
        });
        navigate("/", { replace: true });
      })
      .catch((error: any) => {
        Sentry.withScope((scope) => {
          scope.setTag("location", "VerifyEmail.applyActionCode");
          Sentry.captureException(error);
        });
        toast({
          variant: "destructive",
          title: "Email verification error",
          description: error.message,
        });
        navigate("/auth/verify-email-error");
      });
  }, [navigate, actionCode, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      {isVerified && (
        <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <h1 className="mb-4 text-3xl font-semibold text-green-600">Email verified</h1>
          <p className="text-lg text-gray-700">Taking you to the login page…</p>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
