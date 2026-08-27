import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  InputAdornment,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  Save,
  Edit,
  Calendar,
  MapPin,
  Languages,
  Target,
  Megaphone,
  Coins,
} from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { updateStudent } from '../../db/studentCollection';
import { useSchoolDetails, useStudent } from '../../query/hooks';
import { queryClient } from '../../query/queryClient';
import { queryKeys } from '../../query/queryKeys';
import { studentSectionHeadingSx } from '../../styles/studentTypography';
import { toIndiaMobileNationalDigits, withIndiaCountryCode } from '../../utils/indiaMobile';
import { readGamificationFromStudent } from '../../utils/gamification';
import { profileCompletionFromForm } from '../../utils/profileCompletion';
import { useToast } from '../ui/use-toast';
import ProfileCompleteCelebration from '../gamification/ProfileCompleteCelebration';

const HEARD_FROM_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'SCHOOL', label: 'My school' },
  { value: 'FRIEND_FAMILY', label: 'Friend or family' },
  { value: 'ACCESS_USA', label: 'Access USA' },
  { value: 'EDUCATIONWORLD', label: 'EducationWorld' },
  { value: 'SOCIAL_MEDIA', label: 'Social media' },
  { value: 'OTHER', label: 'Other' },
];

/** Filled values stay bright; placeholders stay muted - including when fields are disabled. */
const profileFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    fontSize: '1rem',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
    '&.Mui-disabled': {
      color: '#fff',
      WebkitTextFillColor: '#fff',
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.22)' },
    },
  },
  '& .MuiInputBase-input': {
    color: '#fff',
    WebkitTextFillColor: '#fff',
    '&.Mui-disabled': {
      color: '#fff',
      WebkitTextFillColor: '#fff',
      opacity: 1,
    },
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.38)',
      WebkitTextFillColor: 'rgba(255, 255, 255, 0.38)',
      opacity: 1,
      fontStyle: 'italic',
    },
  },
  '& .MuiSelect-select.Mui-disabled': {
    color: '#fff',
    WebkitTextFillColor: '#fff',
    opacity: 1,
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1rem',
    fontWeight: 500,
    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.9)' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
  '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' },
};

const profileEmptySelectSx = {
  color: 'rgba(255, 255, 255, 0.38)',
  WebkitTextFillColor: 'rgba(255, 255, 255, 0.38)',
  fontStyle: 'italic',
} as const;

