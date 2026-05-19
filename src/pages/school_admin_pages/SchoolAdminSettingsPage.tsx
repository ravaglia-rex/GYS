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
import { useLocation } from 'react-router-dom';
import { RootState, AppDispatch } from '../../state_data/reducer';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { checkUserRole } from '../../state_data/authSlice';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { GREENFIELD_POC_EMAIL, GREENFIELD_SCHOOL_DISPLAY } from '../../data/schoolPreviewMock';
import { putSchoolProfile } from '../../db/schoolAdminCollection';

function primaryPocEmailFromSchoolDoc(data: Record<string, unknown>): string {
  const poc = data.poc_email;
  if (typeof poc === 'string' && poc.trim()) {
    return poc.trim();
  }
  const emails = data.contact_emails;
  if (Array.isArray(emails) && typeof emails[0] === 'string' && emails[0].trim()) {
    return emails[0].trim();
  }
  return '';
}

function additionalContactEmailsFromSchoolDoc(data: Record<string, unknown>): string[] {
  const raw = data.contact_emails;
  if (!Array.isArray(raw)) return [];
  const primary = primaryPocEmailFromSchoolDoc(data).toLowerCase();
  return raw
    .filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
    .map((e) => e.trim())
    .filter((e) => e.toLowerCase() !== primary);
}

function formatBoardsFromSchoolDoc(data: Record<string, unknown>): string {
  const boards = data.boards;
  const stateBoard =
    typeof data.state_board_state === 'string' ? data.state_board_state.trim() : '';
  if (Array.isArray(boards) && boards.length > 0) {
    return boards
      .map((b) => {
        if (typeof b !== 'string') return '';
        if (b === 'State Board' && stateBoard) return `State Board (${stateBoard})`;
        return b;
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof data.board === 'string' && data.board.trim()) {
    return data.board.trim();
  }
  return '';
}

function stringListFromDoc(data: Record<string, unknown>, key: string): string {
  const raw = data[key];
  if (!Array.isArray(raw)) return '';
  return raw
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim())
    .join(', ');
}

function phoneFromSchoolDoc(data: Record<string, unknown>): string {
  if (typeof data.poc_contact_e164 === 'string' && data.poc_contact_e164.trim()) {
    return data.poc_contact_e164.trim();
  }
  if (typeof data.phone === 'string' && data.phone.trim()) return data.phone.trim();
  if (typeof data.phone_number === 'string' && data.phone_number.trim()) {
    return data.phone_number.trim();
  }
  return '';
}

export type SchoolRegistrationDisplay = {
  udiseCode: string;
  abbreviations: string;
  boards: string;
  referralSource: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  additionalContactEmails: string;
  subscriptionPlan: string;
};

function registrationDisplayFromSchoolDoc(data: Record<string, unknown>): SchoolRegistrationDisplay {
  const postal =
    (typeof data.postal_code === 'string' && data.postal_code.trim()) ||
    (typeof data.zip_code === 'string' && data.zip_code.trim()) ||
    '';

  return {
    udiseCode: typeof data.udise_code === 'string' ? data.udise_code.trim() : '',
    abbreviations: stringListFromDoc(data, 'abbreviations'),
    boards: formatBoardsFromSchoolDoc(data),
    referralSource:
      typeof data.referral_source === 'string' ? data.referral_source.trim() : '',
    addressLine1:
      (typeof data.address_line1 === 'string' && data.address_line1.trim()) ||
      (typeof data.school_address === 'string' && data.school_address.trim()) ||
      (typeof data.address === 'string' && data.address.trim()) ||
      '',
    addressLine2: typeof data.address_line2 === 'string' ? data.address_line2.trim() : '',
    city: typeof data.city === 'string' ? data.city.trim() : '',
    state: typeof data.state === 'string' ? data.state.trim() : '',
    postalCode: postal,
    additionalContactEmails: additionalContactEmailsFromSchoolDoc(data).join(', '),
    subscriptionPlan:
      (typeof data.subscription_plan === 'string' && data.subscription_plan.trim()) ||
      (typeof data.selected_plan_id === 'string' && data.selected_plan_id.trim()) ||
      '',
  };
}

const settingsFieldSx = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: ip.cardBorder },
    '&:hover fieldset': { borderColor: '#3b82f6' },
    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
  },
  '& .MuiInputBase-input': { color: '#1E293B' },
  '& .MuiInputLabel-root': { color: '#94a3b8' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
};

