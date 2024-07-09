import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import * as Sentry from "@sentry/react";

const VerifyEmailErrorPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                user.reload().then(() => {
                    if (user.emailVerified) {
                        navigate("/");
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    return (
        <Sentry.ErrorBoundary
            beforeCapture={(scope) => {
                scope.setTag("location", "VerifyEmailErrorPage");
            }}
        >
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                    <h1 className="text-3xl font-semibold text-red-600 mb-4">Email Verification Failed 😖</h1>
                    <p className="text-lg text-gray-700 mb-6">
                        Yeah, this is awkward. It seems like your email verification link is invalid. Please try again.
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300" onClick={() => navigate('/')}>
                        Go to Login
                    </button>
                </div>
            </div>
        </Sentry.ErrorBoundary>
    );
}

export default VerifyEmailErrorPage;