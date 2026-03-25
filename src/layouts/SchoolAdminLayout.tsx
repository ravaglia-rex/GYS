import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  Avatar,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Description as ReportsIcon,
  Analytics as AnalyticsIcon,
  Notifications as AlertsIcon,
  Settings as SettingsIcon,
  CreditCard as SubscriptionIcon,
  Logout as LogoutIcon,
  Mail as InvitationsIcon,
} from '@mui/icons-material';
import { auth } from '../firebase/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../state_data/reducer';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { institutionalPalette as ip } from '../theme/institutionalPalette';
import { getSchoolDashboard } from '../db/schoolAdminCollection';
import { useSchoolAdminBelowNav } from './schoolAdminBelowNavContext';

const HEADER_NAVY = '#002147';
const NAV_ACTIVE_GOLD = '#FACC15';
const DRAWER_WIDTH = 260;
const APP_BAR_HEIGHT = 64;
const PAGE_BG = '#f1f5f9';

/** Mockup: Overview = colored bars */
function OverviewColoredIcon() {
  return (
    <Box aria-hidden sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', height: 22, width: 22 }}>
      <Box sx={{ width: 5, height: 11, bgcolor: '#22c55e', borderRadius: 0.5 }} />
      <Box sx={{ width: 5, height: 18, bgcolor: '#3b82f6', borderRadius: 0.5 }} />
      <Box sx={{ width: 5, height: 8, bgcolor: '#ef4444', borderRadius: 0.5 }} />
    </Box>
  );
}

interface SchoolAdminLayoutProps {
  children: React.ReactNode;
}

interface TopNavItem {
  title: string;
  path: string;
  badgeKey?: 'pendingStudents';
}

const TOP_NAV: TopNavItem[] = [
  { title: 'Dashboard', path: '/school-admin/dashboard' },
  { title: 'Students', path: '/school-admin/students', badgeKey: 'pendingStudents' },
  { title: 'Reports', path: '/school-admin/reports' },
  { title: 'Invitations', path: '/school-admin/invitations' },
  { title: 'Settings', path: '/school-admin/settings' },
];

interface SidebarNavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  badgeKey?: 'pendingStudents';
}

/** Left sidebar — mockup order & labels (Overview vs top-bar “Dashboard”). */
const SIDEBAR_NAV: SidebarNavItem[] = [
  { title: 'Overview', path: '/school-admin/dashboard', icon: <OverviewColoredIcon /> },
  { title: 'Students', path: '/school-admin/students', icon: <PeopleIcon sx={{ color: '#64748b', fontSize: '1.3rem' }} />, badgeKey: 'pendingStudents' },
  { title: 'Reports', path: '/school-admin/reports', icon: <ReportsIcon sx={{ color: '#b45309', fontSize: '1.3rem' }} /> },
  { title: 'Analytics', path: '/school-admin/analytics', icon: <AnalyticsIcon sx={{ color: '#dc2626', fontSize: '1.3rem' }} /> },
  { title: 'Invitations', path: '/school-admin/invitations', icon: <InvitationsIcon sx={{ color: '#94a3b8', fontSize: '1.3rem' }} /> },
  { title: 'Alerts', path: '/school-admin/alerts', icon: <AlertsIcon sx={{ color: '#eab308', fontSize: '1.3rem' }} /> },
  { title: 'Settings', path: '/school-admin/settings', icon: <SettingsIcon sx={{ color: '#64748b', fontSize: '1.3rem' }} /> },
  { title: 'Subscription', path: '/school-admin/subscription', icon: <SubscriptionIcon sx={{ color: '#059669', fontSize: '1.3rem' }} /> },
];

