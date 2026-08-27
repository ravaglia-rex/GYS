import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { getSchoolStudent, type StudentRow, type AssessmentProgress } from '../../db/schoolAdminCollection';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { countAssessmentsFromProgress } from '../../utils/schoolAdminRosterUtils';
import { buildGreenfieldPreviewStudentRows } from '../../data/schoolPreviewMock';
import {
  ASSESSMENT_ORDER,
  EXAM_MAX_SCORE_POINTS,
  MEMBERSHIP_ALLOWED,
  assessmentDisplayName,
  isLevelBasedAssessment,
  isSchoolCompletionOnlyAssessment,
  normalizeMembershipLevel,
  tierPercentToExamPoints,
} from '../../utils/assessmentGating';
import { formatAchievementTierLabel, normalizeAchievementTierId } from '../../utils/achievementTier';
import {
  INSTITUTIONAL_PLAN_COVERED_MEMBERSHIP_LEVEL,
  type RegisterPlanId,
} from '../../utils/schoolRegistrationPlans';
import PageTutorial from '../../components/tutorial/PageTutorial';
import {
  getSchoolStudentProctoringFlags,
  getSchoolStudentProctoringSnapshotUrl,
  isProctoringGloballyEnabled,
  type FlaggedProctoringAttempt,
} from '../../features/proctoring';

const DEFAULT_LOCKED: AssessmentProgress = {
  proficiency_tier: 1,
  status: 'locked',
  best_score: null,
  attempts_count: 0,
  tiers_cleared: {},
};

/** Preview cohort is treated as a Standard school (covers levels 1–2). */
const PREVIEW_SCHOOL_PLAN_ID: RegisterPlanId = 'standard';

/**
 * Individual add-on = student self-paid above what the school currently includes.
 * Prefer the detail API flag; fall back to membership vs school-covered tier.
 */
function resolveIndividualAddOnPurchased(
  row: StudentRow,
  options?: { preview?: boolean }
): boolean {
  if (typeof row.individual_add_on_purchased === 'boolean') {
    return row.individual_add_on_purchased;
  }
  const covered =
    typeof row.school_covered_membership_level === 'number'
      ? row.school_covered_membership_level
      : options?.preview
        ? INSTITUTIONAL_PLAN_COVERED_MEMBERSHIP_LEVEL[PREVIEW_SCHOOL_PLAN_ID]
        : null;
  if (covered == null) return false;
  return (row.membership_level ?? 0) > covered;
}

const STATUS_LABEL: Record<string, string> = {
  locked: 'Locked',
  available: 'Available',
  tier_advanced: 'Tier cleared',
  completed: 'Completed',
};

type StudentDetailLocationState = {
  studentRow?: StudentRow;
  email?: string;
};

/** Same interpretation as analytics `bestScorePercent`: 0–1 fraction or 0–100; display as points out of {@link EXAM_MAX_SCORE_POINTS}. */
function formatBestScore(raw: number | null | undefined): string {
  if (raw == null || Number.isNaN(Number(raw))) return '-';
  const n = Number(raw);
  const pct0to100 = n <= 1 ? n * 100 : n;
  const points = tierPercentToExamPoints(pct0to100);
  return `${points} on ${EXAM_MAX_SCORE_POINTS}`;
}

function assessmentLabel(id: string): string {
  return assessmentDisplayName(id);
}

function statusChipSx(status: string): Record<string, unknown> {
  const st = status ?? 'locked';
  const base = { height: 28, fontWeight: 600, '& .MuiChip-label': { px: 1.25, fontSize: '0.75rem' } };
  if (st === 'tier_advanced' || st === 'completed') {
    return {
      ...base,
      border: '1px solid #16a34a',
      color: '#14532d !important',
      bgcolor: '#dcfce7',
      '&:hover': { bgcolor: '#bbf7d0' },
    };
  }
  if (st === 'available') {
    return {
      ...base,
      border: '1px solid #0284c7',
      color: '#0c4a6e !important',
      bgcolor: '#e0f2fe',
      '&:hover': { bgcolor: '#bae6fd' },
    };
  }
  return {
    ...base,
    border: '1px solid #475569',
    color: '#0f172a !important',
    bgcolor: '#f8fafc',
    '&:hover': { bgcolor: '#f1f5f9' },
  };
}

const SchoolAdminStudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as StudentDetailLocationState | null;
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const routeBase = isSchoolAdminPreview ? '/for-schools/preview' : '/school-admin';
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<StudentRow | null>(null);
  const [email, setEmail] = useState<string>('');
  const [schoolMismatch, setSchoolMismatch] = useState(false);
  const [proctoringFlags, setProctoringFlags] = useState<FlaggedProctoringAttempt[]>([]);
  const [proctoringFlagsLoading, setProctoringFlagsLoading] = useState(false);

  useEffect(() => {
    if (isSchoolAdminPreview && studentId) {
      setLoading(true);
      setError(null);
      setSchoolMismatch(false);
      const found = buildGreenfieldPreviewStudentRows().find(s => s.uid === studentId) ?? null;
      setRow(found);
      setEmail(found ? `${found.uid}@preview.argus.test` : '');
      setLoading(false);
      return;
    }

    const run = async () => {
      if (!studentId || !schoolAdmin?.schoolId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setSchoolMismatch(false);
      try {
        let srow: StudentRow | null =
          routeState?.studentRow?.uid === studentId
            ? { ...routeState.studentRow, assessment_progress: routeState.studentRow.assessment_progress ?? {} }
            : null;

        try {
          const directStudent = await getSchoolStudent(studentId, String(schoolAdmin.schoolId).trim());
          srow = { ...directStudent, assessment_progress: directStudent.assessment_progress ?? {} };
        } catch (studentError) {
          const message = (studentError as Error).message ?? '';
          if (message.includes('not linked')) {
            setSchoolMismatch(true);
            setRow(null);
            setLoading(false);
            return;
          }
          if (!srow) {
            setError(message || 'Failed to load student.');
            setRow(null);
            setLoading(false);
            return;
          }
        }

        setRow(srow);
        setEmail(String(srow?.email ?? routeState?.email ?? '').trim());
      } catch (e) {
        setError((e as Error).message ?? 'Failed to load student.');
        setRow(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [studentId, schoolAdmin?.schoolId, isSchoolAdminPreview, routeState?.email, routeState?.studentRow]);

  useEffect(() => {
    if (!isProctoringGloballyEnabled() || !studentId || isSchoolAdminPreview) {
      setProctoringFlags([]);
      return;
    }
    const sid = schoolAdmin?.schoolId ? String(schoolAdmin.schoolId).trim() : '';
    if (!sid) {
      setProctoringFlags([]);
      return;
    }
    setProctoringFlagsLoading(true);
    void getSchoolStudentProctoringFlags(studentId, sid)
      .then((res) => setProctoringFlags(res.flagged_attempts ?? []))
      .catch(() => setProctoringFlags([]))
      .finally(() => setProctoringFlagsLoading(false));
  }, [studentId, isSchoolAdminPreview, schoolAdmin?.schoolId]);

  if (!studentId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Missing student.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography sx={{ color: ip.heading }}>Loading student…</Typography>
      </Box>
    );
  }

  if (schoolMismatch) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          This student is not linked to your school.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`${routeBase}/students`)}>
          Back to roster
        </Button>
      </Box>
    );
  }

  if (!row) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Student not found on your roster or dashboard data is still syncing.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`${routeBase}/students`)}>
          Back to roster
        </Button>
      </Box>
    );
  }

  const progress = row.assessment_progress ?? {};
  const membershipLevel = normalizeMembershipLevel(row.membership_level);
  const packageExamIds = new Set(MEMBERSHIP_ALLOWED[membershipLevel] ?? []);
  const assessmentRows = ASSESSMENT_ORDER.map(id => [id, progress[id] ?? DEFAULT_LOCKED] as const);
  const completedSlots = countAssessmentsFromProgress(row.assessment_progress);
  const individualAddOnPaid = resolveIndividualAddOnPurchased(row, {
    preview: isSchoolAdminPreview,
  });
  const approval = String(row.approval_status ?? '').toLowerCase();
  const approvalLabel =
    approval === 'declined'
      ? 'Declined'
      : approval === 'pending'
        ? 'Pending approval'
        : approval === 'approved'
          ? 'Approved'
          : row.approval_status
            ? String(row.approval_status)
            : 'Not set';
  const approvalChipColor =
    approval === 'approved' ? 'success' : approval === 'pending' ? 'warning' : approval === 'declined' ? 'error' : 'default';

  const achievementTierId = normalizeAchievementTierId(row.achievement_tier);
  const tierLabel = formatAchievementTierLabel(achievementTierId);
  const tierEmoji =
    tierLabel === 'Explorer'
      ? '🧭'
      : tierLabel === 'Bronze'
        ? '🥉'
        : tierLabel === 'Silver'
          ? '🥈'
          : tierLabel === 'Gold'
            ? '🥇'
            : tierLabel === 'Platinum'
              ? '✦'
              : tierLabel === 'Diamond'
                ? '💎'
                : '🏅';
  const tierChipSx =
    tierLabel === 'Explorer'
      ? { bgcolor: '#F0E9F8', border: '1px solid #D1C4E9', color: '#5E35B1' }
      : tierLabel === 'Bronze'
        ? { bgcolor: '#ffe4d6', border: '1px solid #ea580c', color: '#b5561c' }
        : tierLabel === 'Silver'
          ? { bgcolor: '#f3f4f6', border: '1px solid #9ca3af', color: '#374151' }
          : tierLabel === 'Gold'
            ? { bgcolor: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309' }
            : tierLabel === 'Platinum'
              ? { bgcolor: '#e0f2fe', border: '1px solid #38bdf8', color: '#0369a1' }
              : tierLabel === 'Diamond'
                ? { bgcolor: '#ede9fe', border: '1px solid #a78bfa', color: '#5b21b6' }
                : { bgcolor: '#f8fafc', border: '1px solid #e2e8f0', color: ip.heading };

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', pb: 6 }}>
      <PageTutorial pageKey="school.studentDetail" ready={!loading} />
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`${routeBase}/students`)}
        sx={{ mb: 2, color: ip.subtext }}
      >
        Back to roster
      </Button>

      <Box
        data-tutorial-id="school-student-detail-header"
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
            {row.first_name} {row.last_name}
          </Typography>
          <Typography variant="body2" sx={{ color: ip.subtext }}>
            Full profile and assessment activity
          </Typography>
        </Box>
        <Box
          component="section"
          aria-label={`Achievement tier: ${tierLabel}`}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.35,
            px: 1.5,
            py: 1.5,
            minWidth: 72,
            alignSelf: 'stretch',
            borderRadius: '16px',
            textAlign: 'center',
            flexShrink: 0,
            ...tierChipSx,
          }}
        >
          <Typography component="span" aria-hidden sx={{ fontSize: '1.35rem', lineHeight: 1, color: 'inherit' }}>
            {tierEmoji}
          </Typography>
          <Typography
            component="span"
            sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.2, color: 'inherit' }}
          >
            {tierLabel}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card data-tutorial-id="school-student-detail-profile" sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
              Profile
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: ip.subtext }}>Email</Typography>
                <Typography sx={{ color: ip.heading }}>{email || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: ip.subtext }}>Class</Typography>
                <Typography sx={{ color: ip.heading }}>{row.grade > 0 ? row.grade : '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: ip.subtext }}>Section</Typography>
                <Typography sx={{ color: ip.heading }}>
                  {typeof row.section === 'string' && row.section.trim() ? row.section.trim() : '-'}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <Typography variant="caption" sx={{ color: ip.subtext }}>Registration / approval</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={approvalLabel}
                    size="small"
                    color={approvalChipColor}
                    variant={approval === 'approved' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card data-tutorial-id="school-student-detail-billing" sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>
              Levels &amp; billing
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              <Chip
                label={`Membership level: ${row.membership_level ?? 0}`}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  borderColor: '#94a3b8',
                  color: ip.heading,
                  bgcolor: '#ffffff',
                }}
              />
              <Chip
                label={individualAddOnPaid ? 'Individual add-on: purchased' : 'Individual add-on: not purchased'}
                size="small"
                variant={individualAddOnPaid ? 'filled' : 'outlined'}
                sx={
                  individualAddOnPaid
                    ? { fontWeight: 600, bgcolor: '#16a34a', color: '#ffffff' }
                    : {
                        fontWeight: 600,
                        borderColor: '#64748b',
                        color: ip.heading,
                        bgcolor: '#ffffff',
                      }
                }
              />
            </Box>
          </CardContent>
        </Card>

        <Card data-tutorial-id="school-student-detail-assessments" sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
              Assessments &amp; scores
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.6 }}>
              All seven program exams are listed. Tracks outside this student&apos;s membership package show as{' '}
              <strong>Locked</strong>. Personality and Interest (and Career Discovery) stay completion-only for
              schools - results remain private. Slots with a score or advanced status count as completed:{' '}
              <strong>{completedSlots}</strong>. Best score is points out of {EXAM_MAX_SCORE_POINTS} where shown.
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 'none',
                border: `1px solid ${ip.cardBorder}`,
                bgcolor: '#fff',
                borderRadius: 1,
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              <Table size="small" sx={{ minWidth: 520, '& .MuiTableCell-root': { borderColor: ip.cardBorder } }}>
                <TableHead sx={{ bgcolor: '#E2E8F0' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.8125rem', py: 1.25 }}>
                      Exam / track
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.8125rem', py: 1.25 }}>
                      Proficiency level
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.8125rem', py: 1.25 }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.8125rem', py: 1.25 }}>
                      Best score
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.8125rem', py: 1.25 }}>
                      Attempts
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assessmentRows.map(([key, p]) => {
                    const inPackage = packageExamIds.has(key);
                    const st: string = p.status ?? 'locked';
                    const completionOnly =
                      isSchoolCompletionOnlyAssessment(key) || key === 'career_interest_inventory';
                    const completed = st === 'completed' || st === 'tier_advanced';
                    const hasAttempts = (p.attempts_count ?? 0) > 0 || completed || p.best_score != null;

                    let statusText: string;
                    let statusKey = st;
                    if (!inPackage) {
                      statusText = 'Locked';
                      statusKey = 'locked';
                    } else if (completionOnly) {
                      statusText = completed
                        ? 'Completed'
                        : st === 'available'
                          ? 'Available'
                          : st === 'locked'
                            ? 'Not started'
                            : STATUS_LABEL[st] ??
                              st.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                      if (completed) statusKey = 'completed';
                    } else {
                      statusText =
                        STATUS_LABEL[st] ??
                        st.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                    }

                    const showLevel =
                      inPackage &&
                      !completionOnly &&
                      isLevelBasedAssessment(key) &&
                      p.proficiency_tier != null &&
                      (hasAttempts || st === 'available' || st === 'tier_advanced' || st === 'completed');

                    return (
                      <TableRow key={key} hover sx={{ '&:nth-of-type(even)': { bgcolor: ip.cardMutedBg } }}>
                        <TableCell sx={{ color: ip.heading, fontWeight: 600 }}>{assessmentLabel(key)}</TableCell>
                        <TableCell sx={{ color: ip.heading }}>
                          {!inPackage || completionOnly
                            ? '-'
                            : showLevel
                              ? `Level ${p.proficiency_tier}`
                              : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusText}
                            size="small"
                            variant="outlined"
                            sx={{
                              ...statusChipSx(statusKey),
                              cursor: 'default',
                              pointerEvents: 'none',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: ip.heading, fontVariantNumeric: 'tabular-nums' }}>
                          {!inPackage ? '-' : completionOnly ? 'Private' : formatBestScore(p.best_score)}
                        </TableCell>
                        <TableCell sx={{ color: ip.heading, fontVariantNumeric: 'tabular-nums' }}>
                          {!inPackage || completionOnly ? '-' : p.attempts_count ?? 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {isProctoringGloballyEnabled() && (
        <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>
              Proctoring review
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.6 }}>
              Flagged attempts from automated proctoring appear here for your review.
            </Typography>
            {proctoringFlagsLoading ? (
              <Typography variant="body2" sx={{ color: ip.subtext }}>Loading proctoring flags…</Typography>
            ) : proctoringFlags.length === 0 ? (
              <Alert
                severity="info"
                sx={{
                  bgcolor: '#eff6ff',
                  color: ip.heading,
                  border: `1px solid ${ip.cardBorder}`,
                  '& .MuiAlert-icon': { color: ip.statBlue },
                }}
              >
                No flagged proctoring attempts for this student.
              </Alert>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  boxShadow: 'none',
                  border: `1px solid ${ip.cardBorder}`,
                  bgcolor: '#fff',
                  borderRadius: 1,
                  overflowX: 'auto',
                }}
              >
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#E2E8F0' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Assessment</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Risk score</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Violations</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Snapshots</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proctoringFlags.map((attempt) => {
                      const violationSummary = Object.entries(attempt.proctoring_summary.violation_counts ?? {})
                        .map(([k, v]) => `${k.replace(/_/g, ' ')} (${v})`)
                        .join(', ');
                      const snapshotLinks = (attempt.events ?? []).filter(
                        (e) => e.snapshot_s3_key || e.snapshot_url
                      );
                      return (
                        <TableRow key={attempt.attempt_id} hover>
                          <TableCell>{assessmentLabel(String(attempt.assessment_id ?? ''))}</TableCell>
                          <TableCell>{attempt.proficiency_tier ?? '-'}</TableCell>
                          <TableCell>{attempt.proctoring_summary.risk_score}</TableCell>
                          <TableCell sx={{ maxWidth: 280 }}>{violationSummary || '-'}</TableCell>
                          <TableCell>
                            {snapshotLinks.length === 0
                              ? '-'
                              : snapshotLinks.map((e, i) => (
                                  <Button
                                    key={`${attempt.attempt_id}-${i}`}
                                    size="small"
                                    sx={{ mr: 0.5 }}
                                    onClick={async () => {
                                      try {
                                        if (e.snapshot_url) {
                                          window.open(e.snapshot_url, '_blank', 'noopener,noreferrer');
                                          return;
                                        }
                                        const key = e.snapshot_s3_key?.trim();
                                        if (!key || !studentId) return;
                                        const { url } = await getSchoolStudentProctoringSnapshotUrl(
                                          studentId,
                                          key,
                                          String(schoolAdmin?.schoolId ?? '').trim()
                                        );
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                      } catch (err) {
                                        console.error('proctoring snapshot open:', err);
                                      }
                                    }}
                                  >
                                    View {i + 1}
                                  </Button>
                                ))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        )}
      </Box>
    </Box>
  );
};

export default SchoolAdminStudentDetailPage;
