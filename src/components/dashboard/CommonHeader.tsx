import React, { useState } from 'react';
import { Button } from '../ui/button';
import UserDropdown from './UserDropdown';
import TourJoyride from '../tour/TourJoyride';

const CommonHeader: React.FC = () => {
    const [run, setRun] = useState<boolean>(false);
    const handlleClickStart = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setRun(true);
    };

    return (
        <div>
            <header className="flex items-center justify-between p-4 bg-gray-900 shadow-md z-30 top-0 sticky">
                <h1 className="text-xl font-bold ml-20">Exam Dashboard</h1>
                <div className="flex items-center space-x-4 ml-auto">
                    <Button onClick={handlleClickStart}>Need Help?</Button>
                    <UserDropdown />
                </div>
            </header>
            <TourJoyride run={run} setRun={setRun} />
        </div>
    )
}

export default CommonHeader;