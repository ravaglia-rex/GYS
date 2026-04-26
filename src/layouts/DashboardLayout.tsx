import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import SidebarNavigation from '../layouts/SidebarNavigation';
import NotificationsDialog from '../components/dashboard/NotificationsDialog';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_MINI = 88;

interface DashboardLayoutProps {
  children: React.ReactNode;
  availableAssessmentsCount?: number;
  resultsAvailableCount?: number;
}

export default function DashboardLayout({ 
  children, 
  availableAssessmentsCount = 0, 
  resultsAvailableCount = 0 
}: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  // Add this useEffect to handle viewport changes
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    }
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
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
  };

  const handleProfileNavigation = () => {
    navigate('/profile');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: sidebarCollapsed ? DRAWER_WIDTH_MINI : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarCollapsed ? DRAWER_WIDTH_MINI : DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
          backgroundColor: '#0f172a',
          transition: 'margin 0.3s ease',
          marginLeft: 0,
        }}
      >
        {/* Top App Bar */}
        <AppBar
          position="sticky"
          sx={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'none',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  onClick={handleDrawerToggle}
                  edge="start"
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
           
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* User Avatar */}
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(139, 92, 246, 0.3)',
                  }
                }}
                onClick={handleProfileNavigation}
              >
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Notifications Dialog */}
      <NotificationsDialog
        open={notificationsOpen}
        onClose={handleNotificationsClose}
        availableAssessmentsCount={availableAssessmentsCount}
        resultsAvailableCount={resultsAvailableCount}
      />
    </Box>
  );
}
