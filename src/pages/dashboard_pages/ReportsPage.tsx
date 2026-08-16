import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BookOpen } from 'lucide-react';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as Sentry from '@sentry/react';
import { auth } from '../../firebase/firebase';
import {
  downloadStudentReport,
  type StudentReportListItem,
} from '../../db/studentCollection';
import { useStudentReports } from '../../query/hooks';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { canAccessOfficialStudentAssessments } from '../../utils/officialStudentAssessmentsAccess';

function a11yProps(index: number) {
  return {
    id: `assessment-tab-${index}`,
    'aria-controls': `assessment-tabpanel-${index}`,
  };
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  discovery: 'Discovery Report',
  reasoning_triad: 'Reasoning Triad Report',
  reasoning_skills: 'Stream Ready Report',
  guided_decision: 'Career Ready Report',
};

const MILESTONE_LABELS: Record<number, string> = {
  1: 'Discovery Report',
  3: 'Reasoning Triad Report',
  5: 'Stream Ready Report',
  7: 'Career Ready Report',
};

function reportDisplayName(r: StudentReportListItem): string {
  if (r.reportType && REPORT_TYPE_LABELS[r.reportType]) {
    return REPORT_TYPE_LABELS[r.reportType];
  }
  if (r.milestone != null && MILESTONE_LABELS[r.milestone]) {
    return MILESTONE_LABELS[r.milestone];
  }
  if (r.milestone != null) return `Milestone ${r.milestone} Report`;
  return r.reportId;
}

const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [uid, setUid] = useState(() => auth.currentUser?.uid ?? '');
  const reportsQuery = useStudentReports(uid, Boolean(uid));
  const reports = [...(reportsQuery.data?.reports ?? [])].sort(
    (a, b) => (b.milestone ?? 0) - (a.milestone ?? 0)
  );
  const s3Configured = reportsQuery.data?.s3Configured !== false;
  const loading = reportsQuery.isLoading;
  const error = reportsQuery.isError
    ? ((reportsQuery.error as Error)?.message ?? 'Could not load reports.')
    : null;
  const [rowError, setRowError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? ''));
    return () => unsub();
  }, []);

  const onDownload = async (r: StudentReportListItem) => {
    setRowError(null);
    if (!r.hasPdf || !r.reportId) {
      setRowError('No PDF is stored for this report yet.');
      return;
    }
    if (!s3Configured) {
      setRowError('Report downloads are not configured on the server (AWS S3 env vars).');
      return;
    }
    setDownloadingId(r.reportId);
    try {
      await downloadStudentReport(uid, r.reportId);
    } catch (e) {
      setRowError((e as Error).message ?? 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/assessments/available');
        break;
      case 1:
        navigate('/assessments/completed');
        break;
      case 2:
        navigate('/assessments/reports');
        break;
      default:
        navigate('/assessments/available');
    }
  };

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'ReportsPage');
      }}
    >
      <DashboardLayout>
        <PageTutorial pageKey="student.reports" ready={!loading} />
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  color: 'white',
                }}
              >
                <BookOpen size={32} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={studentPageTitleSx}>
                  Assessments
                </Typography>
                <Typography variant="h6" sx={studentPageSubtitleSx}>
                  {canAccessOfficialStudentAssessments(auth.currentUser?.email)
                    ? 'Take assessments, view results, and track your progress'
                    : 'Official exams are coming soon; practice mode remains available'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Paper
            data-tutorial-id="student-assessments-tabs"
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 1,
            }}
          >
            <Tabs
              value={2}
              onChange={handleTabChange}
              aria-label="assessment tabs"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#8b5cf6',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#8b5cf6',
                },
              }}
            >
              <Tab label="Available" {...a11yProps(0)} />
              <Tab
                label={isPhone ? 'Results' : 'Completed & Results'}
                aria-label="Completed and Results"
                {...a11yProps(1)}
              />
              <Tab label="Reports" {...a11yProps(2)} />
            </Tabs>
          </Paper>

          <Box
            role="tabpanel"
            id="assessment-tabpanel-2"
            aria-labelledby="assessment-tab-2"
            sx={{ py: 3 }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {rowError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRowError(null)}>
                {rowError}
              </Alert>
            )}

            <Box
              data-tutorial-id="student-reports-list"
              sx={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 2,
                p: { xs: 1.5, sm: 2, md: 3 },
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 0.75 }}>
                Your PDF reports
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', mb: 2, lineHeight: 1.65 }}>
              Understand how and when the reports are generated {' '}
                <Button
                  onClick={() => navigate('/how-it-works')}
                  sx={{
                    color: '#93c5fd',
                    textTransform: 'none',
                    fontWeight: 700,
                    p: 0,
                    minWidth: 0,
                    verticalAlign: 'baseline',
                    '&:hover': { background: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  here
                </Button>
                .
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#93c5fd' }} />
                </Box>
              ) : reports.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', py: 2, lineHeight: 1.65 }}>
                  No milestone PDF is ready yet. Finish the exams included in your package (at your grade level),
                  then check back after the next Monday. 
                 
                </Typography>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    overflowX: 'auto',
                    maxWidth: '100%',
                  }}
                >
                  <Table size="small" sx={{ minWidth: 560, width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            color: 'rgba(255,255,255,0.65)',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            width: '32%',
                          }}
                        >
                          REPORT
                        </TableCell>
                        <TableCell
                          sx={{
                            color: 'rgba(255,255,255,0.65)',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            width: '22%',
                          }}
                        >
                          GENERATED
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: 'rgba(255,255,255,0.65)',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            width: '18%',
                          }}
                        >
                          ASSESSMENTS
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: 'rgba(255,255,255,0.65)',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            width: '28%',
                          }}
                        >
                          DOWNLOAD
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((r) => (
                        <TableRow key={r.reportId} hover>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                            {reportDisplayName(r)}
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.85)' }}>{formatDate(r.generatedAt)}</TableCell>
                          <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                            {r.completedAssessmentCount ?? r.milestone ?? '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={
                                downloadingId === r.reportId ? (
                                  <CircularProgress size={14} sx={{ color: '#93c5fd' }} />
                                ) : (
                                  <DownloadIcon sx={{ fontSize: '1.05rem' }} />
                                )
                              }
                              disabled={!r.hasPdf || downloadingId !== null || !s3Configured}
                              onClick={() => void onDownload(r)}
                              sx={{
                                borderColor: r.hasPdf ? '#93c5fd' : 'rgba(255,255,255,0.2)',
                                color: r.hasPdf ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                                textTransform: 'none',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Download PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            <Box
              sx={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 2,
                p: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                Where to see scores today
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', mb: 2, lineHeight: 1.65 }}>
                Per-exam scores and outcomes are available as soon as you finish an assessment under{' '}
                <strong style={{ color: '#93c5fd' }}>Completed &amp; Results</strong>. National percentile,
                achievement badge, and the narrative PDF above are updated on Monday every week.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/assessments/completed')} sx={{ mt: 1 }}>
                Go to completed assessments
              </Button>
            </Box>
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default ReportsPage;
