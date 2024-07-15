import React, { ReactNode, useEffect, useState } from 'react';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { checkSingleTab } from './sessionHandler';
import Protected from './Protected';
import UnsupportedBrowserPage from '../../pages/UnsupportedBrowserPage';

interface SuperProtectedProps {
    children: ReactNode;
}

const SuperProtected: React.FC<SuperProtectedProps> = ({ children }) => {
    const [isChromiumBrowser, setIsChromiumBrowser] = useState(true);

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
