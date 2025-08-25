import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  Avatar,
  IconButton,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Mail,
  Key,
  CheckCircle,
  AlertTriangle,
  Save,
  Users,
  Database,
  Bell,
  Globe,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon
} from 'lucide-react';

const SecurityPrivacySettings: React.FC = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    emailVerification: true,
    loginAlerts: true,
    sessionTimeout: 30,
    requirePasswordChange: false,
    blockSuspiciousActivity: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showSchool: true,
    showGrades: false,
    shareAnalytics: true,
    sharePerformance: false,
    shareExamResults: 'friends',
    allowResearch: false,
    allowMessages: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
    allowNotifications: true,
    autoDeleteData: false,
    dataRetentionPeriod: 24
  });

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecuritySettingChange = (key: string, value: boolean | number) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePrivacySettingChange = (key: string, value: string | boolean | number) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const securityFeatures = [
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: <Smartphone size={20} />,
      action: (
        <Button
          variant={securitySettings.twoFactorAuth ? "outlined" : "contained"}
          size="small"
          onClick={() => handleSecuritySettingChange('twoFactorAuth', !securitySettings.twoFactorAuth)}
          sx={{
            backgroundColor: securitySettings.twoFactorAuth ? 'transparent' : '#10b981',
            borderColor: '#10b981',
            color: securitySettings.twoFactorAuth ? '#10b981' : 'white',
            '&:hover': {
              backgroundColor: securitySettings.twoFactorAuth ? 'rgba(16, 185, 129, 0.1)' : '#059669',
            }
          }}
        >
          {securitySettings.twoFactorAuth ? 'Disable' : 'Enable'}
        </Button>
      )
    },
    {
      title: 'Email Verification',
      description: 'Verify your email address for account security',
      icon: <Mail size={20} />,
      action: (
        <Chip
          label={securitySettings.emailVerification ? 'Verified' : 'Not Verified'}
          color={securitySettings.emailVerification ? 'success' : 'warning'}
          size="small"
          icon={securitySettings.emailVerification ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
        />
      )
    },
    {
      title: 'Login Alerts',
      description: 'Get notified of new login attempts',
      icon: <Shield size={20} />,
      action: (
        <Switch
          checked={securitySettings.loginAlerts}
          onChange={(e) => handleSecuritySettingChange('loginAlerts', e.target.checked)}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#10b981',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#10b981',
            },
          }}
        />
      )
    }
  ];

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

  const renderPrivacySettingControl = (setting: any) => {
    switch (setting.type) {
      case 'switch':
        return (
          <Switch
            checked={privacySettings[setting.key as keyof typeof privacySettings] as boolean}
            onChange={(e) => handlePrivacySettingChange(setting.key, e.target.checked)}
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
              onChange={(e) => handlePrivacySettingChange(setting.key, e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b5cf6' },
                '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.8)' }
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
          Settings updated successfully!
        </Alert>
      )}

      {/* Security Overview */}
      <Card sx={{
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 3,
        mb: 4
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
            }}>
              <Shield size={32} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, mb: 1, fontSize: '1.8rem' }}>
                Security & Privacy
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2, fontSize: '1.1rem' }}>
                Protect your account and control your privacy settings
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Security Score: Excellent (95/100)"
                  size="small"
                  icon={<Shield size={16} />}
                  sx={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontWeight: 600
                  }}
                />
                <Chip
                  label="Privacy: Protected"
                  size="small"
                  icon={<Globe size={16} />}
                  sx={{
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

    <Box sx={{
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
    gap: 3,
  }}>
      {/* Password Change */}
      <Box sx={{ flex: { xs: "100%", sm: "50%" } , flexGrow: 0}}>

      <Card sx={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
            }}>
              <Lock size={24} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Change Password
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Update your password regularly for better security
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showOldPassword ? 'text' : 'password'}
              value={passwordData.oldPassword}
              onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
              }}
            />

            <Button
              variant="contained"
              startIcon={<Key size={16} />}
              onClick={handlePasswordUpdate}
              disabled={isSaving || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              sx={{
                backgroundColor: '#8b5cf6',
                '&:hover': { backgroundColor: '#7c3aed' },
                '&:disabled': { backgroundColor: 'rgba(139, 92, 246, 0.3)' }
              }}
            >
              {isSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      </Box>

      {/* Security Features */}
      <Box sx={{ flex: { xs: "100%", sm: "50%" } , flexGrow: 0}}>

      <Card sx={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
            }}>
              <Shield size={24} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Security Features
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Manage your account security settings
              </Typography>
            </Box>
          </Box>

          <List sx={{ p: 0 }}>
            {securityFeatures.map((feature, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {feature.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {feature.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {feature.description}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    {feature.action}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < securityFeatures.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
      </Box>
      </Box>     
    {/* Additional Security Settings */}
      <Card sx={{
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 3,
        mt: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3, fontSize: '1.3rem' }}>
            Additional Security Options
          </Typography>

          <Grid container spacing={3}>
            <Box sx={{ flex: { xs: "100%", sm: "50%" } , flexGrow: 0}}>
                              <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.requirePasswordChange}
                      onChange={(e) => handleSecuritySettingChange('requirePasswordChange', e.target.checked)}
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
                  label="Require Password Change Every 90 Days"
                  sx={{ color: 'white', fontSize: '1rem', fontWeight: 500 }}
                />
            </Box>

            <Box sx={{ flex: { xs: "100%", sm: "50%" } , flexGrow: 0}}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.blockSuspiciousActivity}
                      onChange={(e) => handleSecuritySettingChange('blockSuspiciousActivity', e.target.checked)}
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
                  label="Block Suspicious Login Activity"
                  sx={{ color: 'white', fontSize: '1rem', fontWeight: 500 }}
                />
            </Box>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Save size={16} />}
              onClick={handleSaveSettings}
              disabled={isSaving}
              sx={{
                backgroundColor: '#10b981',
                px: 4,
                '&:hover': { backgroundColor: '#059669' }
              }}
            >
              {isSaving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>
          🔒 <strong>Security Tip:</strong> Use a strong, unique password and enable two-factor authentication for maximum account protection. Never share your login credentials with anyone.
        </Typography>
      </Box>
    </Box>
  );
};

export default SecurityPrivacySettings;
