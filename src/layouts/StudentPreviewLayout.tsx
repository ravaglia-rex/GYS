import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Tooltip,
  List,
  ListSubheader,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Home as HomeIcon,
  ExpandLess,
  ExpandMore,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { rememberStudentPreviewExitTo, consumeStudentPreviewExitTo } from '../utils/studentPreviewExit';

const DRAWER_WIDTH = 280;

type StudentPreviewEntryState = { studentPreviewExitTo?: string };

const iconSx = { fontSize: '1.35rem' };

/** Same labels and structure as `SidebarNavigation` (signed-in student). */
export default function StudentPreviewLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery((t) => t.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assessmentsOpen, setAssessmentsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const exitPreview = useCallback(() => {
    navigate(consumeStudentPreviewExitTo());
  }, [navigate]);

  useEffect(() => {
    const v = (location.state as StudentPreviewEntryState | null)?.studentPreviewExitTo;
    if (typeof v === 'string' && v.startsWith('/')) {
      rememberStudentPreviewExitTo(v);
    }
  }, [location.state]);

  useEffect(() => {
    const p = location.pathname;
    if (p.includes('/assessments')) {
      setAssessmentsOpen(true);
    }
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const assessmentsActive =
    isActive('/students/preview/assessments') || location.pathname === '/for-schools/preview/assessment';

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
        Student portal
      </ListSubheader>

      <ListItemButton
        selected={isActive('/students/preview/dashboard')}
        onClick={() => {
          navigate('/students/preview/dashboard');
          if (isMobile) setMobileOpen(false);
        }}
        sx={{
          borderRadius: 1.5,
          mb: 0.5,
          py: 1.1,
          pl: 2,
          borderLeft: isActive('/students/preview/dashboard') ? '3px solid #8b5cf6' : '3px solid transparent',
          bgcolor: isActive('/students/preview/dashboard') ? 'rgba(139,92,246,0.12)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          '&.Mui-selected': { bgcolor: 'rgba(139,92,246,0.15)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: '#8b5cf6' }}>
          <DashboardIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText
          primary="Dashboard"
          slotProps={{ primary: { fontWeight: isActive('/students/preview/dashboard') ? 600 : 500, fontSize: '0.9rem', color: '#e2e8f0' } }}
        />
      </ListItemButton>

      <ListItemButton
        selected={isActive('/students/preview/leaderboard')}
        onClick={() => {
          navigate('/students/preview/leaderboard');
          if (isMobile) setMobileOpen(false);
        }}
        sx={{
          borderRadius: 1.5,
          mb: 0.5,
          py: 1.1,
          pl: 2,
          borderLeft: isActive('/students/preview/leaderboard') ? '3px solid #f59e0b' : '3px solid transparent',
          bgcolor: isActive('/students/preview/leaderboard') ? 'rgba(245,158,11,0.12)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          '&.Mui-selected': { bgcolor: 'rgba(245,158,11,0.15)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: '#f59e0b' }}>
          <EmojiEventsIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText
          primary="Leaderboard"
          slotProps={{
            primary: {
              fontWeight: isActive('/students/preview/leaderboard') ? 600 : 500,
              fontSize: '0.9rem',
              color: '#e2e8f0',
            },
          }}
        />
      </ListItemButton>

      <ListItemButton
        onClick={() => setAssessmentsOpen(o => !o)}
        sx={{
          borderRadius: 1.5,
          mb: 0.25,
          py: 1.1,
          pl: 2,
          borderLeft: assessmentsActive ? '3px solid #3b82f6' : '3px solid transparent',
          bgcolor: assessmentsActive ? 'rgba(59,130,246,0.1)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: '#3b82f6' }}>
          <AssessmentIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText primary="Assessments" slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' } }} />
        {assessmentsOpen ? <ExpandLess sx={{ color: '#94a3b8' }} /> : <ExpandMore sx={{ color: '#94a3b8' }} />}
      </ListItemButton>
      <Collapse in={assessmentsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton
            disabled
            sx={{
              pl: 4,
              py: 0.9,
              borderRadius: 1.5,
              mb: 0.25,
              cursor: 'default',
              '&.Mui-disabled': { opacity: 0.72 },
            }}
            selected={location.pathname === '/for-schools/preview/assessment'}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#10b981' }}>
              <SchoolIcon sx={{ fontSize: '1.1rem' }} />
            </ListItemIcon>
            <ListItemText primary="Available" slotProps={{ primary: { fontSize: '0.85rem', color: '#cbd5e1' } }} />
          </ListItemButton>
          <ListItemButton
            disabled
            sx={{
              pl: 4,
              py: 0.9,
              borderRadius: 1.5,
              mb: 0.5,
              cursor: 'default',
              '&.Mui-disabled': { opacity: 0.72 },
            }}
            selected={isActive('/students/preview/assessments/completed')}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#06b6d4' }}>
              <BarChartIcon sx={{ fontSize: '1.1rem' }} />
            </ListItemIcon>
            <ListItemText primary="Completed & Results" slotProps={{ primary: { fontSize: '0.85rem', color: '#cbd5e1' } }} />
          </ListItemButton>
        </List>
      </Collapse>

      {(
        [
          { title: 'Reports', path: '/students/preview/reports', icon: <AssignmentIcon sx={iconSx} />, color: '#f59e0b' },
          { title: 'Billing & Payments', path: '/students/preview/payments', icon: <PaymentIcon sx={iconSx} />, color: '#22c55e' },
          { title: 'Settings', path: '/students/preview/settings', icon: <SettingsIcon sx={iconSx} />, color: '#94a3b8' },
        ] as const
      ).map(item => {
        const active = isActive(item.path);
        return (
          <ListItemButton
            key={item.path}
            disabled
            selected={active}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              py: 1.1,
              pl: 2,
              cursor: 'default',
              borderLeft: active ? `3px solid ${item.color}` : '3px solid transparent',
              bgcolor: active ? `${item.color}14` : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              '&.Mui-selected': { bgcolor: `${item.color}18` },
              '&.Mui-disabled': { opacity: 0.72 },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: item.color }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.title}
              slotProps={{ primary: { fontWeight: active ? 600 : 500, fontSize: '0.9rem', color: '#e2e8f0' } }}
            />
          </ListItemButton>
        );
      })}

      <Divider sx={{ borderColor: '#1e293b', my: 1.5, mx: 1 }} />

      <ListItemButton
        onClick={() => {
          navigate('/login');
          if (isMobile) setMobileOpen(false);
        }}
        sx={{ borderRadius: 1.5, mb: 0.5, py: 1.1, pl: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: '#fbbf24' }}>
          <LoginIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText primary="Log in" slotProps={{ primary: { fontWeight: 500, fontSize: '0.9rem', color: '#e2e8f0' } }} />
      </ListItemButton>
    </List>
  );

  const DrawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem' }}>GYS</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1 }}>
              Student portal
            </Typography>
            <Typography sx={{ color: '#fbbf24', fontSize: '0.72rem', lineHeight: 1.3 }}>
              Sample dashboard
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      <Box sx={{ flex: 1, overflowY: 'auto' }}>{NavList}</Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      <Box sx={{ p: 2 }}>
        <Tooltip title="Leave preview and return to the previous public page">
          <Box
            onClick={exitPreview}
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'rgba(15, 23, 42, 0.98)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
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
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        {DrawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: '#0f172a',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'rgba(15,23,42,0.97)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', gap: 1, minHeight: { xs: 56, sm: 64 } }}>
            <Button
              color="inherit"
              onClick={() => navigate('/')}
              startIcon={<HomeIcon />}
              sx={{ color: '#e2e8f0', fontWeight: 600, textTransform: 'none' }}
            >
              Home
            </Button>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={exitPreview}
                sx={{ color: '#94a3b8', borderColor: '#475569', textTransform: 'none', fontWeight: 600 }}
              >
                Exit preview
              </Button>
            </Box>
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 0.5 }}>
              <IconButton color="inherit" onClick={() => setMobileOpen(o => !o)} edge="end" aria-label="open menu">
                <MenuIcon />
              </IconButton>
              <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 700, maxWidth: 120 }} noWrap>
                Student preview
              </Typography>
              <Tooltip title="Exit preview">
                <IconButton color="inherit" onClick={exitPreview} edge="end" size="small" aria-label="exit preview">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
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
              Sample learner dashboard - simulated progress only. Log in after registration to see your real assessments.
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
