import React, { useState } from 'react';
import { Box, Typography, Button as MuiButton } from '@mui/material';
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
        <Box>
            <Box component="header" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: { xs: 2, sm: 3, md: 4 },
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 30,
                position: 'sticky',
                top: 0
            }}>
                <Box>
                    <Typography variant="h4" sx={{ 
                        color: 'white', 
                        fontWeight: 600,
                        mb: 0.5
                    }}>
                        Assessment Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.875rem'
                    }}>
                        Welcome back, {auth.currentUser?.displayName || auth.currentUser?.email || 'Student'}! 👋
                    </Typography>
                </Box>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    ml: 'auto'
                }}>
                    <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handlleClickStart}>
                        Need Help?
                    </Button>
                    <UserDropdown />
                </Box>
            </Box>
            <TourJoyride run={run} setRun={setRun} />
        </Box>
    )
}

export default CommonHeader;