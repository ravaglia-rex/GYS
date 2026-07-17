import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Divider,
  Badge,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  CardGiftcard as RewardsIcon,
  Logout as LogoutIcon,
  Settings as PipelineIcon,
  AdminPanelSettings as AdminsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { useSelector } from 'react-redux';
import { RootState } from '../state_data/reducer';
import { institutionalPalette as ip } from '../theme/institutionalPalette';
import { listPlatformAdminNotifications } from '../db/platformAdminCollection';

const HEADER_NAVY = '#002147';
const DRAWER_WIDTH = 260;
const APP_BAR_HEIGHT = 64;
const PAGE_BG = '#f1f5f9';
const SIDEBAR_ICON_SIZE = 22;

function OverviewColoredIcon() {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '4px',
        height: SIDEBAR_ICON_SIZE,
        width: SIDEBAR_ICON_SIZE,
      }}
    >
      <Box sx={{ width: 5, height: 11, bgcolor: '#22c55e', borderRadius: 0.5 }} />
      <Box sx={{ width: 5, height: 18, bgcolor: '#3b82f6', borderRadius: 0.5 }} />
      <Box sx={{ width: 5, height: 8, bgcolor: '#ef4444', borderRadius: 0.5 }} />
    </Box>
  );
}

const BASE_NAV_ITEMS = [
  { title: 'Overview', path: '/platform-admin/dashboard', icon: <OverviewColoredIcon /> },
  { title: 'Schools', path: '/platform-admin/schools', icon: <SchoolIcon sx={{ color: '#059669', fontSize: SIDEBAR_ICON_SIZE }} /> },
  { title: 'Students', path: '/platform-admin/students', icon: <PeopleIcon sx={{ color: '#64748b', fontSize: SIDEBAR_ICON_SIZE }} /> },
  { title: 'Rewards', path: '/platform-admin/rewards', icon: <RewardsIcon sx={{ color: '#b45309', fontSize: SIDEBAR_ICON_SIZE }} /> },
];

const PIPELINE_NAV_ITEM = {
  title: 'Pipelines',
  path: '/platform-admin/pipelines',
  icon: <PipelineIcon sx={{ color: '#7c3aed', fontSize: SIDEBAR_ICON_SIZE }} />,
};

const ADMINS_NAV_ITEM = {
  title: 'Admin Mgmt',
  path: '/platform-admin/admins',
  icon: <AdminsIcon sx={{ color: '#0f766e', fontSize: SIDEBAR_ICON_SIZE }} />,
};

interface PlatformAdminLayoutProps {
  children: React.ReactNode;
}

const PlatformAdminLayout: React.FC<PlatformAdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const userEmail = useSelector((state: RootState) => state.auth.user?.email) ?? auth.currentUser?.email ?? '';
  const platformAdminRole = useSelector((state: RootState) => state.auth.platformAdminRole);

  const navItems = useMemo(
    () =>
      platformAdminRole === 'super'
        ? [...BASE_NAV_ITEMS, PIPELINE_NAV_ITEM, ADMINS_NAV_ITEM]
        : BASE_NAV_ITEMS,
    [platformAdminRole]
  );

  useEffect(() => {
    let cancelled = false;
    const loadUnread = async () => {
      try {
        const data = await listPlatformAdminNotifications(1);
        if (!cancelled) setUnreadNotifications(data.unread_count);
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    };
    loadUnread();
    const interval = window.setInterval(loadUnread, 60_000);
    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ unread_count?: number }>).detail;
      if (typeof detail?.unread_count === 'number') {
        setUnreadNotifications(detail.unread_count);
      } else {
        loadUnread();
      }
    };
    window.addEventListener('platform-admin-notifications-updated', onUpdated);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('platform-admin-notifications-updated', onUpdated);
    };
  }, [location.pathname]);

  const avatarInitials = useMemo(() => {
    const raw = (userEmail || '?').trim();
    const local = raw.split('@')[0] || raw;
    const letters = local.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    return raw.slice(0, 2).toUpperCase();
  }, [userEmail]);

  const handleSignOut = async () => {
    authTokenHandler.clearToken();
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
    navigate('/login');
  };

  const isNavActive = (path: string) =>
    path === '/platform-admin/dashboard'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const renderSidebarNav = () =>
    navItems.map((item) => {
      const active = isNavActive(item.path);
      return (
        <Box
          key={item.path}
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
            bgcolor: active ? ip.sidebarActiveBg : 'transparent',
            borderLeft: active ? `4px solid ${ip.sidebarActiveBorder}` : '4px solid transparent',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: active ? 'rgba(37, 99, 235, 0.1)' : 'rgba(15, 23, 42, 0.04)' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, flexShrink: 0 }}>
            {item.path === '/platform-admin/dashboard' && unreadNotifications > 0 ? (
              <Badge badgeContent={unreadNotifications} color="error" max={99}>
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
          </Box>
          <Typography sx={{ fontWeight: active ? 600 : 500, fontSize: '0.9rem', color: active ? ip.sidebarActiveText : '#334155' }}>
            {item.title}
          </Typography>
        </Box>
      );
    });

  const sidebarBody = (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', py: 1, overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${ip.sidebarBorder}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#e2e8f0', color: '#0f172a', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0 }}>
            {avatarInitials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: ip.heading, fontWeight: 700, fontSize: '0.88rem' }}>Platform Admin</Typography>
            <Typography sx={{ color: ip.subtext, fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail || 'Admin'}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', py: 2 }}>{renderSidebarNav()}</Box>
      <Divider sx={{ borderColor: ip.sidebarBorder, flexShrink: 0 }} />
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleSignOut}
          startIcon={<LogoutIcon />}
          sx={{
            py: 1,
            justifyContent: 'flex-start',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: ip.heading,
            borderColor: ip.sidebarBorder,
            '&:hover': {
              borderColor: '#ef4444',
              bgcolor: 'rgba(239, 68, 68, 0.06)',
              color: '#ef4444',
            },
          }}
        >
          Logout
        </Button>
      </Box>
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
    <Box sx={{ minHeight: '100vh', bgcolor: PAGE_BG, overflowX: 'hidden' }}>
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
              Platform Admin
            </Typography>
          </Box>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#e2e8f0', color: '#0f172a', fontSize: '0.8rem', fontWeight: 700 }}>
            {avatarInitials}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexDirection: 'column', pt: `${APP_BAR_HEIGHT}px`, minHeight: `calc(100vh - ${APP_BAR_HEIGHT}px)` }}>
        <Box sx={{ display: 'flex', flex: 1, width: '100%', alignItems: 'stretch', minHeight: 0, bgcolor: PAGE_BG }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, ...drawerPaperSx },
            }}
          >
            {sidebarBody}
          </Drawer>

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
            {sidebarBody}
          </Box>

          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              bgcolor: PAGE_BG,
              overflow: 'auto',
              marginLeft: { xs: 0, md: `${DRAWER_WIDTH}px` },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PlatformAdminLayout;
