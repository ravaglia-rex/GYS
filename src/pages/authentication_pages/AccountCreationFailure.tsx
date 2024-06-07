import React from "react";

const AccountCreationFailurePage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                <h1 className="text-3xl font-semibold text-red-600 mb-4">Account Creation Failed</h1>
                <p className="text-lg text-gray-700 mb-6">Please contact the admin for assistance.</p>
            </div>
        </div>
    );
};

export default AccountCreationFailurePage;
