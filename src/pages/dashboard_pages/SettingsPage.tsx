import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Tabs, 
  Tab, 
  Avatar,
  Divider,
  Alert
} from '@mui/material';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe,
  Settings as SettingsIcon
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ProfileSettings from '../../components/settings/ProfileSettings';
import NotificationSettings from '../../components/settings/NotificationSettings';
import SecurityPrivacySettings from '../../components/settings/SecurityPrivacySettings';
import { auth } from '../../firebase/firebase';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const currentUser = auth.currentUser;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    {
      label: 'Profile',
      icon: <User size={20} />,
      description: 'Manage your personal information and preferences'
    },
    {
      label: 'Notifications',
      icon: <Bell size={20} />,
      description: 'Control how you receive notifications and updates'
    },
    {
      label: 'Security & Privacy',
      icon: <Shield size={20} />,
      description: 'Password, security, and privacy settings'
    }
  ];

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: '100%' }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: 'white',
            }}>
              <SettingsIcon size={32} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ 
                color: 'white', 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Settings & Preferences
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400 }}>
                Customize your experience and manage your account
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* User Info Card */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          mb: 4
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80,
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 600
                }}
              >
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  {currentUser?.displayName || 'Student'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  {currentUser?.email}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Member since {currentUser?.metadata?.creationTime ? 
                    new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                    'Recently'
                  }
                </Typography>
              </Box>
              <Box sx={{ 
                px: 3, 
                py: 1.5, 
                borderRadius: 2, 
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                  Active Account
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <CardContent sx={{ p: 0 }}>
            {/* Tab Navigation */}
            <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    label={
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        gap: 0.5,
                        width: '100%'
                      }}>
                        {tab.icon}
                        <Typography variant="body1" sx={{ fontWeight: 600, textAlign: 'center' }}>
                          {tab.label}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          textAlign: 'center',
                          display: { xs: 'none', md: 'block' }
                        }}>
                          {tab.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ p: 3 }}>
              <TabPanel value={activeTab} index={0}>
                <ProfileSettings />
              </TabPanel>
              
              <TabPanel value={activeTab} index={1}>
                <NotificationSettings />
              </TabPanel>
              
              <TabPanel value={activeTab} index={2}>
                <SecurityPrivacySettings />
              </TabPanel>
            </Box>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
            Need help with your settings?
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b5cf6', cursor: 'pointer', textDecoration: 'underline' }}>
            Contact Support
          </Typography>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default SettingsPage;
