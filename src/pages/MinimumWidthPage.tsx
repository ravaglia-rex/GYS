import React from "react";

const MinimumWidthPage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                <h1 className="text-3xl font-semibold text-red-600 mb-4">Screen Too Small</h1>
                <p className="text-lg text-gray-700 mb-6">This application requires a larger screen to function properly. We're working on a mobile friendly version. In the meantime, please use a desktop or laptop.</p>
            </div>
        </div>
    );
};

export default MinimumWidthPage;
