import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Paper,
  Avatar,
  Chip
} from '@mui/material';
import {
  Security as SecurityIcon,
  School as SchoolIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../state_data/reducer';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { checkUserRole } from '../../state_data/authSlice';

const SchoolAdminSettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { schoolAdmin, user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    contactEmail: '',
    phone: '',
    website: '',
    verified: false
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);

  // Ensure schoolAdmin is loaded
  useEffect(() => {
    const ensureSchoolAdmin = async () => {
      // Only try once
      if (hasTriedLoading || authLoading) {
        return;
      }

      // Get user email from Firebase auth if not in Redux
      const currentUser = auth.currentUser;
      const userEmail = user?.email || currentUser?.email;

      if (!schoolAdmin && userEmail) {
        console.log('SchoolAdmin not loaded, checking user role for:', userEmail);
        setHasTriedLoading(true);
        try {
          await dispatch(checkUserRole(userEmail));
        } catch (error) {
          console.error('Error checking user role:', error);
          setLoading(false);
        }
      } else if (!userEmail) {
        // No user email, can't load schoolAdmin
        console.log('No user email available');
        setLoading(false);
      }
    };

    ensureSchoolAdmin();
  }, [authLoading, schoolAdmin, user, dispatch, hasTriedLoading]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If we've tried loading and schoolAdmin is still null, stop trying
      if (hasTriedLoading && !schoolAdmin?.schoolId) {
        console.error('SchoolAdmin could not be loaded. Please ensure you are logged in as a school admin.');
        setLoading(false);
        return;
      }

      // If schoolAdmin is still null, wait for it to load
      if (!schoolAdmin?.schoolId) {
        console.log('Waiting for schoolAdmin...', { hasTriedLoading, schoolAdmin });
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching school data for schoolId:', schoolAdmin.schoolId);
        
        // Fetch school document from Firestore
        const schoolDoc = await getDoc(doc(db, 'schools', schoolAdmin.schoolId));
        
        if (!schoolDoc.exists()) {
          console.error('School document does not exist for ID:', schoolAdmin.schoolId);
          setLoading(false);
          return;
        }

        const schoolDocData = schoolDoc.data();
        console.log('Fetched school data:', schoolDocData);
        console.log('School name:', schoolDocData?.school_name);
        console.log('Email:', schoolDocData?.email);

        if (schoolDocData) {
          // Build address from school_address, address, city, and state
          const addressParts = [];
          if (schoolDocData.school_address) {
            addressParts.push(schoolDocData.school_address);
          } else if (schoolDocData.address) {
            addressParts.push(schoolDocData.address);
          }
          if (schoolDocData.city) addressParts.push(schoolDocData.city);
          if (schoolDocData.state) addressParts.push(schoolDocData.state);
          const fullAddress = addressParts.join(', ');

          const updatedSchoolInfo = {
            name: schoolDocData.school_name || '',
            address: fullAddress,
            city: schoolDocData.city || '',
            state: schoolDocData.state || '',
            contactEmail: schoolDocData.email || '',
            phone: schoolDocData.phone || schoolDocData.phone_number || '',
            website: schoolDocData.website || '',
            verified: schoolDocData.verified === true
          };

          console.log('Setting school info:', updatedSchoolInfo);
          setSchoolInfo(updatedSchoolInfo);
        } else {
          console.error('School document data is null or undefined');
        }
      } catch (error) {
        console.error('Error fetching school data:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          schoolId: schoolAdmin.schoolId
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolData();
  }, [schoolAdmin, authLoading, hasTriedLoading]);

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
    // Reload original values
    window.location.reload();
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Typography variant="h6" sx={{ color: '#ffffff' }}>
          Loading settings...
        </Typography>
      </Box>
    );
  }

  // Show error if schoolAdmin couldn't be loaded
  if (hasTriedLoading && !schoolAdmin?.schoolId) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Alert severity="error" sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #ef4444' }}>
          <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
            Unable to load school information
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Please ensure you are logged in as a school administrator and that your account is properly configured.
          </Typography>
        </Alert>
      </Box>
    );
  }

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
        <Alert severity="success" sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #10b981' }}>
          Settings saved successfully!
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* School Information */}
        <Card sx={{ 
          bgcolor: '#1e293b', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                <SchoolIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  School Information
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Update your school details and contact information
                </Typography>
              </Box>
              {schoolInfo.verified && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Verified"
                  color="success"
                  size="small"
                  sx={{ 
                    bgcolor: '#10b981',
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              )}
            </Box>

            <Divider sx={{ mb: 3, borderColor: '#334155' }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
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
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82f6',
                  },
                }}
              />
              
              <TextField
                label="Contact Email"
                value={schoolInfo.contactEmail}
                onChange={handleSchoolInfoChange('contactEmail')}
                fullWidth
                InputProps={{
                  startAdornment: <EmailIcon sx={{ color: '#94a3b8', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#334155',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82f6',
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
                  gridColumn: { xs: '1', md: '1 / -1' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#334155',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82f6',
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
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82f6',
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
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82f6',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card sx={{ 
          bgcolor: '#1e293b', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: '#ef4444', mr: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Security Settings
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Manage your account security and privacy
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3, borderColor: '#334155' }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 2, bgcolor: '#334155', border: '1px solid #475569' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                  Two-Factor Authentication
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Enhanced security feature coming soon
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#334155', border: '1px solid #475569' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                  Session Management
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Manage active sessions and login history
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#334155', border: '1px solid #475569' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                  Data Export
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Export school data and analytics
                </Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card sx={{ 
          bgcolor: '#1e293b', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                sx={{ 
                  borderColor: '#334155', 
                  color: '#94a3b8',
                  '&:hover': {
                    borderColor: '#475569',
                    bgcolor: '#334155'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ 
                  bgcolor: '#3b82f6', 
                  '&:hover': { bgcolor: '#2563eb' } 
                }}
              >
                Save Changes
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SchoolAdminSettingsPage;
