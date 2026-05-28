import React, { useState, useEffect } from 'react';
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
  Megaphone
} from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { getStudent, updateStudent } from '../../db/studentCollection';
import { getSchoolDetails } from '../../db/schoolCollection';
import { studentSectionHeadingSx } from '../../styles/studentTypography';
import { toIndiaMobileNationalDigits, withIndiaCountryCode } from '../../utils/indiaMobile';

const HEARD_FROM_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'SCHOOL', label: 'My school' },
  { value: 'FRIEND_FAMILY', label: 'Friend or family' },
  { value: 'ACCESS_USA', label: 'Access USA' },
  { value: 'EDUCATIONWORLD', label: 'EducationWorld' },
  { value: 'SOCIAL_MEDIA', label: 'Social media' },
  { value: 'OTHER', label: 'Other' },
];

const ProfileSettings: React.FC = () => {
  const currentUser = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const userData = await getStudent(currentUser.uid);
          setOriginalGrade(userData.grade || null);
          setFormData(prev => ({
            ...prev,
            displayName: (userData.first_name || '') + ' ' + (userData.last_name || ''),
            school: userData.school_id || '', // Using school_id for now
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

          // Fetch school name if we have a school_id
          if (userData.school_id) {
            try {
              const schoolData = await getSchoolDetails(userData.school_id);
              
              if (schoolData && typeof schoolData === 'string') {
                // API returns the school name directly as a string
                setSchoolName(schoolData);
              } else if (schoolData && schoolData.school_name) {
                // Fallback: API returns object with school_name property
                setSchoolName(schoolData.school_name);
              } else {
                setSchoolName(userData.school_id);
              }
            } catch (error) {
              setSchoolName(userData.school_id || '');
            }
          } else {
            setSchoolName('');
          }
        } catch (error) {
        }
      }
    };

    fetchUserData();
  }, [currentUser?.uid]);

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
    try {
      // Save grade changes if grade was modified
      if (currentUser?.uid && originalGrade !== null) {
        const currentGrade = parseInt(formData.grade.replace(/\D/g, ''), 10);
        if (currentGrade !== originalGrade) {
          await updateStudent(currentUser.uid, { grade: currentGrade });
          setOriginalGrade(currentGrade);
        }
      }

      // Save parent information and about me changes
      if (currentUser?.uid) {
        const updates: any = {};
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
        
        if (Object.keys(updates).length > 0) {
          await updateStudent(currentUser.uid, updates);
        }
      }
      
      // Simulate API call for other fields
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Box>
      {showSuccess && (
        <Alert severity="success" sx={{ 
          mb: 3,
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          }
        }}>
          Profile updated successfully!
        </Alert>
      )}

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
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '1rem',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      },
                      '& .MuiInputLabel-root': { 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '1rem',
                        fontWeight: 500
                      },
                    }}
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
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
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
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="City / State"
                    value={formData.cityState}
                    onChange={(e) => handleInputChange('cityState', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Bengaluru, Karnataka"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapPin size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    placeholder="English, Hindi, Tamil..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Languages size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Educational Aspiration"
                    value={formData.aspiration}
                    onChange={(e) => handleInputChange('aspiration', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Engineering, medicine, design, undecided..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Target size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Megaphone size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={20} color="rgba(255, 255, 255, 0.7)" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
                  />
                </Box>

                <Box>
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
                    sx={{
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
                        fontWeight: 500
                      },
                                              '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
                    placeholder="Tell us about yourself..."
                    sx={{
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
                        fontWeight: 500
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                    }}
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
