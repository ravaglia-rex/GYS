import React, { useState, useEffect } from 'react';
import { Box, Button, Drawer, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Logout as LogoutIcon, Menu as MenuIcon } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import SidebarNavigation from '../layouts/SidebarNavigation';
import NotificationsDialog from '../components/dashboard/NotificationsDialog';
import StudentTutorialProvider from '../components/tutorial/StudentTutorialProvider';
import { auth } from '../firebase/firebase';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import type {
  CompletedAssessmentNotificationSource,
  DashboardNotificationEventSource,
  UnlockedAssessmentNotificationSource,
} from '../utils/dashboardNotifications';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_MINI = 88;
const MOBILE_HEADER_HEIGHT = 64;

interface DashboardLayoutProps {
  children: React.ReactNode;
  availableAssessmentsCount?: number;
  completedAssessments?: CompletedAssessmentNotificationSource[];
  unlockedAssessments?: UnlockedAssessmentNotificationSource[];
  backendNotificationEvents?: DashboardNotificationEventSource[];
}

export default function DashboardLayout({ 
  children, 
  availableAssessmentsCount = 0, 
  completedAssessments = [],
  unlockedAssessments = [],
  backendNotificationEvents = [],
}: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Add this useEffect to handle viewport changes
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return undefined;

    const handleTutorialStepChange = (event: Event) => {
      const targetId = event instanceof CustomEvent ? event.detail?.targetId : undefined;
      if (typeof targetId === 'string' && !targetId.startsWith('student-nav-')) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('argus:tutorial-step-change', handleTutorialStepChange);
    return () => {
      window.removeEventListener('argus:tutorial-step-change', handleTutorialStepChange);
    };
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /** Sidebar passes this after a nav link navigation; must not toggle on desktop (would hide the drawer with no menu button to reopen). */
  const closeSidebarAfterNav = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSidebarCollapse = () => {
    if (isMobile) {
      setSidebarCollapsed(false);
      setSidebarOpen(false);
      return;
    }

    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
  };

  const handleLogout = async () => {
    try {
      authTokenHandler.clearToken();
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <StudentTutorialProvider>
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', overflowX: 'hidden' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: isMobile ? DRAWER_WIDTH : sidebarCollapsed ? DRAWER_WIDTH_MINI : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? DRAWER_WIDTH : sidebarCollapsed ? DRAWER_WIDTH_MINI : DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#0f172a',
            backgroundImage: 'none',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'width 0.3s ease',
          },
        }}
      >
        <SidebarNavigation 
          collapsed={sidebarCollapsed} 
          onCollapse={handleSidebarCollapse}
          onClose={closeSidebarAfterNav}
        />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          maxWidth: '100%',
          backgroundColor: '#0f172a',
          transition: 'margin 0.3s ease',
          marginLeft: 0,
          overflowX: 'hidden',
        }}
      >
        {isMobile && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: MOBILE_HEADER_HEIGHT,
                zIndex: theme.zIndex.appBar,
                boxSizing: 'border-box',
                px: { xs: 1.5, sm: 2 },
                pt: 1.5,
                pb: 1,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(15, 23, 42, 0.97)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <IconButton
                color="inherit"
                aria-label="open navigation menu"
                onClick={handleDrawerToggle}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  '&:hover': { bgcolor: 'rgba(30, 41, 59, 0.96)' },
                }}
              >
                <MenuIcon />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LogoutIcon fontSize="small" />}
                onClick={handleLogout}
                sx={{
                  flexShrink: 0,
                  color: '#e2e8f0',
                  borderColor: 'rgba(226, 232, 240, 0.32)',
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700,
                  minHeight: 40,
                  px: 1.5,
                  '&:hover': {
                    borderColor: 'rgba(226, 232, 240, 0.6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
            <Box sx={{ height: MOBILE_HEADER_HEIGHT, flexShrink: 0 }} aria-hidden />
          </>
        )}

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            px: { xs: 1.5, sm: 2, md: 3 },
            pb: { xs: 2, md: 3 },
            pt: { xs: 2, lg: 3 },
            pl: { xs: 1.5, sm: 2, md: 3 },
            boxSizing: 'border-box',
            overflowX: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Notifications Dialog */}
      <NotificationsDialog
        open={notificationsOpen}
        onClose={handleNotificationsClose}
        availableAssessmentsCount={availableAssessmentsCount}
        completedAssessments={completedAssessments}
        unlockedAssessments={unlockedAssessments}
        backendNotificationEvents={backendNotificationEvents}
      />
    </Box>
    </StudentTutorialProvider>
  );
}
