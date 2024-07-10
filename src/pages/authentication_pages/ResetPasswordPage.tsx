import React from "react";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

const ResetPasswordPage: React.FC = () => {

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(/assets/sign-up-background.jpg)` }}
        >
            <ResetPasswordForm />
        </div>
    );
};

export default ResetPasswordPage;