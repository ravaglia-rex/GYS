import { useState, useCallback, useEffect } from 'react';
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
  Person as PersonIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  ExpandLess,
  ExpandMore,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  EmojiEvents as EmojiEventsIcon,
  Quiz as QuizIcon,
  ErrorOutline as ErrorOutlineIcon,
  Lightbulb as LightbulbIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { rememberStudentPreviewExitTo, consumeStudentPreviewExitTo } from '../utils/studentPreviewExit';

const DRAWER_WIDTH = 280;

type StudentPreviewEntryState = { studentPreviewExitTo?: string };

const iconSx = { fontSize: '1.35rem' };
const ASSESSMENTS_NAV_COLOR = '#3b82f6';
const HOW_GYS_NAV_COLOR = '#f97316';

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
    if (p.includes('/assessments') || p.includes('/reports')) {
      setAssessmentsOpen(true);
    }
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const assessmentsActive =
    isActive('/students/preview/assessments') ||
    isActive('/students/preview/reports') ||
    location.pathname.startsWith('/for-schools/preview/assessment');

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
        selected={isActive('/students/preview/how-it-works')}
        onClick={() => {
          navigate('/students/preview/how-it-works');
          if (isMobile) setMobileOpen(false);
        }}
        sx={{
          borderRadius: 1.5,
          mb: 0.5,
          py: 1.1,
          pl: 2,
          borderLeft: isActive('/students/preview/how-it-works') ? `3px solid ${HOW_GYS_NAV_COLOR}` : '3px solid transparent',
          bgcolor: isActive('/students/preview/how-it-works') ? 'rgba(249,115,22,0.12)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          '&.Mui-selected': { bgcolor: 'rgba(249,115,22,0.15)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: HOW_GYS_NAV_COLOR }}>
          <ErrorOutlineIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText
          primary="How GYS Works"
          slotProps={{
            primary: {
              fontWeight: isActive('/students/preview/how-it-works') ? 600 : 500,
              fontSize: '0.9rem',
              color: '#e2e8f0',
            },
          }}
        />
      </ListItemButton>

      <Tooltip title="Not available in the sample dashboard">
        <Box component="span" sx={{ display: 'block' }}>
          <ListItemButton
            disabled
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              py: 1.1,
              pl: 2,
              opacity: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#a855f7' }}>
              <LightbulbIcon sx={iconSx} />
            </ListItemIcon>
            <ListItemText primary="Question of the Day" slotProps={{ primary: { fontWeight: 500, fontSize: '0.9rem', color: '#e2e8f0' } }} />
          </ListItemButton>
        </Box>
      </Tooltip>

      <ListItemButton
        onClick={() => setAssessmentsOpen(o => !o)}
        sx={{
          borderRadius: 1.5,
          mb: 0.25,
          py: 1.1,
          pl: 2,
          borderLeft: assessmentsActive ? `3px solid ${ASSESSMENTS_NAV_COLOR}` : '3px solid transparent',
          bgcolor: assessmentsActive ? 'rgba(59,130,246,0.1)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: ASSESSMENTS_NAV_COLOR }}>
          <AssessmentIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText primary="Assessments" slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' } }} />
        {assessmentsOpen ? <ExpandLess sx={{ color: '#94a3b8' }} /> : <ExpandMore sx={{ color: '#94a3b8' }} />}
      </ListItemButton>
      <Collapse in={assessmentsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/students/preview/assessments/available');
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              pl: 4,
              py: 0.9,
              borderRadius: 1.5,
              mb: 0.25,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
            selected={isActive('/students/preview/assessments/available')}
          >
            <ListItemIcon sx={{ minWidth: 36, color: ASSESSMENTS_NAV_COLOR }}>
              <SchoolIcon sx={{ fontSize: '1.1rem' }} />
            </ListItemIcon>
            <ListItemText primary="Available" slotProps={{ primary: { fontSize: '0.85rem', color: '#cbd5e1' } }} />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate('/students/preview/assessments/completed');
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              pl: 4,
              py: 0.9,
              borderRadius: 1.5,
              mb: 0.25,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
            selected={isActive('/students/preview/assessments/completed')}
          >
            <ListItemIcon sx={{ minWidth: 36, color: ASSESSMENTS_NAV_COLOR }}>
              <BarChartIcon sx={{ fontSize: '1.1rem' }} />
            </ListItemIcon>
            <ListItemText primary="Completed & Results" slotProps={{ primary: { fontSize: '0.85rem', color: '#cbd5e1' } }} />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate('/students/preview/reports');
              if (isMobile) setMobileOpen(false);
            }}
            selected={isActive('/students/preview/reports')}
            sx={{
              pl: 4,
              py: 0.9,
              borderRadius: 1.5,
              mb: 0.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: ASSESSMENTS_NAV_COLOR }}>
              <AssignmentIcon sx={{ fontSize: '1.1rem' }} />
            </ListItemIcon>
            <ListItemText primary="Reports" slotProps={{ primary: { fontSize: '0.85rem', color: '#cbd5e1' } }} />
          </ListItemButton>
        </List>
      </Collapse>

      <ListItemButton
        selected={isActive('/students/preview/practice')}
        onClick={() => {
          navigate('/students/preview/practice');
          if (isMobile) setMobileOpen(false);
        }}
        sx={{
          borderRadius: 1.5,
          mb: 0.5,
          py: 1.1,
          pl: 2,
          borderLeft: isActive('/students/preview/practice') ? '3px solid #38bdf8' : '3px solid transparent',
          bgcolor: isActive('/students/preview/practice') ? 'rgba(56,189,248,0.12)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          '&.Mui-selected': { bgcolor: 'rgba(56,189,248,0.15)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: '#38bdf8' }}>
          <QuizIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText
          primary="Practice Mode"
          slotProps={{
            primary: {
              fontWeight: isActive('/students/preview/practice') ? 600 : 500,
              fontSize: '0.9rem',
              color: '#e2e8f0',
            },
          }}
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
          primary="School Leaderboard"
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
        onClick={() => {
          navigate('/students#argus-coins');
          if (isMobile) setMobileOpen(false);
        }}
        sx={{
          borderRadius: 1.5,
          mb: 0.5,
          py: 1.1,
          pl: 2,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: '#eab308' }}>
          <StorefrontIcon sx={iconSx} />
        </ListItemIcon>
        <ListItemText primary="Rewards Shop" slotProps={{ primary: { fontWeight: 500, fontSize: '0.9rem', color: '#e2e8f0' } }} />
      </ListItemButton>

      {(
        [
          { title: 'Profile', path: '/students/preview/settings', icon: <PersonIcon sx={iconSx} />, color: '#94a3b8' },
        ] as const
      ).map(item => {
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
              borderLeft: active ? `3px solid ${item.color}` : '3px solid transparent',
              bgcolor: active ? `${item.color}14` : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              '&.Mui-selected': { bgcolor: `${item.color}18` },
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a', overflowX: 'hidden' }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: '#0f172a',
            backgroundImage: 'none',
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
            bgcolor: '#0f172a',
            backgroundImage: 'none',
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
          minWidth: 0,
        }}
      >
        {/*
          Fixed bar + toolbar spacer: `overflow-x` on an ancestor breaks `position: sticky`, so we pin the bar
          to the viewport and indent it beside the permanent drawer on lg (same idea as MUI “clipped” AppBar).
        */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            backgroundColor: 'rgba(15,23,42,0.97)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            zIndex: theme.zIndex.appBar,
            left: { xs: 0, lg: `${DRAWER_WIDTH}px` },
            width: { xs: '100%', lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', gap: 1, minHeight: { xs: 56, sm: 64 } }}>
            <Box sx={{ display: { xs: 'none', lg: 'block' }, flex: 1 }} />
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
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                <IconButton color="inherit" onClick={() => setMobileOpen(o => !o)} edge="start" aria-label="open menu">
                  <MenuIcon />
                </IconButton>
                <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 700 }} noWrap>
                  Student preview
                </Typography>
              </Box>
              <Tooltip title="Exit preview">
                <IconButton color="inherit" onClick={exitPreview} edge="end" size="small" aria-label="exit preview">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, flexShrink: 0 }} aria-hidden />

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 1.5, sm: 2, md: 3 },
            pt: { xs: 1.5, sm: 2, md: 3 },
            overflowX: 'hidden',
          }}
        >
          <Box
            sx={{
              mb: 2,
              px: { xs: 1.5, sm: 2 },
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
          <Box sx={{ maxWidth: 1200, mx: 'auto', minWidth: 0 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
