import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Button
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
  EmojiEvents as EmojiEventsIcon,
  Quiz as QuizIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import ResetTutorialsButton from '../components/tutorial/ResetTutorialsButton';

interface SidebarNavigationProps {
  collapsed: boolean;
  onCollapse: () => void;
  onClose: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  children?: NavItem[];
}

const homeNavItem: NavItem = {
  title: 'Home',
  path: '/',
  icon: <HomeIcon sx={{ color: '#38bdf8' }} />,
};

/** Maps nav paths to tutorial spotlight targets (student dashboard shell). */
const STUDENT_NAV_TUTORIAL_ID: Partial<Record<string, string>> = {
  '/dashboard': 'student-nav-dashboard',
  '/leaderboard': 'student-nav-leaderboard',
  '/assessments': 'student-nav-assessments',
  '/assessments/reports': 'student-nav-reports',
  '/practice-test': 'student-nav-practice',
  '/reports': 'student-nav-reports',
  '/payments': 'student-nav-payments',
  '/settings': 'student-nav-settings',
};

const ASSESSMENTS_NAV_COLOR = '#3b82f6';
const HOW_GYS_NAV_COLOR = '#f97316';

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon sx={{ color: '#8b5cf6' }} />,
  },
  {
    title: 'How GYS Works',
    path: '/how-it-works',
    icon: <HelpOutlineIcon sx={{ color: HOW_GYS_NAV_COLOR }} />,
  },
  {
    title: 'School Leaderboard',
    path: '/leaderboard',
    icon: <EmojiEventsIcon sx={{ color: '#f59e0b' }} />,
  },
  {
    title: 'Practice Mode',
    path: '/practice-test',
    icon: <QuizIcon sx={{ color: '#38bdf8' }} />,
  },
  {
    title: 'Assessments',
    path: '/assessments',
    icon: <AssessmentIcon sx={{ color: ASSESSMENTS_NAV_COLOR }} />,
    children: [
      { title: 'Available', path: '/assessments/available', icon: <SchoolIcon sx={{ color: ASSESSMENTS_NAV_COLOR }} /> },
      { title: 'Completed & Results', path: '/assessments/completed', icon: <BarChartIcon sx={{ color: ASSESSMENTS_NAV_COLOR }} /> },
      { title: 'Reports', path: '/assessments/reports', icon: <AssignmentIcon sx={{ color: ASSESSMENTS_NAV_COLOR }} /> },
    ],
  },
  {
    title: 'Billing & Payments',
    path: '/payments',
    icon: <PaymentIcon sx={{ color: '#22c55e' }} />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon sx={{ color: '#94a3b8' }} />,
  },
];

export default function SidebarNavigation({ collapsed, onCollapse, onClose }: SidebarNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = auth.currentUser;
  const [openSubmenus, setOpenSubmenus] = React.useState<{ [key: string]: boolean }>({});

  const handleItemClick = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
      onClose(); // Close mobile sidebar only when actually navigating
    }
  };

  const handleSubmenuToggle = (title: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
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

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasActiveChild = (item: NavItem): boolean =>
    item.children?.some((child) => isActive(child.path) || hasActiveChild(child)) ?? false;

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isItemActive = isActive(item.path) || hasActiveChild(item);
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenus[item.title] ?? isItemActive;

    return (
      <Box key={item.title}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip 
            title={collapsed ? item.title : ''} 
            placement="right"
            disableHoverListener={!collapsed}
          >
            <ListItemButton
              data-tutorial-id={STUDENT_NAV_TUTORIAL_ID[item.path]}
              onClick={() => {
                if (hasChildren) {
                  handleSubmenuToggle(item.title);
                } else {
                  handleItemClick(item.path);
                }
              }}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'initial',
                px: 2.5,
                ml: level * 2,
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                backgroundColor: isItemActive 
                  ? 'rgba(139, 92, 246, 0.2)' 
                  : 'transparent',
                color: isItemActive 
                  ? '#8b5cf6' 
                  : 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: isItemActive 
                    ? 'rgba(139, 92, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 3,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <>
                  <ListItemText 
                    primary={item.title} 
                    sx={{ 
                      opacity: 1,
                      '& .MuiTypography-root': {
                        fontWeight: isItemActive ? 600 : 400,
                      }
                    }}
                  />
                  {hasChildren && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubmenuToggle(item.title);
                      }}
                      sx={{ color: 'inherit' }}
                    >
                      {isSubmenuOpen ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {/* Render children if they exist */}
        {hasChildren && !collapsed && (
          <Collapse in={isSubmenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        pb: 2
      }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src="/argus-student-logo.png"
                alt=""
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Argus
            </Typography>
          </Box>
        )}
        
        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
          <IconButton
            onClick={onCollapse}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { color: 'white' }
            }}
          >
            <ChevronLeftIcon 
              sx={{ 
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }} 
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* User Info */}
      {!collapsed && currentUser && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #8b5cf6, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                {currentUser.displayName || 'Student'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {currentUser.email}
              </Typography>
            </Box>
          </Box>
          <ResetTutorialsButton
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              mt: 1.5,
              color: 'rgba(255, 255, 255, 0.86)',
              borderColor: 'rgba(255, 255, 255, 0.24)',
              textTransform: 'none',
              fontWeight: 700,
              justifyContent: 'flex-start',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.45)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
              },
            }}
          />
        </Box>
      )}

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List>
          {navItems.map((item) => renderNavItem(item))}
        </List>
      </Box>

      <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <List sx={{ py: 1 }}>
          {renderNavItem(homeNavItem)}
        </List>
      </Box>

      {/* Logout Button - Always visible at bottom */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.6)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 1 : 2,
          }}
        >
          {!collapsed && 'Logout'}
        </Button>
      </Box>
    </Box>
  );
}
