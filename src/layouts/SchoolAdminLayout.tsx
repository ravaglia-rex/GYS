import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  Divider
} from '@mui/material';
import { 
  Menu as MenuIcon,
  // COMMENTED OUT - Notifications as NotificationsIcon,
  School as SchoolIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { auth } from '../firebase/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../state_data/reducer';
// COMMENTED OUT - import NotificationsDialog from '../components/dashboard/NotificationsDialog';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_MINI = 88;

interface SchoolAdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/school-admin/dashboard',
    icon: <DashboardIcon />,
  },
  {
    title: 'Students',
    path: '/school-admin/students',
    icon: <PeopleIcon />,
  },
  {
    title: 'Analytics',
    path: '/school-admin/analytics',
    icon: <AnalyticsIcon />,
  },
  {
    title: 'Settings',
    path: '/school-admin/settings',
    icon: <SettingsIcon />,
  },
];

export default function SchoolAdminLayout({ children }: SchoolAdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // COMMENTED OUT - const [notificationsOpen, setNotificationsOpen] = useState(false);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  
  // Mock school admin data for testing
  const mockSchoolAdmin = {
    email: 'srishti2k1@gmail.com',
    schoolId: '018WuXO6zOabXh4ZXmcq',
    role: 'schooladmin'
  };

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // COMMENTED OUT - Notification handlers
  // const handleNotificationsOpen = () => {
  //   setNotificationsOpen(true);
  // };

  // const handleNotificationsClose = () => {
  //   setNotificationsOpen(false);
  // };

  const handleLogout = async () => {
    try {
      // For testing, just navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const drawerWidth = sidebarCollapsed ? DRAWER_WIDTH_MINI : DRAWER_WIDTH;

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { lg: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
            School Admin Portal
          </Typography>
        </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* COMMENTED OUT - Notifications */}
            {/* <IconButton 
              color="inherit" 
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton> */}

            {/* Profile Avatar */}
            <IconButton
              onClick={() => navigate('/school-admin/settings')}
              sx={{ p: 0 }}
            >
              <Avatar
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: '#3b82f6',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {mockSchoolAdmin.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            {/* Logout Button */}
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#0f172a',
            borderRight: '1px solid rgba(59, 130, 246, 0.2)',
            color: 'white',
          },
        }}
      >
        <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          minHeight: '64px !important',
          px: 2
        }}>
                      {!sidebarCollapsed && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ color: '#3b82f6' }} />
                <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                  Admin
                </Typography>
              </Box>
            )}
          <IconButton
            onClick={handleSidebarCollapse}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              display: { xs: 'none', lg: 'flex' }
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>

        <Divider sx={{ borderColor: 'rgba(59, 130, 246, 0.2)' }} />

        <Box sx={{ p: 2 }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
              School ID: {mockSchoolAdmin.schoolId}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          {navItems.map((item) => (
            <Box
              key={item.path}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                bgcolor: isActive(item.path) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                '&:hover': {
                  bgcolor: isActive(item.path) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <Box
                onClick={() => navigate(item.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  color: isActive(item.path) ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </Box>
                {!sidebarCollapsed && (
                  <Typography variant="body2">
                    {item.title}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#0f172a',
          minHeight: '100vh',
          p: 3,
          maxWidth: '100%',
          overflowX: 'auto'
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* COMMENTED OUT - Notifications Dialog */}
      {/* <NotificationsDialog
        open={notificationsOpen}
        onClose={handleNotificationsClose}
      /> */}
    </Box>
  );
}
