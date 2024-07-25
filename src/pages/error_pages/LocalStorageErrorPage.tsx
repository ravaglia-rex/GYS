import React from "react";

const LocalStorageErrorPage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                <h1 className="text-3xl font-semibold text-red-600 mb-4">Local Storage Access Needed</h1>
                <p className="text-lg text-gray-700 mb-6">Hmmmm🤔. We need local storage access for our web application to work</p>
            </div>
        </div>
    );
};

export default LocalStorageErrorPage;
