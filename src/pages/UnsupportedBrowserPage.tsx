import React from "react";

const UnsupportedBrowserPage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                <h1 className="text-3xl font-semibold text-red-600 mb-4">Unsupported Browser</h1>
                <p className="text-lg text-gray-700 mb-6">We don't currently support this browser🙈. Use Chrome or Edge (we're big fans of the Arc Browser!) for accessing our site.</p>
            </div>
        </div>
    );
};

export default UnsupportedBrowserPage;
