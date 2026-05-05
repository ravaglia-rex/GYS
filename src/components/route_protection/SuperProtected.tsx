import React, { ReactNode, useEffect, useState } from 'react';
import { auth } from '../../firebase/firebase';
import { checkSingleTab } from './sessionHandler';
import Protected from './Protected';
import UnsupportedBrowserPage from '../../pages/UnsupportedBrowserPage';
import { signOutStudentAndClearSession } from '../../services/studentActiveSession';

interface SuperProtectedProps {
    children: ReactNode;
}

const SuperProtected: React.FC<SuperProtectedProps> = ({ children }) => {
    const [isChromiumBrowser, setIsChromiumBrowser] = useState(true);

    const handleTabClose = async () => {
        const user = auth.currentUser;
        if (user) {
            await signOutStudentAndClearSession();
        }
    };

    const handlePopState = async () => {
        const user = auth.currentUser;
        if (user) {
            alert('Uh oh! No backsies! Please log back in to appear for the test. You will be logged out now.');
            await signOutStudentAndClearSession();
        }
    };

    useEffect(() => {
        checkSingleTab();
        window.addEventListener('beforeunload', handleTabClose);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('beforeunload', handleTabClose);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        const isChromiumBased = () => {
          const userAgent = navigator.userAgent;
          const isChrome = userAgent.includes('Chrome');
          const isEdge = userAgent.includes('Edg');
          const isArc = userAgent.includes('Arc');
          return isChrome || isEdge || isArc;
        };
        if(!isChromiumBased()) {
          setIsChromiumBrowser(false);
        }
      }, []);
    if(!isChromiumBrowser){
        return <UnsupportedBrowserPage />;
    }

    return <Protected children={children} />;
};

export default SuperProtected;
