import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useToast } from "../../components/ui/use-toast";
import { useSearchParams } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const [isVerified, setIsVerified] = useState(false);
    const {toast} = useToast();
    let [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    useEffect(() => {
        if (mode === 'verifyEmail' && actionCode) {
            applyActionCode(auth, actionCode)
                .then(() => {
                    setIsVerified(true);
                    toast({
                        variant: 'default',
                        title: 'Email Verified',
                        description: 'You have successfully verified your email address. Redirecting to login...'
                      });
                    // Redirect to login page after 5 seconds if email is verified
                    const timer = setTimeout(() => {
                        navigate('/');
                    }, 5000);
                    return () => clearTimeout(timer); // Cleanup timer
                })
                .catch((error) => {
                    toast({
                        variant: 'destructive',
                        title: 'Email Verification Error',
                        description: error.message
                      });
                    navigate('/auth/verify-email-error');
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Email Verification Error',
                    description: 'Invalid email verification link.'
                });
                navigate('/auth/verify-email-error');
        }
    }, [navigate, actionCode, mode, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {isVerified && <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                <h1 className="text-3xl font-semibold text-green-600 mb-4">Verified Your Email</h1>
                <p className="text-lg text-gray-700 mb-6">
                    You've successfully verified your email address. Redirecting to login...
                </p>
            </div>}
        </div>
    );
}

export default VerifyEmail;