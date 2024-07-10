import React from "react";

const InvalidAuthAction: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                <h1 className="text-3xl font-semibold text-red-600 mb-4">Invalid Action</h1>
                <p className="text-lg text-gray-700 mb-6">
                    The link you have used is invalid or has expired. Please try again.
                </p>
            </div>
        </div>
    );
};

export default InvalidAuthAction;