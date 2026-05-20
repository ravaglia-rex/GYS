import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { BarChart2 } from 'lucide-react';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as Sentry from '@sentry/react';
import { auth } from '../../firebase/firebase';
import {
  downloadStudentReport,
  getStudentReports,
  type StudentReportListItem,
} from '../../db/studentCollection';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [uid, setUid] = useState(() => auth.currentUser?.uid ?? '');
  const [reports, setReports] = useState<StudentReportListItem[]>([]);
  const [s3Configured, setS3Configured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? ''));
    return () => unsub();
  }, []);

  const load = useCallback(async () => {
    if (!uid) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentReports(uid);
      setReports([...(data.reports ?? [])].sort((a, b) => (b.milestone ?? 0) - (a.milestone ?? 0)));
      setS3Configured(data.s3Configured !== false);
    } catch (e) {
      setError((e as Error).message ?? 'Could not load reports.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

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
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'ReportsPage');
      }}
    >
      <DashboardLayout>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                color: 'white',
              }}
            >
              <BarChart2 size={32} />
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
                Reports
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', mt: 0.5 }}>
                Programme PDF reports appear here after you complete assessments. New reports are generated
                periodically.
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {rowError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRowError(null)}>
              {rowError}
            </Alert>
          )}

          <Box
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 2,
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Your PDF reports
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#93c5fd' }} />
              </Box>
            ) : reports.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', py: 2 }}>
                Your first report is generated after you complete any 3 assessments. Once it is ready, you
                can download it here. Tier scores for individual exams are always available under{' '}
                <strong style={{ color: '#93c5fd' }}>Completed &amp; Results</strong>.
              </Typography>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                }}
              >
                <Table size="small" sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontSize: '0.72rem' }}>
                        MILESTONE
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontSize: '0.72rem' }}>
                        GENERATED
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontSize: '0.72rem' }}
                      >
                        ASSESSMENTS
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontSize: '0.72rem', width: 160 }}
                      >
                        DOWNLOAD
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow key={r.reportId} hover>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                          {r.milestone != null ? `${r.milestone} assessments` : r.reportId}
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.85)' }}>{formatDate(r.generatedAt)}</TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                          {r.completedAssessmentCount ?? r.milestone ?? '—'}
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
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', mb: 2 }}>
              Your tier scores and outcomes for assessments you have completed, including Pattern and Logic
              (symbolic reasoning), are on{' '}
              <strong style={{ color: '#93c5fd' }}>Completed &amp; Results</strong> under Assessments.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/assessments/completed')} sx={{ mt: 1 }}>
              Go to completed assessments
            </Button>
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default ReportsPage;
