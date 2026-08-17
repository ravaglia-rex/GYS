import React, { useMemo, useState } from 'react';
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
  Collapse,
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
  Insights as AnalyticsIcon,
  ReportProblem as QuestionReportsIcon,
  ExpandLess,
  ExpandMore,
  FactCheckOutlined as OfficialExamsIcon,
  FitnessCenterOutlined as PracticeExamsIcon,
  TodayOutlined as QodIcon,
  TimelineOutlined as ActivityIcon,
  MonetizationOnOutlined as CoinsIcon,
  Inventory2Outlined as ItemBankIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { useSelector } from 'react-redux';
import type { RootState } from '../state_data/reducer';
import { institutionalPalette as ip } from '../theme/institutionalPalette';
import {
  canAccessPlatformAdminAnalytics,
  canAccessPlatformAdminQuestionReports,
} from '../utils/platformAdminAnalyticsAccess';

const HEADER_NAVY = '#002147';
const DRAWER_WIDTH = 260;
const APP_BAR_HEIGHT = 64;
const PAGE_BG = '#f1f5f9';
const SIDEBAR_ICON_SIZE = 22;
const CHILD_ICON_SIZE = 18;
/** Stable identity — a new ModalProps object every render can loop MUI Fade/Transition. */
const MOBILE_DRAWER_MODAL_PROPS = { keepMounted: false } as const;
const SUBMENU_COLLAPSE_TIMEOUT_MS = 200;

type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
};

const ANALYTICS_NAV_ITEM: NavItem = {
  title: 'Analytics',
  path: '/platform-admin/analytics',
  icon: <AnalyticsIcon sx={{ color: '#2563eb', fontSize: SIDEBAR_ICON_SIZE }} />,
  children: [
    {
      title: 'Official Exams',
      path: '/platform-admin/analytics/official',
      icon: <OfficialExamsIcon sx={{ color: '#2563eb', fontSize: CHILD_ICON_SIZE }} />,
    },
    {
      title: 'Practice Exams',
      path: '/platform-admin/analytics/practice',
      icon: <PracticeExamsIcon sx={{ color: '#2563eb', fontSize: CHILD_ICON_SIZE }} />,
    },
    {
      title: 'Question of the Day',
      path: '/platform-admin/analytics/qod',
      icon: <QodIcon sx={{ color: '#2563eb', fontSize: CHILD_ICON_SIZE }} />,
    },
    {
      title: 'Overall Activity',
      path: '/platform-admin/analytics/activity',
      icon: <ActivityIcon sx={{ color: '#2563eb', fontSize: CHILD_ICON_SIZE }} />,
    },
    {
      title: 'Coins',
      path: '/platform-admin/analytics/coins',
      icon: <CoinsIcon sx={{ color: '#2563eb', fontSize: CHILD_ICON_SIZE }} />,
    },
  ],
};

const QUESTION_REPORTS_NAV_ITEM: NavItem = {
  title: 'Q Reports',
  path: '/platform-admin/question-reports',
  icon: <QuestionReportsIcon sx={{ color: '#c2410c', fontSize: SIDEBAR_ICON_SIZE }} />,
};

const ITEM_BANK_NAV_ITEM: NavItem = {
  title: 'Item Bank',
  path: '/platform-admin/item-bank',
  icon: <ItemBankIcon sx={{ color: '#2563eb', fontSize: SIDEBAR_ICON_SIZE }} />,
};

const BASE_NAV_ITEMS: NavItem[] = [
  { title: 'Schools', path: '/platform-admin/schools', icon: <SchoolIcon sx={{ color: '#059669', fontSize: SIDEBAR_ICON_SIZE }} /> },
  { title: 'Students', path: '/platform-admin/students', icon: <PeopleIcon sx={{ color: '#64748b', fontSize: SIDEBAR_ICON_SIZE }} /> },
  { title: 'Rewards', path: '/platform-admin/rewards', icon: <RewardsIcon sx={{ color: '#b45309', fontSize: SIDEBAR_ICON_SIZE }} /> },
];

const PIPELINE_NAV_ITEM: NavItem = {
  title: 'Pipelines',
  path: '/platform-admin/pipelines',
  icon: <PipelineIcon sx={{ color: '#7c3aed', fontSize: SIDEBAR_ICON_SIZE }} />,
};

