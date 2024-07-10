import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useToast } from "../../components/ui/use-toast";
import * as Sentry from "@sentry/react";

interface VerifyEmailProps {
    actionCode: string;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ actionCode }) => {
    const navigate = useNavigate();
    const [isVerified, setIsVerified] = useState(false);
    const {toast} = useToast();

    useEffect(() => {
        applyActionCode(auth, actionCode)
            .then(() => {
                setIsVerified(true);
                toast({
                    variant: 'default',
                    title: 'Email Verified',
                    description: 'You have successfully verified your email address. Redirecting to login...'
                });
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            })
            .catch((error) => {
                Sentry.withScope((scope) => {
                    scope.setTag('location', 'VerifyEmail.applyActionCode');
                    Sentry.captureException(error);
                });
                toast({
                    variant: 'destructive',
                    title: 'Email Verification Error',
                    description: error.message
                  });
                navigate('/auth/verify-email-error');
            });
    }, [navigate, actionCode, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {isVerified && <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                <h1 className="text-3xl font-semibold text-green-600 mb-4">Verified Your Email</h1>
                <p className="text-lg text-gray-700 mb-6">
                    You've successfully verified your email address. Redirecting to login page...
                </p>
            </div>}
        </div>
    );
};

export default VerifyEmail;