export default function SchoolAdminLayout({ children }: SchoolAdminLayoutProps) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const { belowNav } = useSchoolAdminBelowNav();

  useEffect(() => {
    const sid = schoolAdmin?.schoolId ? String(schoolAdmin.schoolId).trim() : '';
    if (!sid) return;
    let cancelled = false;
    getSchoolDashboard(sid)
      .then((d) => {
        if (!cancelled) setPendingApprovalCount(d.live?.pending_approval ?? 0);
      })
      .catch(() => {
        if (!cancelled) setPendingApprovalCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolAdmin?.schoolId]);

  const isInstitutionDashboard = location.pathname === '/school-admin/dashboard';

  const displayEmail = currentUser?.email ?? schoolAdmin?.email ?? '';
  const avatarInitials = React.useMemo(() => {
    const raw = (displayEmail || '?').trim();
    if (!raw) return '?';
    const local = raw.split('@')[0] || raw;
    const letters = local.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    return raw.slice(0, 2).toUpperCase();
  }, [displayEmail]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      authTokenHandler.clearToken();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const isNavActive = (path: string) =>
    path === '/school-admin/dashboard'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const getBadge = (item: { badgeKey?: string }): number =>
    item.badgeKey === 'pendingStudents' ? pendingApprovalCount : 0;

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const renderSidebarNav = () =>
    SIDEBAR_NAV.map((item) => {
      const active = isNavActive(item.path);
      const badge = getBadge(item);
      const row = (
        <Box
          onClick={() => go(item.path)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.25,
            mx: 1,
            borderRadius: 1.5,
            cursor: 'pointer',
            bgcolor: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
            borderLeft: active ? '4px solid #2563eb' : '4px solid transparent',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: active ? 'rgba(37, 99, 235, 0.1)' : 'rgba(15, 23, 42, 0.04)' },
          }}
        >
          <Badge
            badgeContent={badge > 99 ? '99+' : badge}
            invisible={badge === 0 || item.badgeKey !== 'pendingStudents'}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                minWidth: 18,
                height: 18,
                bgcolor: '#ef4444',
                color: '#fff',
                fontWeight: 700,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28 }}>{item.icon}</Box>
          </Badge>
          <Typography
            sx={{
              fontWeight: active ? 600 : 500,
              fontSize: '0.9rem',
              color: active ? '#1d4ed8' : '#334155',
            }}
          >
            {item.title}
          </Typography>
        </Box>
      );
      return <Box key={item.path}>{row}</Box>;
    });

  const SidebarBody = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 1 }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>{renderSidebarNav()}</Box>
      <Divider sx={{ borderColor: ip.sidebarBorder, my: 1 }} />
      <Box sx={{ px: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#e2e8f0', color: '#0f172a', fontSize: '0.85rem', fontWeight: 700 }}>
          {avatarInitials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: ip.heading, fontWeight: 500, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayEmail || 'Admin'}
          </Typography>
          <Typography sx={{ color: ip.subtext, fontSize: '0.68rem' }}>School Admin</Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton onClick={handleLogout} size="small" sx={{ color: ip.subtext, '&:hover': { color: '#ef4444' } }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const drawerPaperSx = {
    bgcolor: '#ffffff',
    borderRight: `1px solid ${ip.sidebarBorder}`,
    boxSizing: 'border-box' as const,
    top: APP_BAR_HEIGHT,
    height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: PAGE_BG }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: HEADER_NAVY,
          backgroundImage: 'none',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            justifyContent: 'space-between',
            minHeight: APP_BAR_HEIGHT,
            py: 0,
            px: { xs: 1.5, sm: 2, md: 3 },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
            <IconButton
              color="inherit"
              onClick={() => setMobileOpen((o) => !o)}
              edge="start"
              sx={{ display: { md: 'none' }, color: 'rgba(255,255,255,0.92)' }}
              aria-label="open menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.15rem' }, letterSpacing: 0.5 }}>
              GYS
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.88)',
                fontWeight: 400,
                fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                display: { xs: 'none', sm: 'block' },
                whiteSpace: 'nowrap',
              }}
            >
              Institution Portal
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: { md: 2, lg: 3 },
              minWidth: 0,
            }}
          >
            {TOP_NAV.map((item) => {
              const active = isNavActive(item.path);
              const badge = getBadge(item);
              const linkInner = (
                <Typography
                  sx={{
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? NAV_ACTIVE_GOLD : 'rgba(255,255,255,0.92)',
                    letterSpacing: 0.2,
                    whiteSpace: 'nowrap',
                    borderBottom: active ? `2px solid ${NAV_ACTIVE_GOLD}` : '2px solid transparent',
                    pb: 0.25,
                    transition: 'color 0.15s',
                    '&:hover': { color: active ? NAV_ACTIVE_GOLD : '#fff' },
                  }}
                >
                  {item.title}
                </Typography>
              );
              const clickable = (
                <Box component="span" onClick={() => navigate(item.path)} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                  {linkInner}
                </Box>
              );
              return item.badgeKey === 'pendingStudents' && badge > 0 ? (
                <Badge
                  key={item.path}
                  badgeContent={badge > 99 ? '99+' : badge}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      minWidth: 16,
                      height: 16,
                      bgcolor: '#ef4444',
                      color: '#fff',
                    },
                  }}
                >
                  {clickable}
                </Badge>
              ) : (
                <Box key={item.path} component="span">
                  {clickable}
                </Box>
              );
            })}
          </Box>

          <Tooltip title={displayEmail || 'Account'}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#e2e8f0',
                color: '#0f172a',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'default',
              }}
            >
              {avatarInitials}
            </Avatar>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          pt: `${APP_BAR_HEIGHT}px`,
          minHeight: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            width: '100%',
            alignItems: 'stretch',
            minHeight: 0,
            bgcolor: PAGE_BG,
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                ...drawerPaperSx,
              },
            }}
          >
            {SidebarBody}
          </Drawer>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              width: DRAWER_WIDTH,
              flexShrink: 0,
              flexDirection: 'column',
              bgcolor: '#ffffff',
              borderRight: `1px solid ${ip.sidebarBorder}`,
              overflowY: 'auto',
              alignSelf: 'stretch',
            }}
          >
            {SidebarBody}
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: PAGE_BG,
              overflow: 'auto',
            }}
          >
            {belowNav}
            <Box
              component="main"
              sx={{
                flex: 1,
                minWidth: 0,
                bgcolor: PAGE_BG,
                p: isInstitutionDashboard ? { xs: 0, md: 0 } : { xs: 2, md: 3 },
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
