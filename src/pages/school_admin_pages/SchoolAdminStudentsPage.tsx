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
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';

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

const SchoolAdminStudentsPage: React.FC = () => {
  // Mock school admin data for testing
  const mockSchoolAdmin = {
    email: 'srishti2k1@gmail.com',
    schoolId: '018WuXO6zOabXh4ZXmcq',
    role: 'schooladmin'
  };
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    // TODO: Fetch actual students from backend based on schoolAdmin.schoolId
    // For now, using mock data
    const mockStudents: Student[] = [
      {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@school.com',
        grade: 10,
        status: 'active',
        lastExamDate: '2024-01-15',
        averageScore: 85.5,
        examsCompleted: 3,
        qualificationStatus: 'qualified'
      },
      {
        id: '2',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@school.com',
        grade: 11,
        status: 'active',
        lastExamDate: '2024-01-10',
        averageScore: 78.2,
        examsCompleted: 2,
        qualificationStatus: 'pending'
      },
      {
        id: '3',
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma.davis@school.com',
        grade: 9,
        status: 'active',
        lastExamDate: '2024-01-12',
        averageScore: 92.1,
        examsCompleted: 4,
        qualificationStatus: 'qualified'
      },
      {
        id: '4',
        firstName: 'Alex',
        lastName: 'Thompson',
        email: 'alex.thompson@school.com',
        grade: 10,
        status: 'inactive',
        lastExamDate: '2023-12-20',
        averageScore: 65.8,
        examsCompleted: 1,
        qualificationStatus: 'not_qualified'
      },
      {
        id: '5',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@school.com',
        grade: 11,
        status: 'active',
        lastExamDate: '2024-01-14',
        averageScore: 88.9,
        examsCompleted: 3,
        qualificationStatus: 'qualified'
      }
    ];
    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedStudent(null);
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

      {/* Search and Actions */}
      <Card sx={{ 
        bgcolor: '#1e293b', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
        mb: 3
      }}>
        <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            <Box sx={{ 
                width: { xs: '100%', sm: '50%', md: '50%' } 
            }}>
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
                  },
                }}
              />
            </Box>
            <Box sx={{ 
                width: { xs: '100%', sm: '50%', md: '50%' } 
            }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  sx={{ borderColor: '#334155', color: '#94a3b8' }}
                >
                  Filter
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{ borderColor: '#334155', color: '#94a3b8' }}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Add Student
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card sx={{ 
        bgcolor: '#1e293b', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155'
      }}>
        <CardContent>
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
                {filteredStudents.map((student) => (
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
                        Grade {student.grade}
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
                ))}
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
                      Grade {selectedStudent.grade}
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
