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
  Tooltip,
  List,
  ListSubheader,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Description as ReportsIcon,
  Quiz as QuizIcon,
  Close as CloseIcon,
  MailOutline as InvitationsIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 260;

const iconSx = { fontSize: '1.35rem' };

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  iconColor: string;
}

const primaryNav: NavItem[] = [
  { title: 'Preview home', path: '/for-schools/preview', icon: <HomeIcon sx={iconSx} />, iconColor: '#94a3b8' },
  { title: 'Overview', path: '/for-schools/preview/dashboard', icon: <DashboardIcon sx={iconSx} />, iconColor: '#3b82f6' },
  { title: 'Reports', path: '/for-schools/preview/reports', icon: <ReportsIcon sx={iconSx} />, iconColor: '#8b5cf6' },
  { title: 'Sample assessment', path: '/for-schools/preview/assessment', icon: <QuizIcon sx={iconSx} />, iconColor: '#10b981' },
];

/** Shown as preview-only; full product requires sign-in */
const sampleOnlyNav: { title: string; icon: React.ReactElement; iconColor: string; hint: string }[] = [
  { title: 'Roster & registration', icon: <InvitationsIcon sx={iconSx} />, iconColor: '#f59e0b', hint: 'Student lists and registration are managed in your live admin workspace.' },
  { title: 'Analytics', icon: <AnalyticsIcon sx={iconSx} />, iconColor: '#06b6d4', hint: 'Deep-dive analytics unlock with your live institution account.' },
];

export default function SchoolPreviewLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery((t) => t.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/for-schools/preview') {
      return location.pathname === '/for-schools/preview' || location.pathname === '/for-schools/preview/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavList = (
    <List component="nav" disablePadding sx={{ px: 0.5, py: 1 }}>
      <ListSubheader
        component="div"
        disableSticky
        sx={{
          bgcolor: 'transparent',
          px: 2,
          py: 1,
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        Workspace
      </ListSubheader>
      {primaryNav.map(item => {
        const active = isActive(item.path);
        return (
          <ListItemButton
            key={item.path}
            selected={active}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              py: 1.1,
              pl: 2,
              borderLeft: active ? `3px solid ${item.iconColor}` : '3px solid transparent',
              bgcolor: active ? `${item.iconColor}14` : 'transparent',
              '&:hover': { bgcolor: active ? `${item.iconColor}20` : 'rgba(255,255,255,0.05)' },
              '&.Mui-selected': { bgcolor: `${item.iconColor}18` },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: item.iconColor }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.title}
              slotProps={{
                primary: {
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.9rem',
                  color: active ? '#ffffff' : '#94a3b8',
                },
              }}
            />
          </ListItemButton>
        );
      })}

      <Divider sx={{ borderColor: '#1e293b', my: 1.5, mx: 1 }} />

      <ListSubheader
        component="div"
        disableSticky
        sx={{
          bgcolor: 'transparent',
          px: 2,
          py: 0.5,
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        More (after sign-in)
      </ListSubheader>
      {sampleOnlyNav.map(item => (
        <ListItemButton
          key={item.title}
          title={item.hint}
          onClick={() => {
            setHint(item.hint);
            if (isMobile) setMobileOpen(false);
          }}
          sx={{
            borderRadius: 1.5,
            mb: 0.5,
            py: 1.1,
            pl: 2,
            opacity: 0.85,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: item.iconColor }}>{item.icon}</ListItemIcon>
          <ListItemText
            primary={item.title}
            secondary="Preview"
            slotProps={{
              primary: { fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 },
              secondary: { fontSize: '0.65rem', color: '#64748b' },
            }}
          />
        </ListItemButton>
      ))}
    </List>
  );

  const DrawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, minHeight: 64 }}>
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
            <Typography sx={{ color: '#fbbf24', fontSize: '0.72rem', lineHeight: 1.3 }}>
              Interactive preview
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      <Box sx={{ flex: 1, overflowY: 'auto' }}>{NavList}</Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      <Box sx={{ p: 2 }}>
        <Tooltip title="Leave the interactive preview and return to For Schools">
          <Box
            onClick={() => navigate('/for-schools')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1.2,
              px: 1.5,
              borderRadius: 1.5,
              cursor: 'pointer',
              color: '#94a3b8',
              border: '1px solid #334155',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: '#e2e8f0' },
            }}
          >
            <CloseIcon fontSize="small" />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Exit preview</Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a0f1e' }}>
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
          <IconButton color="inherit" onClick={() => setMobileOpen(o => !o)} edge="start" aria-label="open menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700 }}>
            Institution preview
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/for-schools')} edge="end" size="small" aria-label="close preview">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

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

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#0d1526',
            borderRight: '1px solid #1e293b',
          },
        }}
      >
        {DrawerContent}
      </Drawer>

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
        }}
      >
        <Box
          sx={{
            mb: 2,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            bgcolor: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.35)',
            maxWidth: 1200,
            mx: 'auto',
          }}
        >
          <Typography variant="body2" sx={{ color: '#fcd34d', fontWeight: 600, textAlign: 'center' }}>
            Interactive sample — simulated data only. Sign in after registration to use your real school workspace.
          </Typography>
        </Box>
        <Outlet />
      </Box>

      {hint && (
        <Box
          role="status"
          onClick={() => setHint(null)}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 420,
            zIndex: theme.zIndex.snackbar,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            boxShadow: 6,
            cursor: 'pointer',
          }}
        >
          <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
            {hint}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
            Tap to dismiss
          </Typography>
        </Box>
      )}
    </Box>
  );
}
