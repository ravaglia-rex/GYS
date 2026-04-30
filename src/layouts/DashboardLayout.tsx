import React, { useState, useEffect } from 'react';
import { Box, Drawer, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
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
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open navigation menu"
            onClick={handleDrawerToggle}
            sx={{
              position: 'fixed',
              top: 12,
              left: 12,
              zIndex: theme.zIndex.appBar,
              bgcolor: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              '&:hover': { bgcolor: 'rgba(30, 41, 59, 0.96)' },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, px: 3, pb: 3, pt: { xs: 9, lg: 3 } }}>
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
