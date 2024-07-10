import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import { useSearchParams } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import VerifyEmail from "../../components/auth/VerifyEmailComponent";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import InvalidAuthAction from "./InvalidAuthAction";

const AuthActionPage: React.FC = () => {
    const navigate = useNavigate();
    const [verifyEmailPage, setVerifyEmailPage] = useState(false);
    const [resetPasswordPage, setResetPasswordPage] = useState(false);
    const {toast} = useToast();
    let [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    useEffect(() => {
        console.log("mode: ", mode);
        if (mode === 'verifyEmail' && actionCode) {
            setVerifyEmailPage(true);
        } else if(mode === 'resetPassword' && actionCode) {
            setResetPasswordPage(true);
        }
    }, [navigate, actionCode, mode, toast]);

    return (
        <Sentry.ErrorBoundary
            beforeCapture={(scope) => {
                scope.setTag('location', 'VerifyEmail');
            }}
        >
            {verifyEmailPage && <VerifyEmail actionCode={actionCode||""} />}
            {resetPasswordPage && <NewPasswordForm actionCode={actionCode||""} />}
            {!verifyEmailPage && !resetPasswordPage && 
                <InvalidAuthAction />
            }
        </Sentry.ErrorBoundary>
    );
}

export default AuthActionPage;