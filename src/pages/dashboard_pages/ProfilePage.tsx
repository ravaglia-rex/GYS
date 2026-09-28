import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material';
import {
  User,
  Shield,
  CreditCard,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ProfileSettings from '../../components/settings/ProfileSettings';
import SecurityPrivacySettings from '../../components/settings/SecurityPrivacySettings';
import BillingSettings from '../../components/settings/BillingSettings';
import { auth } from '../../firebase/firebase';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { useStudent } from '../../query/hooks';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

type TabKey = 'about' | 'billing' | 'security';

const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = auth.currentUser;
  const { data: userData } = useStudent(currentUser?.uid, Boolean(currentUser?.uid));
  // User-ID roster students (e.g. Lawrence @school.gys.com) — no password-change UI.
  const hideSecurityTab = userData?.login_email_is_synthetic === true;

  const tabKeys = useMemo((): TabKey[] => {
    return hideSecurityTab ? ['about', 'billing'] : ['about', 'billing', 'security'];
  }, [hideSecurityTab]);

  const tabIndexFromKey = useCallback(
    (key: string | null): number => {
      const idx = tabKeys.indexOf((key as TabKey) || 'about');
      return idx >= 0 ? idx : 0;
    },
    [tabKeys]
  );

  const [activeTab, setActiveTab] = useState(() =>
    tabIndexFromKey(searchParams.get('tab'))
  );

  useEffect(() => {
    const key = searchParams.get('tab');
    if (hideSecurityTab && key === 'security') {
      navigate(`/profile?tab=about${location.hash || ''}`, { replace: true });
      setActiveTab(0);
      return;
    }
    setActiveTab(tabIndexFromKey(key));
  }, [searchParams, hideSecurityTab, location.hash, navigate, tabIndexFromKey]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const key = tabKeys[newValue] ?? 'about';
    const hash = location.hash || '';
    navigate(`/profile?tab=${key}${hash}`, { replace: true });
  };

  const tabs = useMemo(() => {
    const all = [
      {
        key: 'about' as const,
        label: 'About',
        icon: <User size={20} />,
        description: 'Update your personal information',
      },
      {
        key: 'billing' as const,
        label: 'Billing & Payment',
        icon: <CreditCard size={20} />,
        description: 'Membership and payment history',
      },
      {
        key: 'security' as const,
        label: 'Security & Privacy',
        icon: <Shield size={20} />,
        description: 'Password, security, and privacy',
      },
    ];
    return all.filter((t) => tabKeys.includes(t.key));
  }, [tabKeys]);

  return (
    <DashboardLayout>
      <PageTutorial pageKey="student.settings" />
      <Box sx={{ maxWidth: '100%' }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <User size={32} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h4"
                sx={{
                  ...studentPageTitleSx,
                  minWidth: 0,
                }}
              >
                Profile
              </Typography>
              <Typography variant="h6" sx={studentPageSubtitleSx}>
                {hideSecurityTab
                  ? 'Manage your account and billing'
                  : 'Manage your account, billing, and security'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Card
          data-tutorial-id="student-settings-account-card"
          sx={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            mb: 4,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 2, sm: 3 },
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 72, sm: 80 },
                  height: { xs: 72, sm: 80 },
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 600,
                }}
              >
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  {currentUser?.displayName || 'Student'}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, overflowWrap: 'anywhere' }}
                >
                  {currentUser?.email}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Member since{' '}
                  {currentUser?.metadata?.creationTime
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : 'Recently'}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                  Active Account
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box data-tutorial-id="student-settings-tabs" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    minHeight: 64,
                    padding: '12px 16px',
                    '&.Mui-selected': {
                      color: '#8b5cf6',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#8b5cf6',
                    height: 3,
                  },
                }}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.key}
                    label={
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5,
                          width: '100%',
                        }}
                      >
                        {tab.icon}
                        <Typography variant="body1" sx={{ fontWeight: 600, textAlign: 'center' }}>
                          {tab.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            textAlign: 'center',
                            display: { xs: 'none', md: 'block' },
                          }}
                        >
                          {tab.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            <Box data-tutorial-id="student-settings-content" sx={{ p: 3 }}>
              <TabPanel value={activeTab} index={tabKeys.indexOf('about')}>
                <ProfileSettings />
              </TabPanel>
              <TabPanel value={activeTab} index={tabKeys.indexOf('billing')}>
                <BillingSettings />
              </TabPanel>
              {!hideSecurityTab ? (
                <TabPanel value={activeTab} index={tabKeys.indexOf('security')}>
                  <SecurityPrivacySettings />
                </TabPanel>
              ) : null}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
            Need help with your account?
          </Typography>
          <Typography
            component="a"
            href="mailto:globalyoungscholar@argus.ai"
            variant="body2"
            sx={{ color: '#8b5cf6', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Contact Support
          </Typography>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default ProfilePage;
