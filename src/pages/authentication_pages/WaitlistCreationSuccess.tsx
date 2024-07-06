import React from "react";
import * as Sentry from "@sentry/react";

const WaitlistCreationSuccessPage: React.FC = () => {

    return (
        <Sentry.ErrorBoundary
            beforeCapture={(scope) => {
                scope.setTag("location", "WaitlistCreationSuccessPage");
            }}
        >
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                    <h1 className="text-3xl font-semibold text-green-600 mb-4">You've been added to the waitlist</h1>
                    <p className="text-lg text-gray-700 mb-6">
                        We'll notify you when you're next in line to join Argus.
                    </p>
                </div>
            </div>
        </Sentry.ErrorBoundary>
    );
}

export default WaitlistCreationSuccessPage;