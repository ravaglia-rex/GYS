import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  downloadQuarterlyReportPdf,
  getQuarterlyReports,
  type QuarterlyReportListItem,
} from '../../db/schoolAdminCollection';
import { GREENFIELD_QUARTERLY_REPORTS } from '../../data/schoolPreviewMock';

const SchoolAdminReportsPage: React.FC = () => {
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const [reports, setReports] = useState<QuarterlyReportListItem[]>([]);
  const [s3Configured, setS3Configured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isSchoolAdminPreview) {
      setReports([...GREENFIELD_QUARTERLY_REPORTS].sort((a, b) => b.quarterKey.localeCompare(a.quarterKey)));
      setS3Configured(false);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getQuarterlyReports();
      setReports(
        [...(data.reports ?? [])].sort((a, b) => b.quarterKey.localeCompare(a.quarterKey))
      );
      setS3Configured(data.s3Configured !== false);
    } catch (e) {
      setError((e as Error).message ?? 'Could not load reports.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [isSchoolAdminPreview]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDownload = async (r: QuarterlyReportListItem) => {
    setRowError(null);
    if (!r.hasPdf || !r.quarterKey) {
      setRowError('No PDF is stored for this quarter yet.');
      return;
    }
    if (!s3Configured) {
      setRowError('Server is not configured for S3 signed URLs (AWS env vars on Cloud Functions).');
      return;
    }
    setDownloadingKey(r.quarterKey);
    try {
      await downloadQuarterlyReportPdf(r.quarterKey);
    } catch (e) {
      setRowError((e as Error).message ?? 'Download failed.');
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', pb: 6, px: { xs: 1, sm: 0 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: ip.heading, fontWeight: 700, mb: 0.5 }}>
          Institutional reports
        </Typography>
        <Typography variant="body2" sx={{ color: ip.subtext }}>
          Quarterly PDFs stored for your school. Download any past report.
        </Typography>
      </Box>

      {!s3Configured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          PDF downloads require AWS credentials and the reports bucket env var on the API. Links will not work until
          those are set.
        </Alert>
      )}
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

      <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: '16px !important', sm: '24px !important' } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} sx={{ color: ip.navy }} />
            </Box>
          ) : reports.length === 0 ? (
            <Typography variant="body2" sx={{ color: ip.subtext, py: 2 }}>
              No quarterly reports in Firestore yet. Run the seed script for your school or add documents under{' '}
              <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                schools/&lt;id&gt;/quarterly_reports
              </Typography>
              .
            </Typography>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                bgcolor: '#ffffff',
                color: ip.heading,
                border: `1px solid ${ip.cardBorder}`,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 560,
                  '& .MuiTableCell-root': {
                    borderColor: ip.cardBorder,
                  },
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: ip.cardMutedBg }}>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.06 }}>
                      Quarter
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.06 }}>
                      Title
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.06 }}
                    >
                      Students
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.72rem', width: 120 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow
                      key={r.quarterKey}
                      hover
                      sx={{
                        bgcolor: '#ffffff',
                        '&:hover': { bgcolor: ip.cardMutedBg },
                        '&:last-of-type td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={{ color: ip.heading, fontWeight: 600, verticalAlign: 'middle' }}>
                        {r.quarterKey}
                        {r.isLatest ? (
                          <Chip
                            label="Latest"
                            size="small"
                            sx={{
                              ml: 1,
                              height: 22,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(16, 64, 139, 0.1)',
                              color: ip.navy,
                              border: 'none',
                            }}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ color: ip.heading, maxWidth: { xs: 200, sm: 380 }, verticalAlign: 'middle' }}>
                        {r.title}
                      </TableCell>
                      <TableCell align="right" sx={{ color: ip.heading, fontWeight: 600, verticalAlign: 'middle' }}>
                        {r.studentsAssessed ?? '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={
                            downloadingKey === r.quarterKey ? (
                              <CircularProgress size={14} sx={{ color: ip.navy }} />
                            ) : (
                              <DownloadIcon sx={{ fontSize: '1.05rem' }} />
                            )
                          }
                          disabled={!r.hasPdf || !s3Configured || downloadingKey !== null}
                          onClick={() => void onDownload(r)}
                          sx={{
                            borderColor: r.hasPdf ? ip.navy : ip.cardBorder,
                            color: r.hasPdf ? ip.navy : ip.subtext,
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: 108,
                            '&:hover': r.hasPdf
                              ? { borderColor: ip.navy, bgcolor: 'rgba(16, 64, 139, 0.06)' }
                              : {},
                          }}
                        >
                          {r.hasPdf ? 'Download' : 'No file'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, p: 2.5, bgcolor: ip.cardMutedBg, border: `1px dashed ${ip.cardBorder}`, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: ip.subtext }}>
          {isSchoolAdminPreview
            ? 'Preview uses the same quarterly metadata as the Greenfield International School seed. PDF download stays disabled until you sign in with a configured API.'
            : "New PDFs are appended each quarter here. Only officials signed in with your school's email can list and download them."}
        </Typography>
      </Box>
    </Box>
  );
};

export default SchoolAdminReportsPage;
