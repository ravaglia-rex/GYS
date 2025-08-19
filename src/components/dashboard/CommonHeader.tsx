import React, { useState } from 'react';
import { Button } from '../ui/button';
import UserDropdown from './UserDropdown';
import TourJoyride from '../tour/TourJoyride';
import analytics from '../../segment/segment';
import { useLocation } from 'react-router-dom';
import { auth } from '../../firebase/firebase';

const CommonHeader: React.FC = () => {
    const [run, setRun] = useState<boolean>(false);
    const location = useLocation();
    const handlleClickStart = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setRun(true);
        analytics.track('[NAVIGATE] Help Flow', {
            location: location.pathname,
            email: auth.currentUser?.email,
        });
    };

    return (
        <div>
            <header className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 z-30 top-0 sticky">
                <h1 className="text-xl font-semibold">Exam Dashboard</h1>
                <div className="flex items-center space-x-3 ml-auto">
                    <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handlleClickStart}>Need Help?</Button>
                    <UserDropdown />
                </div>
            </header>
            <TourJoyride run={run} setRun={setRun} />
        </div>
    )
}

export default CommonHeader;