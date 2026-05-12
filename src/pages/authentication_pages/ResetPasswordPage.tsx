import React from "react";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import PasswordActionLayout from "../../components/auth/PasswordActionLayout";

const ResetPasswordPage: React.FC = () => {
    return (
        <PasswordActionLayout
            title="Forgot your password?"
            description="Enter the email you use to sign in to Argus. We'll send a secure link so you can choose a new password."
        >
            <ResetPasswordForm />
        </PasswordActionLayout>
    );
};

export default ResetPasswordPage;
