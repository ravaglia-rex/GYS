import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: number;
  status: 'active' | 'inactive' | 'completed';
  lastExamDate?: string;
  averageScore?: number;
  examsCompleted: number;
  qualificationStatus: 'qualified' | 'not_qualified' | 'pending';
}

const PHASE2_FORM_IDS = ['mOGkN8', 'mVy95J'];

const SchoolAdminStudentsPage: React.FC = () => {
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!schoolAdmin?.schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const schoolId = schoolAdmin.schoolId;

        // Fetch all students for this school
        const studentsQuery = query(
          collection(db, 'students'),
          where('school_id', '==', schoolId)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        const studentsData: Student[] = [];

        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          const uid = studentDoc.id;

          // Extract name
          const firstName = studentData.first_name || '';
          const lastName = studentData.last_name || '';
          const email = studentData.email || '';
          
          // Extract grade safely
          let grade = 0;
          if ('grade' in studentData && typeof studentData['grade'] === 'number') {
            grade = studentData['grade'] as number;
          } else if ('class' in studentData && typeof studentData['class'] === 'number') {
            grade = studentData['class'] as number;
          }

          // Fetch exam submissions
          const submissionsQuery = query(
            collection(db, 'student_submission_mappings'),
            where('student_uid', '==', uid)
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const examsCompleted = submissionsSnapshot.size;

          // Calculate average score from phase 2 responses
          let totalScore = 0;
          let scoreCount = 0;
          let lastExamDate: string | undefined;

          for (const submissionDoc of submissionsSnapshot.docs) {
            const submissionData = submissionDoc.data();
            const submissionId = submissionData.submission_id;
            
            if (submissionId) {
              const responsesQuery = query(
                collection(db, 'phase_2_exam_responses'),
                where('submissionId', '==', submissionId)
              );
              const responsesSnapshot = await getDocs(responsesQuery);
              
              responsesSnapshot.forEach(responseDoc => {
                const responseData = responseDoc.data();
                if (responseData.overallTotal) {
                  totalScore += responseData.overallTotal;
                  scoreCount++;
                }
                if (responseData.createdAt) {
                  const date = responseData.createdAt.seconds 
                    ? new Date(responseData.createdAt.seconds * 1000).toISOString()
                    : new Date(responseData.createdAt).toISOString();
                  if (!lastExamDate || date > lastExamDate) {
                    lastExamDate = date;
                  }
                }
              });
            }

            // Also check submission_time
            if (submissionData.submission_time) {
              const date = submissionData.submission_time.seconds
                ? new Date(submissionData.submission_time.seconds * 1000).toISOString()
                : new Date(submissionData.submission_time).toISOString();
              if (!lastExamDate || date > lastExamDate) {
                lastExamDate = date;
              }
            }
          }

          const averageScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : undefined;

          // Check qualification status
          const examMappingsQuery = query(
            collection(db, 'student_exam_mappings'),
            where('uid', '==', uid)
          );
          const examMappingsSnapshot = await getDocs(examMappingsQuery);
          
          let qualificationStatus: 'qualified' | 'not_qualified' | 'pending' = 'not_qualified';
          examMappingsSnapshot.forEach(doc => {
            const data = doc.data();
            if (PHASE2_FORM_IDS.includes(data.form_link)) {
              qualificationStatus = 'qualified';
            }
          });

          // Determine status based on activity
          const status: 'active' | 'inactive' | 'completed' = 
            examsCompleted > 0 ? 'active' : 'inactive';

          studentsData.push({
            id: uid,
            firstName,
            lastName,
            email,
            grade,
            status,
            lastExamDate,
            averageScore,
            examsCompleted,
            qualificationStatus
          });
        }

        setStudents(studentsData);
        setFilteredStudents(studentsData);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [schoolAdmin]);

  useEffect(() => {
    let filtered = students.filter(student => {
      // Search filter
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Grade filter
      const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

      // Qualification filter
      const matchesQualification = qualificationFilter === 'all' || student.qualificationStatus === qualificationFilter;

      return matchesSearch && matchesGrade && matchesStatus && matchesQualification;
    });
    
    setFilteredStudents(filtered);
  }, [searchTerm, students, gradeFilter, statusFilter, qualificationFilter]);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setGradeFilter('all');
    setStatusFilter('all');
    setQualificationFilter('all');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'completed':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getQualificationColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return '#10b981';
      case 'not_qualified':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getQualificationLabel = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'Qualified';
      case 'not_qualified':
        return 'Not Qualified';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  // Get unique grades for filter dropdown
  const uniqueGrades = Array.from(new Set(students.map(s => s.grade).filter(g => g > 0))).sort((a, b) => a - b);

  const hasActiveFilters = searchTerm || gradeFilter !== 'all' || statusFilter !== 'all' || qualificationFilter !== 'all';

  if (loading) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Typography variant="h6" sx={{ color: '#ffffff' }}>
          Loading students...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
          Students
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8' }}>
          Manage and view all students from your school
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ 
        bgcolor: '#1e293b', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
        mb: 3
      }}>
        <CardContent>
          {/* Search Box and Filter Button - Side by Side */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: showFilters ? 2 : 0 }}>
            <Box sx={{ width: { xs: '100%', sm: '80%', md: '60%' } }}>
              <TextField
                fullWidth
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
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
                }}
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                borderColor: '#334155', 
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                }
              }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>

          {/* Filter Options */}
          {showFilters && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              justifyContent: 'center',
              pt: 2,
              borderTop: '1px solid #334155'
            }}>
              {/* Grade Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: '150px' } }}>
                <InputLabel sx={{ color: '#94a3b8' }}>Grade</InputLabel>
                <Select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value as number | 'all')}
                  input={<OutlinedInput label="Grade" sx={{ color: '#ffffff' }} />}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#334155',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#94a3b8',
                    },
                  }}
                >
                  <MenuItem value="all">All Grades</MenuItem>
                  {uniqueGrades.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: '150px' } }}>
                <InputLabel sx={{ color: '#94a3b8' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  input={<OutlinedInput label="Status" sx={{ color: '#ffffff' }} />}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#334155',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#94a3b8',
                    },
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>

              {/* Qualification Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: '150px' } }}>
                <InputLabel sx={{ color: '#94a3b8' }}>Qualification</InputLabel>
                <Select
                  value={qualificationFilter}
                  onChange={(e) => setQualificationFilter(e.target.value)}
                  input={<OutlinedInput label="Qualification" sx={{ color: '#ffffff' }} />}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#334155',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#94a3b8',
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="not_qualified">Not Qualified</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ 
                    borderColor: '#ef4444', 
                    color: '#ef4444',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: '#dc2626',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    }
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && !showFilters && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
              {searchTerm && (
                <Chip
                  label={`Search: "${searchTerm}"`}
                  onDelete={() => setSearchTerm('')}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#ffffff' }}
                />
              )}
              {gradeFilter !== 'all' && (
                <Chip
                  label={`Grade: ${gradeFilter}`}
                  onDelete={() => setGradeFilter('all')}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#ffffff' }}
                />
              )}
              {statusFilter !== 'all' && (
                <Chip
                  label={`Status: ${statusFilter}`}
                  onDelete={() => setStatusFilter('all')}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#ffffff' }}
                />
              )}
              {qualificationFilter !== 'all' && (
                <Chip
                  label={`Qualification: ${qualificationFilter}`}
                  onDelete={() => setQualificationFilter('all')}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#ffffff' }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card sx={{ 
        bgcolor: '#1e293b', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155'
      }}>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Showing {filteredStudents.length} of {students.length} students
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#334155' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Grade</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Exams Completed</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Average Score</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Qualification</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Last Exam</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        No students found matching your filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} sx={{ '&:hover': { bgcolor: '#475569' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: '#3b82f6', width: 40, height: 40 }}>
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                              {student.firstName} {student.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {student.grade > 0 ? `Grade ${student.grade}` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(student.status),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {student.examsCompleted}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {student.averageScore ? `${student.averageScore}%` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getQualificationLabel(student.qualificationStatus)}
                          size="small"
                          sx={{
                            bgcolor: getQualificationColor(student.qualificationStatus),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {student.lastExamDate ? new Date(student.lastExamDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewStudent(student)}
                            sx={{ color: '#3b82f6' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: '#94a3b8' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#334155', borderBottom: '1px solid #475569' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: '#3b82f6', width: 48, height: 48 }}>
              {selectedStudent ? `${selectedStudent.firstName.charAt(0)}${selectedStudent.lastName.charAt(0)}` : ''}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {selectedStudent?.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#1e293b' }}>
          {selectedStudent && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ 
                  width: { xs: '100%', sm: '50%', md: '25%' } 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 2 }}>
                  Basic Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                      Grade
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {selectedStudent.grade > 0 ? `Grade ${selectedStudent.grade}` : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                      Status
                    </Typography>
                    <Chip
                      label={selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(selectedStudent.status),
                        color: 'white'
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                      Qualification Status
                    </Typography>
                    <Chip
                      label={getQualificationLabel(selectedStudent.qualificationStatus)}
                      size="small"
                      sx={{
                        bgcolor: getQualificationColor(selectedStudent.qualificationStatus),
                        color: 'white'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ 
                  width: { xs: '100%', sm: '50%', md: '25%' } 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 2 }}>
                  Performance
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                      Exams Completed
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {selectedStudent.examsCompleted}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                      Average Score
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {selectedStudent.averageScore ? `${selectedStudent.averageScore}%` : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                      Last Exam Date
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {selectedStudent.lastExamDate ? new Date(selectedStudent.lastExamDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#334155', borderTop: '1px solid #475569' }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Edit Student
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchoolAdminStudentsPage;
export { SchoolAdminStudentsPage };