const ADMINS_NAV_ITEM: NavItem = {
  title: 'Admin Mgmt',
  path: '/platform-admin/admins',
  icon: <AdminsIcon sx={{ color: '#0f766e', fontSize: SIDEBAR_ICON_SIZE }} />,
};

interface PlatformAdminLayoutProps {
  children: React.ReactNode;
}

/** Function declaration (not const) so Fast Refresh / lazy() never hit TDZ on default export. */
export default function PlatformAdminLayout({ children }: PlatformAdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const userEmail = useSelector((state: RootState) => state.auth.user?.email) ?? auth.currentUser?.email ?? '';
  const platformAdminRole = useSelector((state: RootState) => state.auth.platformAdminRole);

  const navItems = useMemo(() => {
    const mid: NavItem[] = [];
    if (canAccessPlatformAdminAnalytics(userEmail)) {
      mid.push(ANALYTICS_NAV_ITEM);
      mid.push(ITEM_BANK_NAV_ITEM);
    }
    if (canAccessPlatformAdminQuestionReports(userEmail)) mid.push(QUESTION_REPORTS_NAV_ITEM);
    const base = [
      BASE_NAV_ITEMS[0],
      BASE_NAV_ITEMS[1],
      ...mid,
      BASE_NAV_ITEMS[2],
    ];
    return platformAdminRole === 'super' ? [...base, PIPELINE_NAV_ITEM, ADMINS_NAV_ITEM] : base;
  }, [platformAdminRole, userEmail]);

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

  const isPathActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const hasActiveChild = (item: NavItem): boolean =>
    item.children?.some((child) => isPathActive(child.path) || hasActiveChild(child)) ?? false;

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !(prev[title] ?? false) }));
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const childActive = hasActiveChild(item);
    const active = level === 0 ? isPathActive(item.path) || childActive : location.pathname === item.path;
    const hasChildren = Boolean(item.children?.length);
    // Include the parent path so /analytics → /analytics/official does not close-then-open
    // Collapse (that enter animation is what loops Transition on first load).
    const submenuOpen =
      openSubmenus[item.title] ?? (childActive || (hasChildren && isPathActive(item.path)));

    return (
      <Box key={item.path}>
        <Box
          onClick={() => {
            if (hasChildren) {
              toggleSubmenu(item.title);
              if (!childActive && item.children?.[0]) {
                go(item.children[0].path);
              }
            } else {
              go(item.path);
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: level === 0 ? 1.25 : 1,
            mx: 1,
            ml: level === 0 ? 1 : 2.5,
            borderRadius: 1.5,
            cursor: 'pointer',
            bgcolor: active ? ip.sidebarActiveBg : 'transparent',
            borderLeft: active ? `4px solid ${ip.sidebarActiveBorder}` : '4px solid transparent',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: active ? 'rgba(37, 99, 235, 0.1)' : 'rgba(15, 23, 42, 0.04)' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, flexShrink: 0 }}>
            {item.icon}
          </Box>
          <Typography
            sx={{
              flex: 1,
              fontWeight: active ? 600 : 500,
              fontSize: level === 0 ? '0.9rem' : '0.84rem',
              color: active ? ip.sidebarActiveText : '#334155',
            }}
          >
            {item.title}
          </Typography>
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleSubmenu(item.title);
              }}
              sx={{ color: active ? ip.sidebarActiveText : '#64748b', p: 0.25 }}
            >
              {submenuOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          )}
        </Box>

        {hasChildren && (
          <Collapse in={submenuOpen} timeout={SUBMENU_COLLAPSE_TIMEOUT_MS}>
            <Box sx={{ py: 0.25 }}>{item.children!.map((child) => renderNavItem(child, level + 1))}</Box>
          </Collapse>
        )}
      </Box>
    );
  };

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
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', py: 2 }}>{navItems.map((item) => renderNavItem(item))}</Box>
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

      <Box sx={{ pt: `${APP_BAR_HEIGHT}px` }}>
        <Box sx={{ display: 'flex', width: '100%', bgcolor: PAGE_BG }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={MOBILE_DRAWER_MODAL_PROPS}
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
              overflow: 'visible',
              marginLeft: { xs: 0, md: `${DRAWER_WIDTH}px` },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