const ProfileSettings: React.FC = () => {
  const currentUser = auth.currentUser;
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationCoins, setCelebrationCoins] = useState(0);

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    school: '',
    grade: '',
    dateOfBirth: '',
    cityState: '',
    homeLanguage: '',
    aspiration: '',
    heardFrom: '',
    about: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    phoneNumber: '',
    isPublic: true,
    emailNotifications: true,
    examReminders: true
  });
  
  const [originalGrade, setOriginalGrade] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');
  const [profileHydrated, setProfileHydrated] = useState(false);

  const { data: userData } = useStudent(currentUser?.uid, Boolean(currentUser?.uid));
  const argusCoins = readGamificationFromStudent(userData).argus_coins;
  const profileCompletion = useMemo(() => profileCompletionFromForm(formData), [formData]);
  const schoolId =
    typeof userData?.school_id === 'string' && userData.school_id && userData.school_id !== 'not-listed'
      ? userData.school_id
      : undefined;
  const { data: schoolData } = useSchoolDetails(schoolId, Boolean(schoolId));

  useEffect(() => {
    if (!userData || profileHydrated) return;
    setOriginalGrade(userData.grade || null);
    setFormData((prev) => ({
      ...prev,
      displayName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      school: userData.school_id || '',
      grade: userData.grade ? `Class ${userData.grade}` : '',
      dateOfBirth: userData.date_of_birth || '',
      cityState: userData.city_state || '',
      homeLanguage: userData.home_language || '',
      aspiration: userData.aspiration || '',
      heardFrom: userData.heard_from || '',
      about: userData.about_me || '',
      parentName: userData.parent_name || '',
      parentEmail: userData.parent_email || '',
      parentPhone: toIndiaMobileNationalDigits(userData.parent_phone || ''),
      phoneNumber: toIndiaMobileNationalDigits(userData.phone_number || ''),
    }));
    setProfileHydrated(true);
  }, [userData, profileHydrated]);

  useEffect(() => {
    if (typeof userData?.signup_school_name === 'string' && userData.signup_school_name.trim()) {
      setSchoolName(userData.signup_school_name.trim());
      return;
    }
    if (!schoolId) {
      setSchoolName('');
      return;
    }
    if (typeof schoolData === 'string') {
      setSchoolName(schoolData);
    } else if (schoolData && typeof schoolData === 'object' && 'school_name' in schoolData) {
      setSchoolName(String((schoolData as { school_name?: string }).school_name ?? schoolId));
    } else {
      setSchoolName(schoolId);
    }
  }, [schoolData, schoolId, userData?.signup_school_name]);

  // Handle grade change
  const handleGradeChange = (newGrade: number) => {
    setFormData(prev => ({
      ...prev,
      grade: `Class ${newGrade}`
    }));
  };



  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      if (!currentUser?.uid) return;

      const updates: Record<string, unknown> = {};
      const [firstName, ...lastNameParts] = formData.displayName.trim().split(/\s+/).filter(Boolean);
      if (firstName) {
        updates.first_name = firstName;
        updates.last_name = lastNameParts.join(' ');
      }
      updates.phone_number = withIndiaCountryCode(formData.phoneNumber);
      updates.date_of_birth = formData.dateOfBirth;
      updates.city_state = formData.cityState.trim();
      updates.home_language = formData.homeLanguage.trim();
      updates.aspiration = formData.aspiration.trim();
      updates.heard_from = formData.heardFrom;
      updates.parent_name = formData.parentName.trim();
      updates.parent_email = formData.parentEmail.trim();
      updates.parent_phone = withIndiaCountryCode(formData.parentPhone);
      if (formData.about !== undefined) updates.about_me = formData.about;

      if (originalGrade !== null) {
        const currentGrade = parseInt(formData.grade.replace(/\D/g, ''), 10);
        if (Number.isFinite(currentGrade) && currentGrade !== originalGrade) {
          updates.grade = currentGrade;
        }
      }

      let coinsAwarded = 0;
      if (Object.keys(updates).length > 0) {
        const result = await updateStudent(currentUser.uid, updates as Parameters<typeof updateStudent>[1]);
        coinsAwarded =
          typeof result.profile_completion_coins_awarded === 'number'
            ? result.profile_completion_coins_awarded
            : 0;
        if (typeof updates.grade === 'number') {
          setOriginalGrade(updates.grade);
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.student(currentUser.uid) });
      }

      const hitHundred = profileCompletionFromForm(formData).complete;
      const message =
        coinsAwarded > 0
          ? `Profile complete! You earned ${coinsAwarded} Argus Coins.`
          : hitHundred
            ? 'Profile 100% complete - nice work!'
            : 'Profile updated successfully!';

      setSuccessMessage(message);
      setIsEditing(false);

      if (coinsAwarded > 0) {
        setCelebrationCoins(coinsAwarded);
        setCelebrationOpen(true);
      } else {
        toast({
          title: 'Profile saved',
          description: message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not save profile',
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Box>
      <ProfileCompleteCelebration
        open={celebrationOpen}
        coinsAwarded={celebrationCoins}
        onClose={() => setCelebrationOpen(false)}
      />

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{ 
          mb: 3,
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          },
          '& .MuiAlert-action .MuiIconButton-root': {
            color: 'white',
          },
        }}
        >
          {successMessage}
        </Alert>
      )}

      <Card
        sx={{
          mb: 3,
          background: profileCompletion.complete
            ? 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(59,130,246,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(234,179,8,0.14) 0%, rgba(16,185,129,0.08) 100%)',
          border: profileCompletion.complete
            ? '1px solid rgba(16,185,129,0.35)'
            : '1px solid rgba(234,179,8,0.35)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 1.25,
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>
              Profile {profileCompletion.percent}% complete
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                bgcolor: 'rgba(234,179,8,0.18)',
                border: '1px solid rgba(234,179,8,0.35)',
                color: '#fde68a',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <Coins size={15} />
              {profileCompletion.complete
                ? '100% reward unlocked'
                : `+${profileCompletion.reward_coins} coins at 100%`}
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={profileCompletion.percent}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.12)',
              mb: 1,
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                background: profileCompletion.complete
                  ? 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                  : 'linear-gradient(90deg, #eab308 0%, #10b981 100%)',
              },
            }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
            {profileCompletion.complete
              ? 'Nice work - your profile is fully complete! Nice work!'
              : `Fill in the remaining fields below to earn ${profileCompletion.reward_coins} Argus Coins (${profileCompletion.filled}/${profileCompletion.total} done).`}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Profile Form */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 3,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ ...studentSectionHeadingSx, mb: 3 }}>
                Personal Information
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box>
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
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
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
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="WhatsApp Number"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', toIndiaMobileNationalDigits(e.target.value))}
                    disabled={!isEditing}
                    placeholder={isEditing ? '10-digit mobile' : 'Not set'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ gap: 0.75 }}>
                          <Phone size={20} color="rgba(255, 255, 255, 0.7)" />
                          <Typography component="span" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                            +91
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Argus Coins"
                    value={argusCoins.toLocaleString()}
                    disabled
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Coins size={20} color="#fde68a" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Earned from exams, practice, and daily challenges. Redeem in the Rewards Shop."
                    FormHelperTextProps={{
                      sx: { color: 'rgba(255, 255, 255, 0.55)', mt: 1 },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fde68a',
                        fontSize: '1rem',
                        fontWeight: 700,
                        '& fieldset': { borderColor: 'rgba(234, 179, 8, 0.45)' },
                        '&.Mui-disabled': {
                          color: '#fde68a',
                          WebkitTextFillColor: '#fde68a',
                          '& fieldset': { borderColor: 'rgba(234, 179, 8, 0.35)' },
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#fde68a',
                        WebkitTextFillColor: '#fde68a',
                        '&.Mui-disabled': {
                          color: '#fde68a',
                          WebkitTextFillColor: '#fde68a',
                          opacity: 1,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.9)' },
                      },
                    }}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Calendar size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="City / State"
                    value={formData.cityState}
                    onChange={(e) => handleInputChange('cityState', e.target.value)}
                    disabled={!isEditing}
                    placeholder={isEditing ? 'e.g. Bengaluru, Karnataka' : 'Not set'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapPin size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="School"
                    value={schoolName || formData.school || 'No school assigned'}
                    disabled={true}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <School size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Class"
                    value={formData.grade}
                    onChange={(e) => handleGradeChange(parseInt(e.target.value.replace(/\D/g, ''), 10))}
                    disabled={!isEditing}
                    select
                    SelectProps={{
                      native: false,
                    }}
                    sx={profileFieldSx}
                  >
                    <MenuItem value="Class 6">Class 6</MenuItem>
                    <MenuItem value="Class 7">Class 7</MenuItem>
                    <MenuItem value="Class 8">Class 8</MenuItem>
                    <MenuItem value="Class 9">Class 9</MenuItem>
                    <MenuItem value="Class 10">Class 10</MenuItem>
                    <MenuItem value="Class 11">Class 11</MenuItem>
                    <MenuItem value="Class 12">Class 12</MenuItem>
                  </TextField>
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Language Spoken at Home"
                    value={formData.homeLanguage}
                    onChange={(e) => handleInputChange('homeLanguage', e.target.value)}
                    disabled={!isEditing}
                    placeholder={isEditing ? 'e.g. English, Hindi, Tamil' : 'Not set'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Languages size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Educational Aspiration"
                    value={formData.aspiration}
                    onChange={(e) => handleInputChange('aspiration', e.target.value)}
                    disabled={!isEditing}
                    placeholder={isEditing ? 'e.g. Engineering, medicine, design' : 'Not set'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Target size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="How Did You Hear About GYS?"
                    value={formData.heardFrom}
                    onChange={(e) => handleInputChange('heardFrom', e.target.value)}
                    disabled={!isEditing}
                    select
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        const value = String(selected ?? '');
                        if (!value) {
                          return (
                            <Box component="span" sx={profileEmptySelectSx}>
                              {isEditing ? 'Select' : 'Not set'}
                            </Box>
                          );
                        }
                        return HEARD_FROM_OPTIONS.find((o) => o.value === value)?.label ?? value;
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Megaphone size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  >
                    {HEARD_FROM_OPTIONS.map((option) => (
                      <MenuItem key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* Parent Information Section */}
                <Box>
                  <TextField
                    fullWidth
                    label="Parent Name"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                    disabled={!isEditing}
                    placeholder={isEditing ? "Parent's full name" : 'Not set'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Parent Email"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    disabled={!isEditing}
                    placeholder={isEditing ? 'parent@email.com' : 'Not set'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Parent Phone"
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => handleInputChange('parentPhone', toIndiaMobileNationalDigits(e.target.value))}
                    disabled={!isEditing}
                    placeholder={isEditing ? '10-digit mobile' : 'Not set'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ gap: 0.75 }}>
                          <Phone size={20} color="rgba(255, 255, 255, 0.7)" />
                          <Typography component="span" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                            +91
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                    sx={profileFieldSx}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <TextField
                    fullWidth
                    label="About Me"
                    value={formData.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    disabled={!isEditing}
                    multiline
                    rows={4}
                    placeholder={isEditing ? 'Tell us about yourself…' : 'Not set'}
                    sx={profileFieldSx}
                  />
                </Box>
              </Box>



              {/* Edit Profile Button */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 2,
                mt: 3,
                pt: 3,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{
                      backgroundColor: '#10b981',
                      '&:hover': { backgroundColor: '#059669' },
                      px: 3,
                      py: 1.5,
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
                <Button
                  variant={isEditing ? "outlined" : "contained"}
                  startIcon={isEditing ? <Edit size={16} /> : <Edit size={16} />}
                  onClick={() => setIsEditing(!isEditing)}
                  sx={{
                    backgroundColor: isEditing ? 'transparent' : '#8b5cf6',
                    borderColor: '#8b5cf6',
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: isEditing ? 'rgba(139, 92, 246, 0.1)' : '#7c3aed',
                    }
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileSettings;
