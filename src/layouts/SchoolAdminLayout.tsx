import React, { useState, useEffect } from 'react';
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
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as ReportsIcon,
  Analytics as AnalyticsIcon,
  Mail as InvitationsIcon,
  Notifications as AlertsIcon,
  Settings as SettingsIcon,
  CreditCard as SubscriptionIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { auth } from '../firebase/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../state_data/reducer';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_MINI = 76;

interface SchoolAdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  iconColor: string;
  badgeKey?: 'pendingApprovals' | 'alerts';
}

const navItems: NavItem[] = [
  { title: 'Overview',     path: '/school-admin/dashboard',    icon: <DashboardIcon />,    iconColor: '#3b82f6' },
  { title: 'Students',     path: '/school-admin/students',     icon: <PeopleIcon />,       iconColor: '#10b981', badgeKey: 'pendingApprovals' },
  { title: 'Reports',      path: '/school-admin/reports',      icon: <ReportsIcon />,      iconColor: '#8b5cf6' },
  { title: 'Analytics',    path: '/school-admin/analytics',    icon: <AnalyticsIcon />,    iconColor: '#06b6d4' },
  { title: 'Invitations',  path: '/school-admin/invitations',  icon: <InvitationsIcon />,  iconColor: '#f59e0b' },
  { title: 'Alerts',       path: '/school-admin/alerts',       icon: <AlertsIcon />,       iconColor: '#ef4444', badgeKey: 'alerts' },
  { title: 'Settings',     path: '/school-admin/settings',     icon: <SettingsIcon />,     iconColor: '#94a3b8' },
  { title: 'Subscription', path: '/school-admin/subscription', icon: <SubscriptionIcon />, iconColor: '#a78bfa' },
];

export default function SchoolAdminLayout({ children }: SchoolAdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);

  const displayEmail = currentUser?.email ?? schoolAdmin?.email ?? '';
  const avatarInitial = displayEmail ? displayEmail.charAt(0).toUpperCase() : '?';
  const drawerWidth = collapsed && !isMobile ? DRAWER_WIDTH_MINI : DRAWER_WIDTH;

  // Fetch pending approvals count for badge
  useEffect(() => {
    const fetchPendingCount = async () => {
      const schoolId = String(schoolAdmin?.schoolId ?? '').trim();
      if (!schoolId) return;
      try {
        const [snap1, snap2] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('school_id', '==', schoolId), where('approval_status', '==', 'pending'))),
          getDocs(query(collection(db, 'students'), where('schoolId', '==', schoolId), where('approval_status', '==', 'pending'))),
        ]);
        const count = snap1.size + snap2.size;
        setPendingApprovals(count);
        setAlertCount(count > 0 ? 1 : 0);
      } catch (_) {}
    };
    fetchPendingCount();
  }, [schoolAdmin]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      authTokenHandler.clearToken();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const getBadge = (item: NavItem): number => {
    if (item.badgeKey === 'pendingApprovals') return pendingApprovals;
    if (item.badgeKey === 'alerts') return alertCount;
    return 0;
  };

  const DrawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo area */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
        px: collapsed && !isMobile ? 1 : 2, py: 2, minHeight: 64,
      }}>
        {(!collapsed || isMobile) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 1,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem' }}>GYS</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1 }}>
                Institution Portal
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.3 }}>
                School Admin
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && !isMobile && (
          <Box sx={{
            width: 32, height: 32, borderRadius: 1,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>GYS</Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton
            onClick={() => setCollapsed(c => !c)}
            size="small"
            sx={{ color: '#64748b', '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)' }, ml: collapsed ? 0 : 0 }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      {/* Nav items */}
      <Box sx={{ flex: 1, py: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(item => {
          const active = isActive(item.path);
          const badge = getBadge(item);
          return (
            <Tooltip
              key={item.path}
              title={collapsed && !isMobile ? item.title : ''}
              placement="right"
            >
              <Box
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: collapsed && !isMobile ? 0 : 2.5,
                  py: 1.4,
                  mx: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  bgcolor: active ? `${item.iconColor}18` : 'transparent',
                  borderLeft: active ? `3px solid ${item.iconColor}` : '3px solid transparent',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: active ? `${item.iconColor}22` : 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                <Badge
                  badgeContent={badge}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem', minWidth: 18, height: 18,
                      bgcolor: '#ef4444', color: '#fff',
                    }
                  }}
                >
                  <Box sx={{ color: item.iconColor, display: 'flex' }}>{item.icon}</Box>
                </Badge>
                {(!collapsed || isMobile) && (
                  <Typography sx={{ fontWeight: active ? 600 : 400, fontSize: '0.92rem', color: active ? '#ffffff' : '#94a3b8', letterSpacing: 0.1, '&:hover': { color: '#e2e8f0' } }}>
                    {item.title}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      {/* Bottom: user info + logout */}
      <Box sx={{ p: collapsed && !isMobile ? 1 : 2 }}>
        {(!collapsed || isMobile) ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}>
              {avatarInitial}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayEmail || 'Admin'}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>School Admin</Typography>
            </Box>
            <Tooltip title="Sign out">
              <IconButton onClick={handleLogout} size="small" sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}>{avatarInitial}</Avatar>
            <Tooltip title="Sign out">
              <IconButton onClick={handleLogout} size="small" sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a0f1e' }}>
      {/* Mobile App Bar */}
      <AppBar
        position="fixed"
        sx={{
          display: { lg: 'none' },
          backgroundColor: 'rgba(10,15,30,0.97)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton color="inherit" onClick={() => setMobileOpen(o => !o)} edge="start">
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: 0.8,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>GYS</Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700 }}>
              Institution Portal
            </Typography>
          </Box>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6', fontSize: '0.8rem' }}>{avatarInitial}</Avatar>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: '#0d1526',
            borderRight: '1px solid #1e293b',
          },
        }}
      >
        {DrawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          transition: 'width 0.2s',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0d1526',
            borderRight: '1px solid #1e293b',
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
      >
        {DrawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: '#0a0f1e',
          p: { xs: 2, md: 3 },
          pt: { xs: '72px', lg: 3 },
          maxWidth: '100%',
          overflowX: 'auto',
          transition: 'all 0.2s',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