const readOnlyFieldSx = {
  ...settingsFieldSx,
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: '#1E293B',
    color: '#1E293B',
  },
};

function displayOrDash(value: string): string {
  return value.trim() || '—';
}

type SettingsFieldProps = {
  label: string;
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  gridColumn?: string | { xs?: string; md?: string };
  startAdornment?: React.ReactNode;
};

const SettingsField: React.FC<SettingsFieldProps> = ({
  label,
  value,
  onChange,
  readOnly = false,
  helperText,
  multiline,
  rows,
  gridColumn,
  startAdornment,
}) => (
  <TextField
    label={label}
    value={value}
    onChange={onChange}
    fullWidth
    disabled={readOnly}
    helperText={helperText}
    multiline={multiline}
    rows={rows}
    InputProps={{
      readOnly: readOnly || undefined,
      startAdornment,
    }}
    sx={{
      ...(readOnly ? readOnlyFieldSx : settingsFieldSx),
      ...(gridColumn ? { gridColumn } : {}),
    }}
  />
);

const SchoolAdminSettingsPage: React.FC = () => {
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const dispatch = useDispatch<AppDispatch>();
  const { schoolAdmin, user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    website: '',
    verified: false,
  });
  const [registration, setRegistration] = useState<SchoolRegistrationDisplay>({
    udiseCode: '',
    abbreviations: '',
    boards: '',
    referralSource: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    additionalContactEmails: '',
    subscriptionPlan: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);

  useEffect(() => {
    if (!isSchoolAdminPreview) return;
    const { city, state, schoolName, udise_code, board, subscriptionPlan } =
      GREENFIELD_SCHOOL_DISPLAY;
    setSchoolInfo({
      name: schoolName,
      contactEmail: GREENFIELD_POC_EMAIL,
      phone: '+91 80 4000 0000',
      website: 'https://greenfield.edu.in',
      verified: true,
    });
    setRegistration({
      udiseCode: udise_code,
      abbreviations: 'GIS, Greenfield',
      boards: board,
      referralSource: 'EducationWorld',
      addressLine1: '12 Brigade Road',
      addressLine2: 'Koramangala',
      city: city ?? 'Bangalore',
      state: state ?? 'Karnataka',
      postalCode: '560034',
      additionalContactEmails: 'principal@greenfield.edu.in',
      subscriptionPlan,
    });
    setLoading(false);
  }, [isSchoolAdminPreview]);

  // Ensure schoolAdmin is loaded
  useEffect(() => {
    if (isSchoolAdminPreview) return;
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
  }, [authLoading, schoolAdmin, user, dispatch, hasTriedLoading, isSchoolAdminPreview]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (isSchoolAdminPreview) return;

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
        if (schoolDocData) {
          const docRecord = schoolDocData as Record<string, unknown>;
          setSchoolInfo({
            name: (typeof schoolDocData.school_name === 'string' && schoolDocData.school_name) || '',
            contactEmail: primaryPocEmailFromSchoolDoc(docRecord),
            phone: phoneFromSchoolDoc(docRecord),
            website: typeof schoolDocData.website === 'string' ? schoolDocData.website : '',
            verified: schoolDocData.verified === true,
          });
          setRegistration(registrationDisplayFromSchoolDoc(docRecord));
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
  }, [schoolAdmin, authLoading, hasTriedLoading, isSchoolAdminPreview]);

  const handleSchoolInfoChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolInfo({
      ...schoolInfo,
      [field]: event.target.value
    });
  };

  const handleSave = async () => {
    if (isSchoolAdminPreview) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }

    const trimmedName = schoolInfo.name.trim();
    if (!trimmedName) {
      setSaveError('School name is required.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await putSchoolProfile({
        school_name: trimmedName,
        phone: schoolInfo.phone.trim(),
        website: schoolInfo.website.trim(),
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reload original values
    window.location.reload();
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Typography variant="h6" sx={{ color: ip.heading }}>
          Loading settings...
        </Typography>
      </Box>
    );
  }

  // Show error if schoolAdmin couldn't be loaded
  if (hasTriedLoading && !schoolAdmin?.schoolId) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Unable to load school information
          </Typography>
          <Typography variant="body2">
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
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1E293B', mb: 1 }}>
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

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* School Information */}
        <Card sx={{ 
          bgcolor: '#ffffff', 
          boxShadow: 'none',
          border: `1px solid ${ip.cardBorder}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                <SchoolIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: ip.heading }}>
                  School Information
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Update display name, phone, and website. Registration details are shown below.
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

            <Divider sx={{ mb: 3, borderColor: ip.cardBorder }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <SettingsField
                label="School Name"
                value={schoolInfo.name}
                onChange={handleSchoolInfoChange('name')}
              />
              <SettingsField
                label="Primary contact email"
                value={schoolInfo.contactEmail}
                readOnly
                helperText="Used for school admin login"
                startAdornment={<EmailIcon sx={{ color: '#94a3b8', mr: 1 }} />}
              />
              <SettingsField
                label="Phone"
                value={schoolInfo.phone}
                onChange={handleSchoolInfoChange('phone')}
                helperText="POC mobile from registration"
              />
              <SettingsField
                label="Website"
                value={schoolInfo.website}
                onChange={handleSchoolInfoChange('website')}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Registration details (read-only) */}
        <Card
          sx={{
            bgcolor: '#ffffff',
            boxShadow: 'none',
            border: `1px solid ${ip.cardBorder}`,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, color: ip.heading, mb: 0.5 }}>
              Registration details
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              Information submitted when your school joined GYS. Contact{' '}
              <Box component="span" sx={{ color: ip.navy, fontWeight: 500 }}>
                globalyoungscholar@argus.ai
              </Box>{' '}
              to update these fields.
            </Typography>

            <Divider sx={{ mb: 3, borderColor: ip.cardBorder }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <SettingsField label="UDISE code" value={displayOrDash(registration.udiseCode)} readOnly />
              <SettingsField
                label="Subscription plan"
                value={displayOrDash(registration.subscriptionPlan)}
                readOnly
              />
              <SettingsField
                label="Curriculum / boards"
                value={displayOrDash(registration.boards)}
                readOnly
                gridColumn={{ xs: '1', md: '1 / -1' }}
              />
              <SettingsField
                label="School abbreviations"
                value={displayOrDash(registration.abbreviations)}
                readOnly
                gridColumn={{ xs: '1', md: '1 / -1' }}
              />
              <SettingsField
                label="How you heard about GYS"
                value={displayOrDash(registration.referralSource)}
                readOnly
                gridColumn={{ xs: '1', md: '1 / -1' }}
              />
              <SettingsField
                label="Address line 1"
                value={displayOrDash(registration.addressLine1)}
                readOnly
                gridColumn={{ xs: '1', md: '1 / -1' }}
              />
              <SettingsField
                label="Address line 2"
                value={displayOrDash(registration.addressLine2)}
                readOnly
                gridColumn={{ xs: '1', md: '1 / -1' }}
              />
              <SettingsField label="City" value={displayOrDash(registration.city)} readOnly />
              <SettingsField label="State" value={displayOrDash(registration.state)} readOnly />
              <SettingsField
                label="PIN / postal code"
                value={displayOrDash(registration.postalCode)}
                readOnly
              />
              <SettingsField
                label="Additional contact emails"
                value={displayOrDash(registration.additionalContactEmails)}
                readOnly
                multiline
                rows={2}
                gridColumn={{ xs: '1', md: '1 / -1' }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card sx={{ 
          bgcolor: '#ffffff', 
          boxShadow: 'none',
          border: `1px solid ${ip.cardBorder}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: '#ef4444', mr: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: ip.heading }}>
                  Security Settings
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Manage your account security and privacy
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3, borderColor: ip.cardBorder }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: `1px solid ${ip.cardBorder}` }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                  Two-Factor Authentication
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Enhanced security feature coming soon
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: `1px solid ${ip.cardBorder}` }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                  Session Management
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Manage active sessions and login history
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: `1px solid ${ip.cardBorder}` }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                  Reports & analytics alerts
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  New institutional reports and analytics updates appear under Notifications on your Overview dashboard
                </Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card sx={{ 
          bgcolor: '#ffffff', 
          boxShadow: 'none',
          border: `1px solid ${ip.cardBorder}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                sx={{ 
                  borderColor: ip.cardBorder, 
                  color: ip.subtext,
                  '&:hover': {
                    borderColor: ip.navy,
                    bgcolor: ip.cardMutedBg
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ 
                  bgcolor: ip.navy, 
                  '&:hover': { bgcolor: '#0c356f' } 
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SchoolAdminSettingsPage;
