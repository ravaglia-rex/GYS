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
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { getSchoolQualificationBySchool } from '../../db/schoolAdminCollection';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: number;
  lastExamDate?: string;
  examsCompleted: number;
  qualificationStatus: 'qualified' | 'not_qualified' | 'pending';
}

const PHASE2_FORM_IDS = ['mOGkN8', 'mVy95J'];

type ExamsCompletedFilter = 'all' | '0' | '1' | '2' | '3_plus';
type SortField = 'firstName' | 'lastName' | 'grade' | 'examsCompleted' | 'latestExam';
type SortDirection = 'asc' | 'desc';

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
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [examsCompletedFilter, setExamsCompletedFilter] = useState<ExamsCompletedFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>('firstName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

        const studentDocs = studentsSnapshot.docs;
        const MAX_STUDENTS_WITH_EXAM_DETAILS = 50;

        // Qualification status for *all* students (computed server-side with Admin SDK)
        let qualificationByUid: Record<string, Student['qualificationStatus']> = {};
        try {
          const q = await getSchoolQualificationBySchool(String(schoolId ?? '').trim());
          qualificationByUid = (q?.byStudent as any) || {};
        } catch {
          qualificationByUid = {};
        }

        // Base student info from all docs (no extra queries)
        const baseStudents = studentDocs.map(doc => {
          const data = doc.data();
          const uid = doc.id;

          const firstName = data.first_name || '';
          const lastName = data.last_name || '';

          let grade = 0;
          if ('grade' in data && typeof data['grade'] === 'number') {
            grade = data['grade'] as number;
          } else if ('class' in data && typeof data['class'] === 'number') {
            grade = data['class'] as number;
          }

          return {
            id: uid,
            firstName,
            lastName,
            email: '',
            grade,
          };
        });

        // Limit heavy exam lookups to a subset of students to keep the page responsive
        const docsForDetails = studentDocs.slice(0, MAX_STUDENTS_WITH_EXAM_DETAILS);
        const uidsForDetails = docsForDetails.map(d => d.id);

        // Fetch emails for sampled students in parallel (student_email_mappings/{uid} -> { email })
        const emailDocs = await Promise.all(
          uidsForDetails.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, 'student_email_mappings', uid));
              return { uid, email: (snap.exists() ? (snap.data() as any)?.email : '') || '' };
            } catch {
              return { uid, email: '' };
            }
          })
        );
        const emailByUid: Record<string, string> = {};
        emailDocs.forEach(({ uid, email }) => {
          if (email) emailByUid[uid] = email;
        });

        // Fetch submissions in parallel for sampled students
        const submissionsSnapshots = await Promise.all(
          uidsForDetails.map(uid =>
            getDocs(
              query(
                collection(db, 'student_submission_mappings'),
                where('student_uid', '==', uid)
              )
            )
          )
        );

        const submissionsByUid: Record<string, any[]> = {};
        const submissionIds: string[] = [];

        submissionsSnapshots.forEach((snap, index) => {
          const uid = uidsForDetails[index];
          submissionsByUid[uid] = [];
          snap.forEach(subDoc => {
            const subData = subDoc.data();
            submissionsByUid[uid].push(subData);
            if (subData.submission_id) {
              submissionIds.push(subData.submission_id);
            }
          });
        });

        // Fetch phase 2 responses in parallel, once per unique submissionId
        const uniqueSubmissionIds = Array.from(new Set(submissionIds));
        const phase2Snapshots = await Promise.all(
          uniqueSubmissionIds.map(subId =>
            getDocs(
              query(
                collection(db, 'phase_2_exam_responses'),
                where('submissionId', '==', subId)
              )
            )
          )
        );

        const responsesBySubmissionId: Record<string, any[]> = {};
        phase2Snapshots.forEach((snap, index) => {
          const subId = uniqueSubmissionIds[index];
          responsesBySubmissionId[subId] = [];
          snap.forEach(respDoc => {
            responsesBySubmissionId[subId].push(respDoc.data());
          });
        });

        // Build final students array with metrics
        const studentsData: Student[] = baseStudents.map(base => {
          const submissions = submissionsByUid[base.id] || [];

          let examsCompleted = submissions.length;
          let lastExamDate: string | undefined;

          submissions.forEach(sub => {
            const submissionId = sub.submission_id;

            // Phase 2 responses for this submission
            if (submissionId && responsesBySubmissionId[submissionId]) {
              responsesBySubmissionId[submissionId].forEach(resp => {
                if (resp.createdAt) {
                  const date =
                    resp.createdAt.seconds
                      ? new Date(resp.createdAt.seconds * 1000).toISOString()
                      : new Date(resp.createdAt).toISOString();
                  if (!lastExamDate || date > lastExamDate) {
                    lastExamDate = date;
                  }
                }
              });
            }

            // Also check submission_time on the mapping
            if (sub.submission_time) {
              const date =
                sub.submission_time.seconds
                  ? new Date(sub.submission_time.seconds * 1000).toISOString()
                  : new Date(sub.submission_time).toISOString();
              if (!lastExamDate || date > lastExamDate) {
                lastExamDate = date;
              }
            }
          });

          const qualificationStatus: 'qualified' | 'not_qualified' | 'pending' =
            qualificationByUid[base.id] || 'pending';

          return {
            id: base.id,
            firstName: base.firstName,
            lastName: base.lastName,
            email: emailByUid[base.id] || base.email || '',
            grade: base.grade,
            lastExamDate,
            examsCompleted,
            qualificationStatus,
          };
        });

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

      // Qualification filter
      const matchesQualification = qualificationFilter === 'all' || student.qualificationStatus === qualificationFilter;

      // Exams completed filter
      const matchesExamsCompleted =
        examsCompletedFilter === 'all' ||
        (examsCompletedFilter === '0' && student.examsCompleted === 0) ||
        (examsCompletedFilter === '1' && student.examsCompleted === 1) ||
        (examsCompletedFilter === '2' && student.examsCompleted === 2) ||
        (examsCompletedFilter === '3_plus' && student.examsCompleted >= 3);

      return matchesSearch && matchesGrade && matchesQualification && matchesExamsCompleted;
    });

    const getLastExamMs = (s: Student) => {
      if (!s.lastExamDate) return -Infinity;
      const ms = Date.parse(s.lastExamDate);
      return Number.isFinite(ms) ? ms : -Infinity;
    };

    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'firstName':
          cmp = (a.firstName || '').localeCompare((b.firstName || ''), undefined, { sensitivity: 'base' });
          break;
        case 'lastName':
          cmp = (a.lastName || '').localeCompare((b.lastName || ''), undefined, { sensitivity: 'base' });
          break;
        case 'grade':
          cmp = (a.grade || 0) - (b.grade || 0);
          break;
        case 'examsCompleted':
          cmp = (a.examsCompleted || 0) - (b.examsCompleted || 0);
          break;
        case 'latestExam':
          cmp = getLastExamMs(a) - getLastExamMs(b);
          break;
        default:
          cmp = 0;
      }

      if (cmp === 0) {
        // Tie-breaker: stable-ish ordering by name
        cmp = (a.firstName || '').localeCompare((b.firstName || ''), undefined, { sensitivity: 'base' });
        if (cmp === 0) cmp = (a.lastName || '').localeCompare((b.lastName || ''), undefined, { sensitivity: 'base' });
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });
    
    setFilteredStudents(filtered);
  }, [searchTerm, students, gradeFilter, qualificationFilter, examsCompletedFilter, sortField, sortDirection]);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);

    // Lazy-load email for the selected student (single doc read), if not already present.
    if (!student.email) {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'student_email_mappings', student.id));
          const email = (snap.exists() ? (snap.data() as any)?.email : '') || '';
          if (!email) return;

          setSelectedStudent(prev => (prev && prev.id === student.id ? { ...prev, email } : prev));
          setStudents(prev => prev.map(s => (s.id === student.id ? { ...s, email } : s)));
          setFilteredStudents(prev => prev.map(s => (s.id === student.id ? { ...s, email } : s)));
        } catch {
          // ignore
        }
      })();
    }
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setGradeFilter('all');
    setQualificationFilter('all');
    setExamsCompletedFilter('all');
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

  const hasActiveFilters =
    !!searchTerm ||
    gradeFilter !== 'all' ||
    qualificationFilter !== 'all' ||
    examsCompletedFilter !== 'all';

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

            {/* Sort */}
            <FormControl sx={{ minWidth: { xs: '160px', sm: '190px' } }}>
              <InputLabel sx={{ color: '#94a3b8' }}>Sort by</InputLabel>
              <Select
                value={sortField}
                onChange={(e) => {
                  const next = e.target.value as SortField;
                  setSortField(next);
                  // Default "Latest exam" to newest-first
                  if (next === 'latestExam') setSortDirection('desc');
                }}
                input={<OutlinedInput label="Sort by" sx={{ color: '#ffffff' }} />}
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
                <MenuItem value="firstName">First name</MenuItem>
                <MenuItem value="lastName">Last name</MenuItem>
                <MenuItem value="grade">Grade</MenuItem>
                <MenuItem value="examsCompleted">Exams completed</MenuItem>
                <MenuItem value="latestExam">Latest exam</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              sx={{
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: 2,
                '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' },
              }}
              aria-label="Toggle sort direction"
            >
              {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
            </IconButton>

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

              {/* Exams Completed Filter */}
              <FormControl sx={{ minWidth: { xs: '100%', sm: '180px' } }}>
                <InputLabel sx={{ color: '#94a3b8' }}>Exams completed</InputLabel>
                <Select
                  value={examsCompletedFilter}
                  onChange={(e) => setExamsCompletedFilter(e.target.value as ExamsCompletedFilter)}
                  input={<OutlinedInput label="Exams completed" sx={{ color: '#ffffff' }} />}
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
                  <MenuItem value="0">0</MenuItem>
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3_plus">3+</MenuItem>
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
              {examsCompletedFilter !== 'all' && (
                <Chip
                  label={`Exams: ${
                    examsCompletedFilter === '0'
                      ? '0'
                      : examsCompletedFilter === '1'
                        ? '1'
                        : examsCompletedFilter === '2'
                          ? '2'
                          : '3+'
                  }`}
                  onDelete={() => setExamsCompletedFilter('all')}
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
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Exams Completed</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Qualification</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Last Exam</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
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
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {student.examsCompleted}
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
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {selectedStudent.email || 'N/A'}
                    </Typography>
                  </Box>
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
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchoolAdminStudentsPage;
export { SchoolAdminStudentsPage };
