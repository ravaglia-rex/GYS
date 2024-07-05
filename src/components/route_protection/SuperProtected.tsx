import React, { ReactNode, useEffect } from 'react';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { checkSingleTab } from './sessionHandler';
import Protected from './Protected';

interface SuperProtectedProps {
    children: ReactNode;
}

const SuperProtected: React.FC<SuperProtectedProps> = ({ children }) => {

    const handleTabClose = async () => {
        const user = auth.currentUser;
        if (user) {
        await signOut(auth);
        }
    };

    useEffect(() => {
        checkSingleTab();
        window.addEventListener('beforeunload', handleTabClose);
        return () => {
        window.removeEventListener('beforeunload', handleTabClose);
        };
    }, []);

    return <Protected children={children} />;
};

export default SuperProtected;
