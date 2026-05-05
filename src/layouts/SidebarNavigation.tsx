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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOutStudentAndClearSession } from '../services/studentActiveSession';

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

const navItems: NavItem[] = [
  {
    title: 'Home',
    path: '/',
    icon: <HomeIcon sx={{ color: '#38bdf8' }} />,
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon sx={{ color: '#8b5cf6' }} />,
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
    icon: <AssessmentIcon sx={{ color: '#3b82f6' }} />,
    children: [
      { title: 'Available', path: '/assessments/available', icon: <SchoolIcon sx={{ color: '#10b981' }} /> },
      { title: 'Completed & Results', path: '/assessments/completed', icon: <BarChartIcon sx={{ color: '#06b6d4' }} /> },
    ],
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <AssignmentIcon sx={{ color: '#f59e0b' }} />,
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
      await signOutStudentAndClearSession();
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

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isItemActive = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenus[item.title];

    return (
      <Box key={item.title}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip 
            title={collapsed ? item.title : ''} 
            placement="right"
            disableHoverListener={!collapsed}
          >
            <ListItemButton
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
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
        </Box>
      )}

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List>
          {navItems.map((item) => renderNavItem(item))}
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
