import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../BigSpinner';
import { signOut } from 'firebase/auth';
import { checkSingleTab } from './sessionHandler';
import Protected from './Protected';

interface SuperProtectedProps {
    children: ReactNode;
}

const SuperProtected: React.FC<SuperProtectedProps> = ({ children }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <BigSpinner/>;
    }

    return <Protected children={children} />;
};

export default Protected;
