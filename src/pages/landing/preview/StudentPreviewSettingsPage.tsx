import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Avatar,
  TextField,
  Button,
  Alert,
  InputAdornment,
  MenuItem,
  Snackbar,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { User, Mail, Phone, School, Save, Edit, Shield, Key, Settings as SettingsIcon } from 'lucide-react';
import {
  PREVIEW_STUDENT_PROFILE,
  PREVIEW_SETTINGS_FORM_INITIAL,
} from '../../../data/studentPreviewMock';

type PreviewSettingsFormValues = typeof PREVIEW_SETTINGS_FORM_INITIAL;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`preview-settings-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: 'white',
    fontSize: '1rem',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1rem',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
};

/**
 * Settings UI for the sample dashboard: edits are local only; save actions explain that nothing is persisted.
 */
const StudentPreviewSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PreviewSettingsFormValues>(() => ({
    ...PREVIEW_SETTINGS_FORM_INITIAL,
  }));
  const [previewSnackbar, setPreviewSnackbar] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(true);

  const showPreviewOnlyMessage = useCallback((detail: string) => {
    setPreviewSnackbar(`Preview only - ${detail}`);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field: keyof PreviewSettingsFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    showPreviewOnlyMessage('your account settings were not updated. Sign in to save changes.');
  };

  const handleCancelEdit = () => {
    setFormData({ ...PREVIEW_SETTINGS_FORM_INITIAL });
    setIsEditing(false);
  };

  const handlePasswordSubmit = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showPreviewOnlyMessage('passwords must match - try again in the live portal after sign-in.');
      return;
    }
    if (passwordData.newPassword.length > 0 && passwordData.newPassword.length < 6) {
      showPreviewOnlyMessage('use at least 6 characters when you change your password for real.');
      return;
    }
    setPasswordData({ newPassword: '', confirmPassword: '' });
    showPreviewOnlyMessage('your password was not changed. This is a demonstration.');
  };

  const tabs = [
    { label: 'Profile', icon: <User size={20} />, description: 'Personal information' },
    { label: 'Security & Privacy', icon: <Shield size={20} />, description: 'Password and privacy' },
  ];

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Snackbar
        open={!!previewSnackbar}
        autoHideDuration={6000}
        onClose={() => setPreviewSnackbar(null)}
        message={previewSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: 'white',
            }}
          >
            <SettingsIcon size={32} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 700,
                background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Settings & Preferences
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400 }}>
              Sample data - nothing here is stored
            </Typography>
          </Box>
        </Box>
      </Box>

      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: 'rgba(59, 130, 246, 0.15)',
          color: '#e2e8f0',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          '& .MuiAlert-icon': { color: '#93c5fd' },
        }}
      >
        You can explore editing below. Saving does not update any account - register and sign in to manage real
        settings.
      </Alert>

      <Card
        sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          mb: 4,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 600,
              }}
            >
              {formData.displayName.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                {formData.displayName}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                {formData.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {PREVIEW_STUDENT_PROFILE.membershipLevelLabel} · Active until {PREVIEW_STUDENT_PROFILE.membershipExpiryLabel}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                Preview account
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
                  '&.Mui-selected': { color: '#8b5cf6' },
                },
                '& .MuiTabs-indicator': { backgroundColor: '#8b5cf6', height: 3 },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
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

          <Box sx={{ p: 3 }}>
            <TabPanel value={activeTab} index={0}>
              <Card
                sx={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 3, fontSize: '1.4rem' }}>
                    Personal Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={20} color="rgba(255, 255, 255, 0.7)" />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      value={formData.email}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={20} color="rgba(255, 255, 255, 0.5)" />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="WhatsApp Number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone size={20} color="rgba(255, 255, 255, 0.7)" />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="School"
                      value={formData.schoolName}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <School size={20} color="rgba(255, 255, 255, 0.7)" />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      select
                      label="Grade/Class"
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      disabled={!isEditing}
                      sx={textFieldSx}
                    >
                      {['8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'].map((g) => (
                        <MenuItem key={g} value={g}>
                          {g}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      label="Parent Name"
                      value={formData.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={20} color="rgba(255, 255, 255, 0.7)" />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="Parent Email"
                      value={formData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={20} color="rgba(255, 255, 255, 0.7)" />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="Parent Phone"
                      value={formData.parentPhone}
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone size={20} color="rgba(255, 255, 255, 0.7)" />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                      <TextField
                        fullWidth
                        label="About Me"
                        value={formData.about}
                        onChange={(e) => handleInputChange('about', e.target.value)}
                        disabled={!isEditing}
                        multiline
                        rows={4}
                        sx={textFieldSx}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 2,
                      mt: 3,
                      pt: 3,
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {isEditing && (
                      <>
                        <Button variant="outlined" onClick={handleCancelEdit} sx={{ color: '#e2e8f0', borderColor: '#64748b' }}>
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Save size={16} />}
                          onClick={handleSaveProfile}
                          sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, px: 3, py: 1.5 }}
                        >
                          Save Changes
                        </Button>
                      </>
                    )}
                    {!isEditing && (
                      <Button
                        variant="contained"
                        startIcon={<Edit size={16} />}
                        onClick={() => setIsEditing(true)}
                        sx={{
                          backgroundColor: '#8b5cf6',
                          px: 3,
                          py: 1.5,
                          '&:hover': { backgroundColor: '#7c3aed' },
                        }}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Card
                sx={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Key size={22} /> Password
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2 }}>
                    In the live portal, you will update your password securely. Here you can type to see the flow only.
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="New password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                      sx={textFieldSx}
                    />
                  </Box>
                  <Button variant="contained" onClick={handlePasswordSubmit} sx={{ mb: 3, bgcolor: '#8b5cf6' }}>
                    Update password (preview)
                  </Button>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                    Preferences (local only)
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={loginAlerts}
                        onChange={(e) => setLoginAlerts(e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' } }}
                      />
                    }
                    label={<Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>Login alerts</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={shareAnalytics}
                        onChange={(e) => setShareAnalytics(e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' } }}
                      />
                    }
                    label={<Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>Share anonymized analytics</Typography>}
                  />
                </CardContent>
              </Card>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentPreviewSettingsPage;
