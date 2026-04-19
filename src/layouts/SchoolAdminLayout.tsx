import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  useTheme,
  Avatar,
  Divider,
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
  HomeOutlined as HomeOutlinedIcon,
} from '@mui/icons-material';
import { auth } from '../firebase/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../state_data/reducer';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { institutionalPalette as ip } from '../theme/institutionalPalette';
import { useSchoolAdminBelowNav } from './schoolAdminBelowNavContext';

const HEADER_NAVY = '#002147';
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

/** When set, layout matches signed-in chrome but uses preview paths and Exit preview instead of sign-out. */
export interface SchoolAdminInteractivePreview {
  pathPrefix: string;
  pocEmail: string;
  /** Where Exit preview navigates (e.g. `/for-schools/preview` hub). Defaults to `/` if omitted. */
  exitPreviewTo?: string;
}

interface SchoolAdminLayoutProps {
  children: React.ReactNode;
  interactivePreview?: SchoolAdminInteractivePreview;
}

interface SidebarNavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
}

/** Left sidebar - primary navigation (no duplicate links in the app bar). */
const SIDEBAR_NAV: SidebarNavItem[] = [
  { title: 'Overview', path: '/school-admin/dashboard', icon: <OverviewColoredIcon /> },
  { title: 'Students', path: '/school-admin/students', icon: <PeopleIcon sx={{ color: '#64748b', fontSize: '1.3rem' }} /> },
  { title: 'Reports', path: '/school-admin/reports', icon: <ReportsIcon sx={{ color: '#b45309', fontSize: '1.3rem' }} /> },
  { title: 'Analytics', path: '/school-admin/analytics', icon: <AnalyticsIcon sx={{ color: '#dc2626', fontSize: '1.3rem' }} /> },
  { title: 'Alerts', path: '/school-admin/alerts', icon: <AlertsIcon sx={{ color: '#eab308', fontSize: '1.3rem' }} /> },
  { title: 'Settings', path: '/school-admin/settings', icon: <SettingsIcon sx={{ color: '#64748b', fontSize: '1.3rem' }} /> },
  { title: 'Subscription', path: '/school-admin/subscription', icon: <SubscriptionIcon sx={{ color: '#059669', fontSize: '1.3rem' }} /> },
];

export default function SchoolAdminLayout({ children, interactivePreview }: SchoolAdminLayoutProps) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const { belowNav } = useSchoolAdminBelowNav();

  const pathPrefix = interactivePreview?.pathPrefix ?? '/school-admin';
  const sidebarNavItems = React.useMemo(
    () => SIDEBAR_NAV.map((item) => ({ ...item, path: item.path.replace('/school-admin', pathPrefix) })),
    [pathPrefix]
  );

  const isInstitutionDashboard =
    location.pathname === '/school-admin/dashboard' || location.pathname === `${pathPrefix}/dashboard`;

  const displayEmail = interactivePreview?.pocEmail ?? currentUser?.email ?? schoolAdmin?.email ?? '';
  const avatarInitials = React.useMemo(() => {
    const raw = (displayEmail || '?').trim();
    if (!raw) return '?';
    const local = raw.split('@')[0] || raw;
    const letters = local.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    return raw.slice(0, 2).toUpperCase();
  }, [displayEmail]);

  const handleLogout = async () => {
    if (interactivePreview) {
      navigate(interactivePreview.exitPreviewTo ?? '/');
      return;
    }
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

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const renderSidebarNav = () =>
    sidebarNavItems.map((item) => {
      const active = isNavActive(item.path);
      const settingsLocked = Boolean(interactivePreview && item.title === 'Settings');
      const row = (
        <Box
          onClick={() => {
            if (!settingsLocked) go(item.path);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.25,
            mx: 1,
            borderRadius: 1.5,
            cursor: settingsLocked ? 'default' : 'pointer',
            opacity: settingsLocked ? 0.48 : 1,
            bgcolor: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
            borderLeft: active ? '4px solid #2563eb' : '4px solid transparent',
            transition: 'background-color 0.15s, opacity 0.15s',
            ...(!settingsLocked
              ? { '&:hover': { bgcolor: active ? 'rgba(37, 99, 235, 0.1)' : 'rgba(15, 23, 42, 0.04)' } }
              : {}),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28 }}>{item.icon}</Box>
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
      return (
        <Box key={item.path}>
          {settingsLocked ? (
            <Tooltip title="Settings are available in your live school admin workspace after you sign in." placement="right">
              <Box component="span" sx={{ display: 'block' }}>
                {row}
              </Box>
            </Tooltip>
          ) : (
            row
          )}
        </Box>
      );
    });

  const SidebarBody = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        height: '100%',
        py: 1,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{renderSidebarNav()}</Box>
      <Divider sx={{ borderColor: ip.sidebarBorder, my: 1, flexShrink: 0 }} />
      {interactivePreview ? (
        <Box sx={{ px: 2, pb: 1.5, flexShrink: 0 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleLogout}
            startIcon={<HomeOutlinedIcon />}
            sx={{
              py: 1,
              justifyContent: 'flex-start',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: ip.heading,
              borderColor: ip.sidebarBorder,
              '&:hover': {
                borderColor: '#2563eb',
                bgcolor: 'rgba(37, 99, 235, 0.06)',
                color: '#1d4ed8',
              },
            }}
          >
            Exit preview - back to hub
          </Button>
        </Box>
      ) : (
        <Box sx={{ px: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
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
      )}
    </Box>
  );

  const drawerPaperSx = {
    bgcolor: '#ffffff',
    borderRight: `1px solid ${ip.sidebarBorder}`,
    boxSizing: 'border-box' as const,
    top: APP_BAR_HEIGHT,
    height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flex: 1, minWidth: 0 }}>
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

          {/* Desktop: fixed under app bar so it does not scroll with main content */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              width: DRAWER_WIDTH,
              flexShrink: 0,
              flexDirection: 'column',
              bgcolor: '#ffffff',
              borderRight: `1px solid ${ip.sidebarBorder}`,
              overflow: 'hidden',
              position: 'fixed',
              left: 0,
              top: APP_BAR_HEIGHT,
              height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
              zIndex: theme.zIndex.drawer,
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
              marginLeft: { xs: 0, md: `${DRAWER_WIDTH}px` },
            }}
          >
            {interactivePreview && (
              <Box
                sx={{
                  width: '100%',
                  flexShrink: 0,
                  px: { xs: 2, sm: 3, md: 4 },
                  py: 1.25,
                  boxSizing: 'border-box',
                  bgcolor: 'rgba(251, 191, 36, 0.14)',
                  borderBottom: '1px solid rgba(217, 119, 6, 0.35)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: '#92400e', fontWeight: 600, textAlign: 'center', maxWidth: 1320, mx: 'auto' }}
                >
                  Interactive preview only - Sign in after registration for your live workspace.
                </Typography>
              </Box>
            )}
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
