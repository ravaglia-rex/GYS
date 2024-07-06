import React from "react";
import * as Sentry from '@sentry/react';

const AccountCreationFailurePage: React.FC = () => {
    return (
        <Sentry.ErrorBoundary
            beforeCapture={(scope) => {
                scope.setTag('location', 'AccountCreationFailurePage');
            }}
         >
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                    <h1 className="text-3xl font-semibold text-red-600 mb-4">Account Creation Failed</h1>
                    <p className="text-lg text-gray-700 mb-6">Please contact the admin for assistance.</p>
                </div>
            </div>
        </Sentry.ErrorBoundary>
    );
};

export default AccountCreationFailurePage;
