import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import { useSearchParams } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import VerifyEmail from "../../components/auth/VerifyEmailComponent";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import InvalidAuthAction from "./InvalidAuthAction";
import SchoolAdminPasswordSetupFromLink from "../../components/auth/SchoolAdminPasswordSetupFromLink";

const AuthActionPage: React.FC = () => {
    const navigate = useNavigate();
    const [verifyEmailPage, setVerifyEmailPage] = useState(false);
    const [resetPasswordPage, setResetPasswordPage] = useState(false);
    const [setupPasswordPage, setSetupPasswordPage] = useState(false);
    const {toast} = useToast();
    let [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    useEffect(() => {
        if (mode === 'verifyEmail' && actionCode) {
            setVerifyEmailPage(true);
        } else if(mode === 'resetPassword' && actionCode) {
            setResetPasswordPage(true);
        } else if(mode === 'setupPassword' && actionCode) {
            setSetupPasswordPage(true);
        }
    }, [navigate, actionCode, mode, toast]);

    if (resetPasswordPage) {
        return (
            <Sentry.ErrorBoundary
                beforeCapture={(scope) => {
                    scope.setTag('location', 'NewPasswordForm');
                }}
            >
                <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-950 text-gray-100">
                    {/* Left visual panel */}
                    <div className="relative hidden md:block">
                        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: "url('/assets/reset-password.png')" }} />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
                        <div className="relative z-10 p-10">
                            <div className="flex items-center gap-3">
                                <img src="/argus_A_logo.png" alt="Argus" className="h-8 w-8" />
                                <span className="text-xl font-semibold tracking-wide">Argus Exam Portal</span>
                            </div>
                        </div>
                    </div>

                    {/* Right auth panel */}
                    <div className="flex items-center justify-center p-6 md:p-10">
                        <div className="w-full max-w-md">
                            <div className="mb-8">
                                <div className="mt-1">
                                    <h1 className="text-3xl font-semibold leading-snug text-white">Set Your New Password</h1>
                                    <p className="mt-2 text-gray-300 text-sm">
                                        Create a strong password to secure your account.
                                    </p>
                                </div>
                            </div>
                            <NewPasswordForm actionCode={actionCode||""} />
                        </div>
                    </div>
                    <div className="fixed bottom-4 right-4 text-xs text-gray-400">2025 Argus AI</div>
                </div>
            </Sentry.ErrorBoundary>
        );
    }

    if (setupPasswordPage) {
        return (
            <Sentry.ErrorBoundary
                beforeCapture={(scope) => {
                    scope.setTag('location', 'SchoolAdminPasswordSetup');
                }}
            >
                <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-950 text-gray-100">
                    {/* Left visual panel */}
                    <div className="relative hidden md:block">
                        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: "url('/assets/reset-password.png')" }} />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
                        <div className="relative z-10 p-10">
                            <div className="flex items-center gap-3">
                                <img src="/argus_A_logo.png" alt="Argus" className="h-8 w-8" />
                                <span className="text-xl font-semibold tracking-wide">Argus Exam Portal</span>
                            </div>
                        </div>
                    </div>

                    {/* Right auth panel */}
                    <div className="flex items-center justify-center p-6 md:p-10">
                        <div className="w-full max-w-md">
                            <div className="mb-8">
                                <div className="mt-1">
                                    <h1 className="text-3xl font-semibold leading-snug text-white">Set Up Your Password</h1>
                                    <p className="mt-2 text-gray-300 text-sm">
                                        Create a password to complete your account setup.
                                    </p>
                                </div>
                            </div>
                            <SchoolAdminPasswordSetupFromLink actionCode={actionCode||""} />
                        </div>
                    </div>
                    <div className="fixed bottom-4 right-4 text-xs text-gray-400">2025 Argus AI</div>
                </div>
            </Sentry.ErrorBoundary>
        );
    }

    return (
        <Sentry.ErrorBoundary
            beforeCapture={(scope) => {
                scope.setTag('location', 'VerifyEmail');
            }}
        >
            {verifyEmailPage && <VerifyEmail actionCode={actionCode||""} />}
            {!verifyEmailPage && !resetPasswordPage && 
                <InvalidAuthAction />
            }
        </Sentry.ErrorBoundary>
    );
}

export default AuthActionPage;