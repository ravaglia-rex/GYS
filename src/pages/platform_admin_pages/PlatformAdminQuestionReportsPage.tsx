import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  formatDateTime,
  listPlatformAdminQuestionProblemReports,
  type PlatformAdminQuestionProblemReport,
} from '../../db/platformAdminCollection';
import {
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
} from './platformAdminPageStyles';
import { PlatformAdminPageHeader, PlatformAdminStatCard, PlatformAdminTableSection } from './platformAdminComponents';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

type SourceFilter = 'all' | 'official' | 'practice';

const PlatformAdminQuestionReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PlatformAdminQuestionProblemReport[]>([]);
  const [officialCount, setOfficialCount] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [source, setSource] = useState<SourceFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlatformAdminQuestionProblemReports({ limit: 300, source });
      setReports(data.reports);
      setOfficialCount(data.official_count);
      setPracticeCount(data.practice_count);
    } catch (e) {
      console.error(e);
      setError('Could not load question reports. Try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    void load();
  }, [load]);

  const emptyMessage = useMemo(() => {
    if (source === 'official') return 'No official exam question reports yet.';
    if (source === 'practice') return 'No practice question reports yet.';
    return 'No question reports yet. New reports from exams and practice will appear here.';
  }, [source]);

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Question reports"
        subtitle="Problems students flag on official exams and practice. Visible only to srishti@argus.ai and michael@argus.ai."
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => void load()}
            disabled={loading}
            sx={platformAdminPrimaryButtonSx}
          >
            Refresh
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <PlatformAdminStatCard
          title="Shown"
          value={loading ? '…' : String(reports.length)}
          icon={<ReportProblemIcon />}
          accent={ip.navy}
        />
        <PlatformAdminStatCard
          title="Official (in fetch)"
          value={loading ? '…' : String(officialCount)}
          icon={<ReportProblemIcon />}
          accent="#2563eb"
        />
        <PlatformAdminStatCard
          title="Practice (in fetch)"
          value={loading ? '…' : String(practiceCount)}
          icon={<ReportProblemIcon />}
          accent="#64748b"
        />
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Show</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={source}
          onChange={(_e, next: SourceFilter | null) => {
            if (next) setSource(next);
          }}
        >
          <ToggleButton value="all" sx={{ textTransform: 'none', px: 1.5 }}>
            All
          </ToggleButton>
          <ToggleButton value="official" sx={{ textTransform: 'none', px: 1.5 }}>
            Official exams
          </ToggleButton>
          <ToggleButton value="practice" sx={{ textTransform: 'none', px: 1.5 }}>
            Practice
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        Reports filed before this inbox only live on the question item in Firestore. New reports include
        student name, email, school, and time.
      </Alert>

      <PlatformAdminTableSection countLabel={`${reports.length} report${reports.length === 1 ? '' : 's'}`}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={36} sx={{ color: ip.navy }} />
          </Box>
        ) : reports.length === 0 ? (
          <Typography sx={{ color: '#64748b', py: 4, textAlign: 'center' }}>{emptyMessage}</Typography>
        ) : (
          <TableContainer component={Paper} sx={platformAdminTablePaperSx}>
            <Table sx={platformAdminTableSx} size="small">
              <TableHead>
                <TableRow sx={platformAdminTableHeadRowSx}>
                  <TableCell>When</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Exam / level</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Report</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>School</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {formatDateTime(row.reported_at)}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Chip
                        size="small"
                        label={row.source === 'official' ? 'Official' : 'Practice'}
                        color={row.source === 'official' ? 'primary' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', minWidth: 140 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {row.exam_title || row.exam_id}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {row.source === 'official' ? 'Level' : 'Practice level'}{' '}
                        {row.tier_or_level ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {row.item_id}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', maxWidth: 360 }}>
                      <Typography
                        sx={{
                          fontSize: '0.85rem',
                          color: '#334155',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.text || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', minWidth: 160 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {row.reporter_name || 'Unknown'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {row.reporter_email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', minWidth: 140 }}>
                      <Typography sx={{ fontSize: '0.85rem' }}>
                        {row.school_name || '—'}
                      </Typography>
                      {row.school_id ? (
                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {row.school_id}
                        </Typography>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PlatformAdminTableSection>
    </Box>
  );
};

export default PlatformAdminQuestionReportsPage;
