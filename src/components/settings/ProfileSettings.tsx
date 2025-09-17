import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Avatar,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  School, 
  Calendar,
  Camera,
  Save,
  Edit
} from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { getStudent, updateStudent } from '../../db/studentCollection';
import { getSchoolDetails } from '../../db/schoolCollection';

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
            grade: userData.grade ? `${userData.grade}${getGradeSuffix(userData.grade)} Grade` : '',
            dateOfBirth: userData.dateOfBirth || '',
            about: userData.about_me || '',
            parentName: userData.parent_name || '',
            parentEmail: userData.parent_email || '',
            parentPhone: userData.parent_phone || '',
            phoneNumber: userData.phone_number || '',
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

  // Helper function to get grade suffix
  const getGradeSuffix = (grade: number): string => {
    if (grade >= 11 && grade <= 13) return 'th';
    if (grade % 10 === 1) return 'st';
    if (grade % 10 === 2) return 'nd';
    if (grade % 10 === 3) return 'rd';
    return 'th';
  };

  // Handle grade change
  const handleGradeChange = (newGrade: number) => {
    setFormData(prev => ({
      ...prev,
      grade: `${newGrade}${getGradeSuffix(newGrade)} Grade`
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
        const currentGrade = parseInt(formData.grade.split(' ')[0]);
        if (currentGrade !== originalGrade) {
          await updateStudent(currentUser.uid, { grade: currentGrade });
          setOriginalGrade(currentGrade);
        }
      }

      // Save parent information and about me changes
      if (currentUser?.uid) {
        const updates: any = {};
        if (formData.parentName) updates.parent_name = formData.parentName;
        if (formData.parentEmail) updates.parent_email = formData.parentEmail;
        if (formData.parentPhone) updates.parent_phone = formData.parentPhone;
        if (formData.phoneNumber) updates.phone_number = formData.phoneNumber;
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

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle avatar upload logic here
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
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 3, fontSize: '1.4rem' }}>
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
                    label="Grade/Class"
                    value={formData.grade}
                    onChange={(e) => handleGradeChange(parseInt(e.target.value.split(' ')[0]))}
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
                    <MenuItem value="6th Grade">6th Grade</MenuItem>
                    <MenuItem value="7th Grade">7th Grade</MenuItem>
                    <MenuItem value="8th Grade">8th Grade</MenuItem>
                    <MenuItem value="9th Grade">9th Grade</MenuItem>
                    <MenuItem value="10th Grade">10th Grade</MenuItem>
                    <MenuItem value="11th Grade">11th Grade</MenuItem>
                    <MenuItem value="12th Grade">12th Grade</MenuItem>
                  </TextField>
                </Box>

                {/* Date of Birth field - commented out for later use
                <Box>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
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
                */}

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
