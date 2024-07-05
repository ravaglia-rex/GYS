import React, { useState } from 'react';
import EmailEntryForm from '../../components/auth/EmailForm';
import SignInForm from '../../components/auth/SignInForm';
import SignUpForm from '../../components/auth/SignUpForm';

const AuthenticationPage: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [emailExists, setEmailExists] = useState<boolean | null>(null);

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(/assets/sign-up-background.jpg)` }}
        >
            {emailExists === null && (
                <EmailEntryForm
                    setEmail={setEmail}
                    setEmailExists={setEmailExists}
                />
            )}
            {emailExists === true && <SignInForm email={email} />}
            {emailExists === false && <SignUpForm email={email} setEmailExists={setEmailExists}/>}
        </div>
    );
};

export default AuthenticationPage;