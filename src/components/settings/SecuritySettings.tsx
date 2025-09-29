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
  ListItemSecondaryAction
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
  RefreshCw,
  Smartphone as PhoneIcon,
  Mail as EmailIcon,
  Shield as ShieldIcon
} from 'lucide-react';
import { 
  updatePassword
} from 'firebase/auth';
import { auth } from '../../firebase/firebase';

const SecuritySettings: React.FC = () => {
  // Remove showOldPassword state since we don't need it
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  // Remove oldPassword from passwordData
  const [passwordData, setPasswordData] = useState({
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

  const handlePasswordUpdate = async () => {
    // Validate new passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match!');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long!');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setShowError(false);
    setShowSuccess(false);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Update password directly
      await updatePassword(user, passwordData.newPassword);

      // Clear form and show success
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (error: any) {
      console.error('Error updating password:', error);
      
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign in again before changing your password.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving security settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const securityFeatures = [
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: <Smartphone size={20} />,
      status: securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled',
      statusColor: securitySettings.twoFactorAuth ? 'success' : 'default',
      action: (
        <Button
          variant="outlined"
          size="small"
          disabled
          sx={{
            borderColor: '#6b7280',
            color: '#6b7280',
            cursor: 'not-allowed',
            '&:hover': {
              backgroundColor: 'transparent',
            }
          }}
        >
          Coming Soon
        </Button>
      )
    },
    {
      title: 'Email Verification',
      description: 'Verify your email address for account security',
      icon: <Mail size={20} />,
      status: securitySettings.emailVerification ? 'Verified' : 'Not Verified',
      statusColor: securitySettings.emailVerification ? 'success' : 'warning',
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
      status: securitySettings.loginAlerts ? 'Active' : 'Inactive',
      statusColor: securitySettings.loginAlerts ? 'success' : 'default',
      action: (
        <Button
          variant="outlined"
          size="small"
          disabled
          sx={{
            borderColor: '#6b7280',
            color: '#6b7280',
            cursor: 'not-allowed',
            '&:hover': {
              backgroundColor: 'transparent',
            }
          }}
        >
          Coming Soon
        </Button>
      )
    }
  ];

  return (
    <Box>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Password updated successfully!
        </Alert>
      )}

      {showError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Security Overview */}
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
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
            }}>
              <Shield size={32} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                Account Security
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Protect your account with advanced security features and settings
              </Typography>
            </Box>
          </Box>

          {/* Security Score */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <ShieldIcon size={24} color="#10b981" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600, mb: 0.5 }}>
                Security Score: Excellent (95/100)
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(16, 185, 129, 0.7)' }}>
                Your account is well-protected with multiple security layers
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "stretch" }}>

        {/* Password Change */}
        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 50%" } }}>

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
                    Set a new password for your account
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Remove Current Password field completely */}

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
                  disabled={isSaving || !passwordData.newPassword || !passwordData.confirmPassword}
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
        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 50%" } }}>

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
                    Security Featuressssss
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
      {/* COMMENTED OUT - Additional Security Options
      <Card sx={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        mt: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
            Additional Security Options
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
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
                sx={{ color: 'white' }}
              />
            </Box>

            <Box sx={{ flexBasis: { xs: '100%', sm: '50%' } }}>
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
                sx={{ color: 'white' }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Save size={16} />}
              onClick={handleSaveSecuritySettings}
              disabled={isSaving}
              sx={{
                backgroundColor: '#10b981',
                px: 4,
                '&:hover': { backgroundColor: '#059669' }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      */}

      {/* Security Tips */}
      <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
          🔒 <strong>Security Tip:</strong> Use a strong, unique password and enable two-factor authentication for maximum account protection. Never share your login credentials with anyone.
        </Typography>
      </Box>
    </Box>
  );
};

export default SecuritySettings;
