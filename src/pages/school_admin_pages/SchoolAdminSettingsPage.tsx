import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Paper,
  Avatar,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';

const SchoolAdminSettingsPage: React.FC = () => {
  // Mock school admin data for testing
  const mockSchoolAdmin = {
    email: 'srishti2k1@gmail.com',
    schoolId: '018WuXO6zOabXh4ZXmcq',
    role: 'schooladmin'
  };
  const mockUser = {
    email: 'srishti2k1@gmail.com',
    displayName: 'School Administrator'
  };
  const [settings, setSettings] = useState({
    emailNotifications: true,
    examAlerts: true,
    studentUpdates: false,
    weeklyReports: true,
    securityAlerts: true
  });
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Sample School',
    address: '123 Education Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    website: 'www.sampleschool.edu'
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSettingChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked
    });
  };

  const handleSchoolInfoChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolInfo({
      ...schoolInfo,
      [field]: event.target.value
    });
  };

  const handleSave = () => {
    // TODO: Save settings to backend
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    // Reset to original values
    setSettings({
      emailNotifications: true,
      examAlerts: true,
      studentUpdates: false,
      weeklyReports: true,
      securityAlerts: true
    });
    setSchoolInfo({
      name: 'Sample School',
      address: '123 Education Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      website: 'www.sampleschool.edu'
    });
  };

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8' }}>
          Manage your school admin preferences and configurations
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Profile Information
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                              <Avatar sx={{ mr: 2, bgcolor: '#3b82f6', width: 64, height: 64 }}>
                {mockUser.displayName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  {mockUser.displayName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  {mockUser.email}
                </Typography>
                  <Chip 
                    label="School Admin" 
                    size="small" 
                    sx={{ 
                      bgcolor: '#3b82f6', 
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                School ID: {mockSchoolAdmin.schoolId}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Role: {mockSchoolAdmin.role}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* School Information */}
        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  School Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="School Name"
                  value={schoolInfo.name}
                  onChange={handleSchoolInfoChange('name')}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#334155',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                  }}
                />
                <TextField
                  label="Address"
                  value={schoolInfo.address}
                  onChange={handleSchoolInfoChange('address')}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#334155',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                  }}
                />
                <TextField
                  label="Phone"
                  value={schoolInfo.phone}
                  onChange={handleSchoolInfoChange('phone')}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#334155',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                  }}
                />
                <TextField
                  label="Website"
                  value={schoolInfo.website}
                  onChange={handleSchoolInfoChange('website')}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#334155',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Notification Settings */}
        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#f59e0b', mr: 2 }}>
                  <NotificationsIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Notification Settings
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingChange('emailNotifications')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#3b82f6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#3b82f6',
                        },
                      }}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.examAlerts}
                      onChange={handleSettingChange('examAlerts')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#3b82f6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#3b82f6',
                        },
                      }}
                    />
                  }
                  label="Exam Completion Alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.studentUpdates}
                      onChange={handleSettingChange('studentUpdates')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#3b82f6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#3b82f6',
                        },
                      }}
                    />
                  }
                  label="Student Registration Updates"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.weeklyReports}
                      onChange={handleSettingChange('weeklyReports')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#3b82f6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#3b82f6',
                        },
                      }}
                    />
                  }
                  label="Weekly Performance Reports"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.securityAlerts}
                      onChange={handleSettingChange('securityAlerts')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#3b82f6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#3b82f6',
                        },
                      }}
                    />
                  }
                  label="Security Alerts"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Security Settings */}
        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#ef4444', mr: 2 }}>
                  <SecurityIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Security Settings
                </Typography>
              </Box>

              <Paper sx={{ p: 2, bgcolor: '#334155', border: '1px solid #475569', mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Two-Factor Authentication
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Enhanced security feature coming soon
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#334155', border: '1px solid #475569', mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Session Management
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Manage active sessions and login history
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#334155', border: '1px solid #475569' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Data Export
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Export school data and analytics
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{ borderColor: '#334155', color: '#94a3b8' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Save Changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolAdminSettingsPage;
