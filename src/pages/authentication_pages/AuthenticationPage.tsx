import React, { useState } from 'react';
import EmailEntryForm from '../../components/auth/EmailForm';
import SignInForm from '../../components/auth/SignInForm';
import SignUpForm from '../../components/auth/SignUpForm';
import * as Sentry from '@sentry/react';

const AuthenticationPage: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [emailExists, setEmailExists] = useState<boolean | null>(null);

    return (
        <Sentry.ErrorBoundary
            beforeCapture={(scope) => {
                scope.setTag('location', 'AuthenticationPage');
            }}
        >
            <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-950 text-gray-100">
                {/* Left visual panel */}
                <div className="relative hidden md:block">
                    <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: "url('/assets/sign-in-background.jpg')" }} />
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
                                <h1 className="text-3xl font-semibold leading-snug">Focused. Fair. Future-ready.</h1>
                                <p className="mt-2 text-gray-300 text-sm">
                                    Take secure, proctored assessments with confidence. Advanced monitoring keeps the
                                    exam fair while you focus on doing your best.
                                </p>
                            </div>
                        </div>
                        {emailExists === null && (
                            <EmailEntryForm
                                setEmail={setEmail}
                                setEmailExists={setEmailExists}
                            />
                        )}
                        {emailExists === true && <SignInForm email={email} />}
                        {emailExists === false && (
                            <SignUpForm email={email} setEmailExists={setEmailExists} />
                        )}
                    </div>
                </div>
                <div className="fixed bottom-4 right-4 text-xs text-gray-400">2025 Argus AI</div>
            </div>
        </Sentry.ErrorBoundary>
    );
};

export default AuthenticationPage;