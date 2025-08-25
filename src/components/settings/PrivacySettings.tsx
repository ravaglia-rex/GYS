import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Switch, 
  FormControlLabel,
  Divider,
  Alert,
  Button,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Globe, 
  Eye, 
  EyeOff, 
  Shield, 
  Download,
  Trash2,
  Save,
  Lock,
  Users,
  Database,
  Analytics,
  Bell,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const PrivacySettings: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [privacySettings, setPrivacySettings] = useState({
    // Profile Privacy
    profileVisibility: 'public', // public, friends, private
    showEmail: false,
    showPhone: false,
    showSchool: true,
    showGrades: false,
    
    // Data Sharing
    shareAnalytics: true,
    sharePerformance: false,
    shareExamResults: 'friends', // public, friends, private
    allowResearch: false,
    
    // Communication
    allowMessages: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
    allowNotifications: true,
    
    // Data Retention
    autoDeleteData: false,
    dataRetentionPeriod: 24, // months
    exportData: true,
    deleteAccount: false
  });

  const handleSettingChange = (key: string, value: string | boolean | number) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    // Simulate data export
    console.log('Exporting data...');
    alert('Data export started. You will receive an email when it\'s ready.');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Account deletion requested...');
      alert('Account deletion request submitted. Our team will contact you within 24 hours.');
    }
  };

  const privacyCategories = [
    {
      title: 'Profile Privacy',
      description: 'Control who can see your profile information',
      icon: <Users size={24} />,
      color: '#8b5cf6',
      settings: [
        {
          key: 'profileVisibility',
          label: 'Profile Visibility',
          description: 'Who can see your profile',
          type: 'select',
          options: [
            { value: 'public', label: 'Public' },
            { value: 'friends', label: 'Friends Only' },
            { value: 'private', label: 'Private' }
          ]
        },
        {
          key: 'showEmail',
          label: 'Show Email Address',
          description: 'Display your email on profile',
          type: 'switch'
        },
        {
          key: 'showPhone',
          label: 'Show Phone Number',
          description: 'Display your phone on profile',
          type: 'switch'
        },
        {
          key: 'showSchool',
          label: 'Show School Information',
          description: 'Display your school details',
          type: 'switch'
        },
        {
          key: 'showGrades',
          label: 'Show Academic Grades',
          description: 'Display your grade information',
          type: 'switch'
        }
      ]
    },
    {
      title: 'Data Sharing',
      description: 'Manage how your data is shared and used',
      icon: <Database size={24} />,
      color: '#10b981',
      settings: [
        {
          key: 'shareAnalytics',
          label: 'Share Analytics Data',
          description: 'Help improve the platform with anonymous data',
          type: 'switch'
        },
        {
          key: 'sharePerformance',
          label: 'Share Performance Data',
          description: 'Allow others to see your performance metrics',
          type: 'switch'
        },
        {
          key: 'shareExamResults',
          label: 'Share Exam Results',
          description: 'Who can see your exam results',
          type: 'select',
          options: [
            { value: 'public', label: 'Public' },
            { value: 'friends', label: 'Friends Only' },
            { value: 'private', label: 'Private' }
          ]
        },
        {
          key: 'allowResearch',
          label: 'Allow Research Use',
          description: 'Your data may be used for educational research',
          type: 'switch'
        }
      ]
    },
    {
      title: 'Communication',
      description: 'Control how others can interact with you',
      icon: <Bell size={24} />,
      color: '#3b82f6',
      settings: [
        {
          key: 'allowMessages',
          label: 'Allow Direct Messages',
          description: 'Receive messages from other users',
          type: 'switch'
        },
        {
          key: 'allowFriendRequests',
          label: 'Allow Friend Requests',
          description: 'Receive friend connection requests',
          type: 'switch'
        },
        {
          key: 'showOnlineStatus',
          label: 'Show Online Status',
          description: 'Display when you are online',
          type: 'switch'
        },
        {
          key: 'allowNotifications',
          label: 'Allow Notifications',
          description: 'Receive platform notifications',
          type: 'switch'
        }
      ]
    }
  ];

  const renderSettingControl = (setting: any) => {
    switch (setting.type) {
      case 'switch':
        return (
          <Switch
            checked={privacySettings[setting.key as keyof typeof privacySettings] as boolean}
            onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#10b981',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#10b981',
              },
            }}
          />
        );
      case 'select':
        return (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={privacySettings[setting.key as keyof typeof privacySettings] as string}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b5cf6' },
                '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
              }}
            >
              {setting.options.map((option: any) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Privacy settings updated successfully!
        </Alert>
      )}

      {/* Privacy Overview */}
      <Card sx={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        mb: 4
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
            }}>
              <Globe size={32} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                Privacy & Data Control
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                Take control of your data and privacy. Customize who can see what and how your information is used.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Profile: Public"
                  size="small"
                  icon={<Users size={16} />}
                  sx={{
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}
                />
                <Chip
                  label="Data Sharing: Limited"
                  size="small"
                  icon={<Database size={16} />}
                  sx={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                />
                <Chip
                  label="Communication: Open"
                  size="small"
                  icon={<Bell size={16} />}
                  sx={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Privacy Categories */}
      {privacyCategories.map((category, index) => (
        <Card key={index} sx={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          mb: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{
                width: 48,
                height: 48,
                backgroundColor: `${category.color}20`,
                color: category.color,
                border: `2px solid ${category.color}30`
              }}>
                {category.icon}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {category.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {category.description}
                </Typography>
              </Box>
            </Box>

            <List sx={{ p: 0 }}>
              {category.settings.map((setting, settingIndex) => (
                <React.Fragment key={setting.key}>
                  <ListItem sx={{ 
                    px: 0, 
                    py: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    mb: 1
                  }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <Info size={20} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 0.5 }}>
                          {setting.label}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {setting.description}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      {renderSettingControl(setting)}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {settingIndex < category.settings.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}

      {/* Data Management */}
      <Card sx={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        mb: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
            Data Management
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
                  Data Retention Period
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2, display: 'block' }}>
                  How long to keep your data (months)
                </Typography>
                <Slider
                  value={privacySettings.dataRetentionPeriod}
                  onChange={(_, value) => handleSettingChange('dataRetentionPeriod', value)}
                  min={1}
                  max={60}
                  step={1}
                  marks={[
                    { value: 1, label: '1m' },
                    { value: 12, label: '1y' },
                    { value: 60, label: '5y' }
                  ]}
                  sx={{
                    color: '#8b5cf6',
                    '& .MuiSlider-mark': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                    '& .MuiSlider-markLabel': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />
                <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600, textAlign: 'center' }}>
                  {privacySettings.dataRetentionPeriod} months
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
                  Auto-delete Data
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2, display: 'block' }}>
                  Automatically delete old data after retention period
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={privacySettings.autoDeleteData}
                      onChange={(e) => handleSettingChange('autoDeleteData', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10b981',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#10b981',
                        },
                      }}
                    />
                  }
                  label="Enable Auto-deletion"
                  sx={{ color: 'white' }}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={handleExportData}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': { borderColor: '#2563eb', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
              }}
            >
              Export My Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<Trash2 size={16} />}
              onClick={handleDeleteAccount}
              sx={{
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': { borderColor: '#dc2626', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
              }}
            >
              Request Account Deletion
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            backgroundColor: '#8b5cf6',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            '&:hover': { backgroundColor: '#7c3aed' }
          }}
        >
          {isSaving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </Box>

      {/* Privacy Tips */}
      <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
          🔒 <strong>Privacy Tip:</strong> Review your privacy settings regularly. You can change these settings at any time. Remember, more privacy means fewer social features, so find the right balance for you.
        </Typography>
      </Box>
    </Box>
  );
};

export default PrivacySettings;
