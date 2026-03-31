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
import { doc, getDoc } from 'firebase/firestore';
import { RootState } from '../../state_data/reducer';
import { db } from '../../firebase/firebase';
import { getSchoolDashboard, type StudentRow, type AssessmentProgress } from '../../db/schoolAdminCollection';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { countAssessmentsFromProgress } from '../../utils/schoolAdminRosterUtils';
import { buildGreenfieldPreviewStudentRows } from '../../data/schoolPreviewMock';
import { ASSESSMENT_NAMES, ASSESSMENT_ORDER } from '../../utils/assessmentGating';

const DEFAULT_LOCKED: AssessmentProgress = {
  proficiency_tier: 1,
  status: 'locked',
  best_score: null,
  attempts_count: 0,
  tiers_cleared: {},
};

const STATUS_LABEL: Record<string, string> = {
  locked: 'Locked',
  available: 'Available',
  tier_advanced: 'Advanced',
};

function formatBestScore(raw: number | null | undefined): string {
  if (raw == null || Number.isNaN(Number(raw))) return '—';
  const n = Number(raw);
  if (n >= 0 && n <= 1) return `${Math.round(n * 100)}%`;
  return `${Math.round(n)}%`;
}

function assessmentLabel(id: string): string {
  return ASSESSMENT_NAMES[id] ?? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function statusChipSx(status: string): Record<string, unknown> {
  const st = status ?? 'locked';
  const base = { height: 28, fontWeight: 600, '& .MuiChip-label': { px: 1.25, fontSize: '0.75rem' } };
  if (st === 'tier_advanced') {
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

/** Retired tiers: show as Gold so admins never see removed Platinum/Diamond labels. */
function formatAchievementTierLabel(raw: string | null | undefined): string {
  if (raw == null || raw === '') return '-';
  const t = String(raw).toLowerCase();
  if (t === 'platinum' || t === 'diamond') return 'Gold';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const SchoolAdminStudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const routeBase = isSchoolAdminPreview ? '/for-schools/preview' : '/school-admin';
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<StudentRow | null>(null);
  const [email, setEmail] = useState<string>('');
  const [schoolMismatch, setSchoolMismatch] = useState(false);

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
        const schoolId = String(schoolAdmin.schoolId).trim();

        let srow: StudentRow | null = null;
        try {
          const dash = await getSchoolDashboard(schoolId);
          srow = (dash.students ?? []).find(s => s.uid === studentId) ?? null;
        } catch {
          /* dashboard optional */
        }

        const stSnap = await getDoc(doc(db, 'students', studentId));
        if (!stSnap.exists() && !srow) {
          setRow(null);
          setLoading(false);
          return;
        }

        if (stSnap.exists()) {
          const stData = stSnap.data() as Record<string, unknown>;
          const sid = String(stData.school_id ?? stData.schoolId ?? '');
          if (sid && sid !== schoolId && !srow) {
            setSchoolMismatch(true);
            setRow(null);
            setLoading(false);
            return;
          }
        }

        if (!srow && stSnap.exists()) {
          const stData = stSnap.data() as Record<string, unknown>;
          let grade = 0;
          if (typeof stData.grade === 'number') grade = stData.grade;
          else if (typeof stData.class === 'number') grade = stData.class;
          srow = {
            uid: studentId,
            first_name: String(stData.first_name ?? ''),
            last_name: String(stData.last_name ?? ''),
            grade,
            membership_level: typeof stData.membership_level === 'number' ? stData.membership_level : 0,
            approval_status: String(stData.approval_status ?? 'pending'),
            achievement_tier: (stData.achievement_tier as string) ?? null,
            assessment_progress: {},
            created_at: stData.created_at ?? null,
          };
        }

        setRow(srow);

        try {
          const mapSnap = await getDoc(doc(db, 'student_email_mappings', studentId));
          setEmail((mapSnap.exists() ? (mapSnap.data() as { email?: string })?.email : '') || '');
        } catch {
          setEmail('');
        }
      } catch (e) {
        setError((e as Error).message ?? 'Failed to load student.');
        setRow(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [studentId, schoolAdmin?.schoolId, isSchoolAdminPreview]);

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
  const assessmentRows = ASSESSMENT_ORDER.map((id) => [id, progress[id] ?? DEFAULT_LOCKED] as const);
  const completedSlots = countAssessmentsFromProgress(row.assessment_progress);
  const level3Paid = (row.membership_level ?? 0) >= 3;
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

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', pb: 6 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`${routeBase}/students`)}
        sx={{ mb: 2, color: ip.subtext }}
      >
        Back to roster
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
        {row.first_name} {row.last_name}
      </Typography>
      <Typography variant="body2" sx={{ color: ip.subtext, mb: 3 }}>
        Full profile and assessment activity
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none' }}>
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
                <Typography variant="caption" sx={{ color: ip.subtext }}>Grade</Typography>
                <Typography sx={{ color: ip.heading }}>{row.grade > 0 ? row.grade : '-'}</Typography>
              </Box>
              <Box>
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
              <Box>
                <Typography variant="caption" sx={{ color: ip.subtext }}>Achievement tier</Typography>
                <Typography sx={{ color: ip.heading }}>
                  {formatAchievementTierLabel(row.achievement_tier)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>
              Levels &amp; billing
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.6 }}>
              Your school’s plan covers students through <strong>Level 2</strong> for everyone on the roster.
              <strong> Level 3</strong> is an add-on: each student must purchase it individually to unlock Level 3 exams and reporting.
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
                label={level3Paid ? 'Level 3: purchased' : 'Level 3: not purchased'}
                size="small"
                variant={level3Paid ? 'filled' : 'outlined'}
                sx={
                  level3Paid
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

        <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
              Assessments &amp; scores
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.6 }}>
              Slots with a score or advanced status count as completed: <strong>{completedSlots}</strong>. Best score is
              shown as a percentage (0–100%).
            </Typography>
            <TableContainer
              component={Paper}
              sx={{ boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, bgcolor: '#fff', borderRadius: 1 }}
            >
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: ip.cardBorder } }}>
                <TableHead sx={{ bgcolor: '#E2E8F0' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.8125rem', py: 1.25 }}>
                      Exam / track
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.8125rem', py: 1.25 }}>
                      Proficiency tier
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
                    const st = p.status ?? 'locked';
                    const statusText =
                      STATUS_LABEL[st] ??
                      st.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <TableRow key={key} hover sx={{ '&:nth-of-type(even)': { bgcolor: ip.cardMutedBg } }}>
                        <TableCell sx={{ color: ip.heading, fontWeight: 600 }}>{assessmentLabel(key)}</TableCell>
                        <TableCell sx={{ color: ip.heading }}>{p.proficiency_tier != null ? `Tier ${p.proficiency_tier}` : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusText}
                            size="small"
                            variant="outlined"
                            sx={{
                              ...statusChipSx(st),
                              cursor: 'default',
                              pointerEvents: 'none',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: ip.heading, fontVariantNumeric: 'tabular-nums' }}>
                          {formatBestScore(p.best_score)}
                        </TableCell>
                        <TableCell sx={{ color: ip.heading, fontVariantNumeric: 'tabular-nums' }}>
                          {p.attempts_count ?? 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SchoolAdminStudentDetailPage;
