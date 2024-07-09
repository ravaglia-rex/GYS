import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import * as Sentry from "@sentry/react";

const AccountCreationSuccessPage: React.FC = () => {
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
                scope.setTag("location", "AccountCreationSuccessPage");
            }}
        >
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                    <h1 className="text-3xl font-semibold text-green-600 mb-4">Account Created Successfully</h1>
                    <p className="text-lg text-gray-700 mb-6">
                        A verification email has been sent to your email address. Please verify your email to activate your account.
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300" onClick={() => navigate('/')}>
                        Go to Login
                    </button>
                </div>
            </div>
        </Sentry.ErrorBoundary>
    );
}

export default AccountCreationSuccessPage;