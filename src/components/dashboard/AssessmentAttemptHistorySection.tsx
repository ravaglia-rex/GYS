import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { type AssessmentType, type AttemptRecord } from '../../db/assessmentCollection';
import { useAssessmentConfig, useStudentAssessments } from '../../query/hooks';
import {
  ASSESSMENT_NAMES,
  EXAM_MAX_SCORE_POINTS,
  isLevelBasedAssessment,
  tierPercentToExamPoints,
} from '../../utils/assessmentGating';
import { timestampToMillis } from '../../utils/examAttemptCooldown';

interface AssessmentAttemptHistorySectionProps {
  uid?: string;
  previewAttempts?: AttemptRecord[];
  previewAssessments?: AssessmentType[];
}

const statusColor: Record<AttemptRecord['status'], { bg: string; color: string; label: string }> = {
  completed: { bg: 'rgba(16,185,129,0.14)', color: '#86efac', label: 'Complete' },
  in_progress: { bg: 'rgba(59,130,246,0.14)', color: '#93c5fd', label: 'Still in progress' },
  failed: { bg: 'rgba(239,68,68,0.14)', color: '#fca5a5', label: 'Ended early' },
  abandoned: { bg: 'rgba(245,158,11,0.14)', color: '#fcd34d', label: 'Abandoned' },
};

function formatAttemptDate(attempt: AttemptRecord): string {
  const ms =
    timestampToMillis(attempt.completed_at) ??
    timestampToMillis(attempt.failed_at) ??
    timestampToMillis(attempt.abandoned_at) ??
    timestampToMillis(attempt.started_at);
  if (ms == null) return 'Date unavailable';
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function attemptSortMs(attempt: AttemptRecord): number {
  return (
    timestampToMillis(attempt.completed_at) ??
    timestampToMillis(attempt.failed_at) ??
    timestampToMillis(attempt.abandoned_at) ??
    timestampToMillis(attempt.started_at) ??
    0
  );
}

function formatAttemptScore(attempt: AttemptRecord): string {
  if (typeof attempt.score !== 'number' || Number.isNaN(attempt.score)) {
    return attempt.status === 'in_progress' ? 'Pending' : '--';
  }
  return `${tierPercentToExamPoints(Math.round(attempt.score * 100))} / ${EXAM_MAX_SCORE_POINTS}`;
}

const AssessmentAttemptHistorySection: React.FC<AssessmentAttemptHistorySectionProps> = ({
  uid = '',
  previewAttempts,
  previewAssessments,
}) => {
  const liveLoad = !previewAttempts && Boolean(uid);
  const { data: assessmentConfig = [] } = useAssessmentConfig(liveLoad);
  const {
    data: studentAssessments,
    isLoading,
    isError,
  } = useStudentAssessments(uid, liveLoad);

  const attempts = useMemo(
    () => previewAttempts ?? studentAssessments?.attempts ?? [],
    [previewAttempts, studentAssessments?.attempts]
  );
  const assessments = previewAssessments ?? assessmentConfig;
  const loading = liveLoad && isLoading;
  const error = liveLoad && isError
    ? 'Could not load attempt history. Please refresh and try again.'
    : null;

  const assessmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    assessments.forEach((assessment) => {
      map.set(assessment.id, assessment.name?.trim() || ASSESSMENT_NAMES[assessment.id] || assessment.id);
    });
    return map;
  }, [assessments]);

  const rows = useMemo(
    () =>
      [...attempts]
        .filter((attempt) => attempt.assessment_id)
        .sort((a, b) => attemptSortMs(b) - attemptSortMs(a)),
    [attempts]
  );

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        bgcolor: 'rgba(15, 23, 42, 0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2.25, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
          Detailed Results
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.64)', mt: 0.5 }}>
          Every official attempt is listed here, including levels from assessments that are still in progress.
        </Typography>
      </Box>

      <Alert
        severity="info"
        sx={{
          display: { xs: 'flex', sm: 'none' },
          m: 2,
          mb: 0,
          bgcolor: 'rgba(59,130,246,0.12)',
          color: '#bfdbfe',
          border: '1px solid rgba(147,197,253,0.2)',
          '& .MuiAlert-icon': { color: '#93c5fd' },
        }}
      >
        View on a tablet or PC for the full results table with scores and progress.
      </Alert>

      {error ? (
        <Alert severity="error" sx={{ m: 2, bgcolor: 'rgba(239,68,68,0.12)', color: '#fecaca', '& .MuiAlert-icon': { color: '#fca5a5' } }}>
          {error}
        </Alert>
      ) : loading ? (
        <Box sx={{ p: 3 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.72)' }}>Loading attempt history...</Typography>
        </Box>
      ) : rows.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.72)' }}>
            No assessment attempts have been recorded yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.08)', fontWeight: 700 } }}>
                <TableCell>Date</TableCell>
                <TableCell>Assessment</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Level progress</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((attempt) => {
                const status = statusColor[attempt.status] ?? statusColor.completed;
                const level =
                  isLevelBasedAssessment(attempt.assessment_id) && attempt.proficiency_tier
                    ? `Level ${attempt.proficiency_tier}`
                    : 'Profile';
                const rowKey = attempt.attempt_id || `${attempt.assessment_id}-${attemptSortMs(attempt)}`;

                return (
                  <TableRow key={rowKey} sx={{ '& td': { borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.88)' } }}>
                    <TableCell>{formatAttemptDate(attempt)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {assessmentNameById.get(attempt.assessment_id) ?? ASSESSMENT_NAMES[attempt.assessment_id] ?? attempt.assessment_id}
                    </TableCell>
                    <TableCell>{level}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={status.label}
                        sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      {attempt.status === 'completed'
                        ? attempt.passed === false
                          ? 'Still in progress'
                          : 'Complete'
                        : 'Still in progress'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#c4b5fd' }}>
                      {formatAttemptScore(attempt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
};

export default AssessmentAttemptHistorySection;
