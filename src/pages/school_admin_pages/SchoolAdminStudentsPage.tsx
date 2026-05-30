import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getSchoolDashboard,
  getStudentRegistrationEmailLists,
  putStudentRegistrationEmails,
  type StudentRow,
} from '../../db/schoolAdminCollection';
import { RootState } from '../../state_data/reducer';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  countAssessmentsFromProgress,
  mergeRegistrationEmailLists,
  normalizeRosterEmail,
  parseEmailsFromBulkText,
} from '../../utils/schoolAdminRosterUtils';
import { buildGreenfieldPreviewStudentRows } from '../../data/schoolPreviewMock';
import { formatAchievementTierLabel, normalizeAchievementTierId } from '../../utils/achievementTier';
import {
  INSTITUTIONAL_PLAN_STUDENT_CAP,
  normalizeRegisterPlanId,
  type RegisterPlanId,
} from '../../utils/schoolRegistrationPlans';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { SchoolAdminPageHeader, schoolAdminPageContainerSx } from './schoolAdminPageStyles';

type RosterRegistered = {
  kind: 'registered';
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  grade: number;
  assessmentsCompleted: number;
  achievementTier: string;
  membershipLevel: number;
  approvalStatus: string;
  dashboardRow: StudentRow | null;
};

type RosterInvited = {
  kind: 'invited';
  email: string;
  status: 'invited' | 'revoked';
};

type RosterRow = RosterRegistered | RosterInvited;

type AssessmentsCompletedFilter = 'all' | '0' | '1' | '2' | '3_plus';
type StatusFilter = 'all' | 'registered' | 'invited' | 'revoked';
type SortField = 'firstName' | 'lastName' | 'grade' | 'assessmentsCompleted' | 'email';
type SortDirection = 'asc' | 'desc';

const SORT_FIELD_LABELS: Record<SortField, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  grade: 'Class',
  assessmentsCompleted: 'Assessments done',
  email: 'Email',
};

const ASSESSMENTS_FILTER_LABELS: Record<AssessmentsCompletedFilter, string> = {
  all: 'All',
  '0': '0',
  '1': '1',
  '2': '2',
  '3_plus': '3+',
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  registered: 'Registered',
  invited: 'Invited',
  revoked: 'Revoked',
};

/** Search, sort, sort-direction, and Filters - one visual height */
const ROSTER_TOOLBAR_H = 40;
/** Status, class, and assessments filter dropdowns share width */
const ROSTER_FILTER_SELECT_MIN_W = 200;

const rosterToolbarSelectSx = (minWidth: number) => ({
  minWidth,
  height: ROSTER_TOOLBAR_H,
  minHeight: ROSTER_TOOLBAR_H,
  boxSizing: 'border-box' as const,
  bgcolor: '#fff',
  color: `${ip.heading} !important`,
  borderRadius: 1,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: ip.cardBorder },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy, borderWidth: 1 },
  '& .MuiSelect-select': {
    color: `${ip.heading} !important`,
    display: 'flex',
    alignItems: 'center',
    minHeight: ROSTER_TOOLBAR_H - 2,
    py: 0,
    px: 1.25,
    boxSizing: 'border-box' as const,
  },
  '& .MuiSvgIcon-root': { color: ip.heading },
});

const rosterSelectMenuPaperSx = {
  bgcolor: '#fff',
  color: ip.heading,
  '& .MuiMenuItem-root': { color: ip.heading },
};

const rosterFilterSelectSx = {
  ...rosterToolbarSelectSx(ROSTER_FILTER_SELECT_MIN_W),
  width: ROSTER_FILTER_SELECT_MIN_W,
  maxWidth: ROSTER_FILTER_SELECT_MIN_W,
};

function getAchievementTierChipSx(tierRaw: string) {
  const tier = normalizeAchievementTierId(tierRaw);
  if (tier === 'explorer') {
    return {
      bgcolor: '#F0E9F8',
      color: '#5E35B1',
      border: '1px solid #D1C4E9',
    };
  }
  if (tier === 'bronze') {
    return {
      bgcolor: '#ffe4d6',
      color: '#b5561c',
      border: '1px solid #ea580c',
    };
  }
  if (tier === 'silver') {
    return {
      bgcolor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #9ca3af',
    };
  }
  if (tier === 'gold') {
    return {
      bgcolor: '#fef3c7',
      color: '#b45309',
      border: '1px solid #f59e0b',
    };
  }
  if (tier === 'platinum') {
    return {
      bgcolor: '#e0f2fe',
      color: '#0369a1',
      border: '1px solid #38bdf8',
    };
  }
  if (tier === 'diamond') {
    return {
      bgcolor: '#ede9fe',
      color: '#5b21b6',
      border: '1px solid #a78bfa',
    };
  }
  return {
    bgcolor: ip.cardMutedBg,
    color: ip.heading,
    border: `1px solid ${ip.cardBorder}`,
  };
}

const SchoolAdminStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const routeBase = isSchoolAdminPreview ? '/for-schools/preview' : '/school-admin';
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);

  const [registrationEmails, setRegistrationEmails] = useState<string[]>([]);
  const [revokedRegistrationEmails, setRevokedRegistrationEmails] = useState<string[]>([]);
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [hasNoStudentsInDb, setHasNoStudentsInDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [savingEmails, setSavingEmails] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<RegisterPlanId | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [assessmentsCompletedFilter, setAssessmentsCompletedFilter] =
    useState<AssessmentsCompletedFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('firstName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [revokeConfirmEmail, setRevokeConfirmEmail] = useState<string | null>(null);
  const [resendConfirmEmail, setResendConfirmEmail] = useState<string | null>(null);

  const refreshRegistrationEmails = useCallback(async () => {
    try {
      const lists = await getStudentRegistrationEmailLists();
      setRegistrationEmails(lists.emails.map(normalizeRosterEmail));
      setRevokedRegistrationEmails(lists.revokedEmails.map(normalizeRosterEmail));
    } catch {
      setRegistrationEmails([]);
      setRevokedRegistrationEmails([]);
    }
  }, []);

  const loadRoster = useCallback(async () => {
    if (isSchoolAdminPreview) {
      setLoading(true);
      setLoadError(null);
      const dashboardStudents = buildGreenfieldPreviewStudentRows();
      const registered: RosterRegistered[] = dashboardStudents.map(dr => ({
        kind: 'registered',
        uid: dr.uid,
        email: `${dr.uid}@preview.argus.test`,
        firstName: dr.first_name,
        lastName: dr.last_name,
        grade: dr.grade,
        assessmentsCompleted: countAssessmentsFromProgress(dr.assessment_progress),
        achievementTier: normalizeAchievementTierId(dr.achievement_tier),
        membershipLevel: dr.membership_level,
        approvalStatus: dr.approval_status,
        dashboardRow: dr,
      }));
      setRegistrationEmails([]);
      setRevokedRegistrationEmails([]);
      setHasNoStudentsInDb(false);
      setSelectedPlanId('premium');
      setRows(registered);
      setLoading(false);
      return;
    }
    if (!schoolAdmin?.schoolId) {
      setLoading(false);
      return;
    }
    const schoolId = String(schoolAdmin.schoolId).trim();
    setLoading(true);
    setLoadError(null);
    try {
      let reg: string[] = [];
      let revoked: string[] = [];
      try {
        const lists = await getStudentRegistrationEmailLists();
        reg = lists.emails;
        revoked = lists.revokedEmails;
      } catch (e) {
        console.warn('getStudentRegistrationEmailLists', e);
      }
      reg = (reg ?? []).map(normalizeRosterEmail);
      revoked = (revoked ?? []).map(normalizeRosterEmail);

      const dash = await getSchoolDashboard(schoolId);
      setSelectedPlanId(normalizeRegisterPlanId(dash.selected_plan_id));
      const dashboardStudents = dash.students ?? [];
      setHasNoStudentsInDb(dashboardStudents.length === 0 && reg.length === 0 && revoked.length === 0);

      const registered: RosterRegistered[] = dashboardStudents.map(dr => {
        const emailFromDoc = normalizeRosterEmail(String(dr.email ?? ''));
        const grade = typeof dr.grade === 'number' && dr.grade > 0 ? dr.grade : 0;

        return {
          kind: 'registered' as const,
          uid: dr.uid,
          email: emailFromDoc,
          firstName: String(dr.first_name ?? ''),
          lastName: String(dr.last_name ?? ''),
          grade,
          assessmentsCompleted: countAssessmentsFromProgress(dr.assessment_progress),
          achievementTier: normalizeAchievementTierId(dr.achievement_tier),
          membershipLevel: dr.membership_level ?? 0,
          approvalStatus: dr.approval_status ?? 'pending',
          dashboardRow: dr,
        };
      });

      const registeredEmails = new Set(registered.map(r => normalizeRosterEmail(r.email)).filter(Boolean));
      const activeEmailSet = new Set(reg);
      const invited: RosterInvited[] = reg
        .map(e => normalizeRosterEmail(e))
        .filter(email => {
          if (!email) return false;
          return !registeredEmails.has(email);
        })
        .map(email => ({ kind: 'invited' as const, email, status: 'invited' as const }));
      const revokedRows: RosterInvited[] = revoked
        .map(e => normalizeRosterEmail(e))
        .filter(email => email && !registeredEmails.has(email) && !activeEmailSet.has(email))
        .map(email => ({ kind: 'invited' as const, email, status: 'revoked' as const }));

      setRegistrationEmails(reg);
      setRevokedRegistrationEmails(revoked);
      setRows([...registered, ...invited, ...revokedRows]);
    } catch (e) {
      setLoadError((e as Error).message ?? 'Could not load roster.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [schoolAdmin?.schoolId, isSchoolAdminPreview]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const parsedBulkPreview = useMemo(() => parseEmailsFromBulkText(bulkText), [bulkText]);

  const mergeAndSaveEmails = async (additions: string[]) => {
    if (!additions.length) return;
    setSavingEmails(true);
    setRegistrationError(null);
    setUploadNotice(null);
    try {
      let current: string[] = [];
      let revoked: string[] = [];
      try {
        const lists = await getStudentRegistrationEmailLists();
        current = lists.emails;
        revoked = lists.revokedEmails;
      } catch {
        current = registrationEmails;
        revoked = revokedRegistrationEmails;
      }
      current = (current ?? []).map(normalizeRosterEmail);
      revoked = (revoked ?? []).map(normalizeRosterEmail);
      const merged = mergeRegistrationEmailLists(current, additions);
      const currentSet = new Set(current);
      const newInvitations = merged.filter(email => !currentSet.has(email));
      if (newInvitations.length === 0) {
        setUploadNotice('No new invitations were sent; those emails are already on your invite list.');
        setBulkText('');
        setAddDialogOpen(false);
        return;
      }
      const newInvitationSet = new Set(newInvitations);
      const nextRevoked = revoked.filter(email => !newInvitationSet.has(email));
      const cap = selectedPlanId ? INSTITUTIONAL_PLAN_STUDENT_CAP[selectedPlanId] : null;
      if (cap !== null) {
        const registeredEmails = new Set(
          rows
            .filter((row): row is RosterRegistered => row.kind === 'registered')
            .map(row => normalizeRosterEmail(row.email))
            .filter(Boolean)
        );
        const registeredWithoutEmailCount = rows.filter(
          (row): row is RosterRegistered => row.kind === 'registered' && !normalizeRosterEmail(row.email)
        ).length;
        const nextInvitedCount = merged.filter(email => !registeredEmails.has(normalizeRosterEmail(email))).length;
        const nextActiveRosterCount = registeredEmails.size + registeredWithoutEmailCount + nextInvitedCount;
        if (nextActiveRosterCount > cap) {
          setRegistrationError(
            `Your ${selectedPlanId} plan supports up to ${cap} students. ` +
              `You can add ${Math.max(0, cap - registeredCount - invitedCount)} more.`
          );
          return;
        }
      }
      await putStudentRegistrationEmails(merged, nextRevoked);
      setUploadNotice(
        `Sent invitation${newInvitations.length === 1 ? '' : 's'} to ${newInvitations.length} student${newInvitations.length === 1 ? '' : 's'}.`
      );
      await refreshRegistrationEmails();
      await loadRoster();
      setBulkText('');
      setAddDialogOpen(false);
    } catch (e) {
      setRegistrationError((e as Error).message ?? 'Could not save emails.');
    } finally {
      setSavingEmails(false);
    }
  };

  const handleRevokeInvitation = async (email: string) => {
    const target = normalizeRosterEmail(email);
    if (!target) return;
    setRevokingEmail(target);
    setRegistrationError(null);
    setUploadNotice(null);
    try {
      let current: string[] = [];
      let revoked: string[] = [];
      try {
        const lists = await getStudentRegistrationEmailLists();
        current = lists.emails;
        revoked = lists.revokedEmails;
      } catch {
        current = registrationEmails;
        revoked = revokedRegistrationEmails;
      }
      const next = (current ?? []).map(normalizeRosterEmail).filter(e => e && e !== target);
      const nextRevoked = mergeRegistrationEmailLists(revoked, [target]).filter(e => !next.includes(e));
      await putStudentRegistrationEmails(next, nextRevoked);
      setUploadNotice(`Revoked invitation for ${target}.`);
      setRevokeConfirmEmail(null);
      await refreshRegistrationEmails();
      await loadRoster();
    } catch (e) {
      setRegistrationError((e as Error).message ?? 'Could not revoke invitation.');
    } finally {
      setRevokingEmail(null);
    }
  };

  const handleResendInvitation = async (email: string) => {
    const target = normalizeRosterEmail(email);
    if (!target) return;
    setResendingEmail(target);
    setRegistrationError(null);
    setUploadNotice(null);
    try {
      let current: string[] = [];
      let revoked: string[] = [];
      try {
        const lists = await getStudentRegistrationEmailLists();
        current = lists.emails;
        revoked = lists.revokedEmails;
      } catch {
        current = registrationEmails;
        revoked = revokedRegistrationEmails;
      }
      const next = mergeRegistrationEmailLists(current, [target]);
      const nextRevoked = (revoked ?? []).map(normalizeRosterEmail).filter(e => e && e !== target);
      await putStudentRegistrationEmails(next, nextRevoked);
      setUploadNotice(`Resent invitation to ${target}.`);
      setResendConfirmEmail(null);
      await refreshRegistrationEmails();
      await loadRoster();
    } catch (e) {
      setRegistrationError((e as Error).message ?? 'Could not resend invitation.');
    } finally {
      setResendingEmail(null);
    }
  };

  const filteredSorted = useMemo(() => {
    let list = rows.filter(r => {
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        if (r.kind === 'registered') {
          const blob = `${r.firstName} ${r.lastName} ${r.email}`.toLowerCase();
          if (!blob.includes(q)) return false;
        } else if (!r.email.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'registered' && r.kind !== 'registered') return false;
        if (statusFilter === 'invited' && (r.kind !== 'invited' || r.status !== 'invited')) return false;
        if (statusFilter === 'revoked' && (r.kind !== 'invited' || r.status !== 'revoked')) return false;
      }
      if (gradeFilter !== 'all') {
        if (r.kind !== 'registered' || r.grade !== gradeFilter) return false;
      }
      if (assessmentsCompletedFilter !== 'all' && r.kind === 'registered') {
        const n = r.assessmentsCompleted;
        const ok =
          assessmentsCompletedFilter === '0'
            ? n === 0
            : assessmentsCompletedFilter === '1'
              ? n === 1
              : assessmentsCompletedFilter === '2'
                ? n === 2
                : n >= 3;
        if (!ok) return false;
      } else if (assessmentsCompletedFilter !== 'all' && r.kind === 'invited') {
        return false;
      }
      return true;
    });

    const emailOrder = (a: RosterRow, b: RosterRow) =>
      (a.kind === 'invited' ? a.email : a.email || '').localeCompare(
        b.kind === 'invited' ? b.email : b.email || '',
        undefined,
        { sensitivity: 'base' }
      );

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (a.kind !== b.kind) {
        return a.kind === 'registered' ? -1 : 1;
      }
      if (a.kind === 'invited' && b.kind === 'invited') {
        return emailOrder(a, b);
      }
      if (a.kind !== 'registered' || b.kind !== 'registered') return 0;
      switch (sortField) {
        case 'firstName':
          cmp = (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' });
          break;
        case 'lastName':
          cmp = (a.lastName || '').localeCompare(b.lastName || '', undefined, { sensitivity: 'base' });
          break;
        case 'grade':
          cmp = (a.grade || 0) - (b.grade || 0);
          break;
        case 'assessmentsCompleted':
          cmp = (a.assessmentsCompleted || 0) - (b.assessmentsCompleted || 0);
          break;
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '', undefined, { sensitivity: 'base' });
          break;
        default:
          cmp = 0;
      }
      if (cmp === 0) {
        cmp = (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' });
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [
    rows,
    searchTerm,
    statusFilter,
    gradeFilter,
    assessmentsCompletedFilter,
    sortField,
    sortDirection,
  ]);

  const registeredCount = useMemo(() => rows.filter(r => r.kind === 'registered').length, [rows]);
  const invitedCount = useMemo(() => rows.filter(r => r.kind === 'invited' && r.status === 'invited').length, [rows]);
  const revokedCount = useMemo(() => rows.filter(r => r.kind === 'invited' && r.status === 'revoked').length, [rows]);
  const listTotal = registrationEmails.length;
  const activeRosterCount = registeredCount + invitedCount;
  const studentCap = selectedPlanId ? INSTITUTIONAL_PLAN_STUDENT_CAP[selectedPlanId] : null;
  const capReached = studentCap !== null && activeRosterCount >= studentCap;

  const uniqueGrades = Array.from(
    new Set(rows.filter((r): r is RosterRegistered => r.kind === 'registered').map(r => r.grade).filter(g => g > 0))
  ).sort((a, b) => a - b);

  const hasActiveFilters =
    !!searchTerm.trim() ||
    statusFilter !== 'all' ||
    gradeFilter !== 'all' ||
    assessmentsCompletedFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGradeFilter('all');
    setAssessmentsCompletedFilter('all');
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Typography variant="h6" sx={{ color: ip.heading }}>
          Loading roster…
        </Typography>
      </Box>
    );
  }

  const showEmptyOnboarding = hasNoStudentsInDb && listTotal === 0;

  return (
    <Box sx={schoolAdminPageContainerSx}>
      <PageTutorial pageKey="school.students" ready={!loading} />
      <SchoolAdminPageHeader
        title="Students"
        subtitle={
          isSchoolAdminPreview
            ? 'Read-only snapshot of the Greenfield International School seed cohort (142 students).'
            : 'Invite students by email, then track registration and assessments.'
        }
        action={
          isSchoolAdminPreview ? (
            <Tooltip title="Sign in to add or invite students">
              <span>
                <Button
                  variant="contained"
                  disabled
                  startIcon={<AddIcon />}
                  sx={{
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    boxShadow: 'none',
                    '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#64748b' },
                  }}
                >
                  Add students
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button
              data-tutorial-id="school-students-add"
              variant="contained"
              startIcon={<AddIcon />}
              disabled={capReached}
              onClick={() => {
                setBulkText('');
                setUploadNotice(null);
                setRegistrationError(null);
                setAddDialogOpen(true);
              }}
              sx={{
                bgcolor: ip.navy,
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                px: 2,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0c356f', boxShadow: '0 4px 12px rgba(16, 64, 139, 0.25)' },
                '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#64748b' },
              }}
              aria-label="Add students - paste emails"
            >
              Add students
            </Button>
          )
        }
      />

      {loadError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setLoadError(null)}>
          {loadError}
        </Alert>
      )}
      {uploadNotice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setUploadNotice(null)}>
          {uploadNotice}
        </Alert>
      )}
      {registrationError && !addDialogOpen && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRegistrationError(null)}>
          {registrationError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Tooltip title="Total emails currently on your school's invitation list, including active invitations and revoked entries.">
          <Chip
            label={`On invite list: ${listTotal}`}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: 'rgba(16, 64, 139, 0.1)',
              color: ip.navy,
              border: '1px solid rgba(16, 64, 139, 0.25)',
              cursor: 'help',
              '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.16)', borderColor: 'rgba(16, 64, 139, 0.42)' },
            }}
          />
        </Tooltip>
        {studentCap !== null && (
          <Tooltip title="Students currently counting against your plan cap: registered students plus active pending invitations.">
            <Chip
              label={`Active roster: ${activeRosterCount}/${studentCap}`}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: capReached ? '#fef2f2' : 'rgba(16, 64, 139, 0.1)',
                color: capReached ? '#991b1b' : ip.navy,
                border: capReached ? '1px solid #fecaca' : '1px solid rgba(16, 64, 139, 0.25)',
                cursor: 'help',
                '&:hover': {
                  bgcolor: capReached ? '#fee2e2' : 'rgba(16, 64, 139, 0.16)',
                  borderColor: capReached ? '#fca5a5' : 'rgba(16, 64, 139, 0.42)',
                },
              }}
            />
          </Tooltip>
        )}
        <Tooltip title="Students who have created accounts and are linked to your school roster.">
          <Chip
            label={`Registered: ${registeredCount}`}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: ip.cardMutedBg,
              color: ip.heading,
              border: `1px solid ${ip.cardBorder}`,
              cursor: 'help',
              '&:hover': { bgcolor: '#e2e8f0', borderColor: '#cbd5e1' },
            }}
          />
        </Tooltip>
        <Tooltip title="Invitations that are still active, but the student has not registered yet.">
          <Chip
            label={`Invited (not signed up): ${invitedCount}`}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: ip.cardMutedBg,
              color: ip.heading,
              border: `1px solid ${ip.cardBorder}`,
              cursor: 'help',
              '&:hover': { bgcolor: '#e2e8f0', borderColor: '#cbd5e1' },
            }}
          />
        </Tooltip>
        <Tooltip title="Invitations you removed. These no longer count as active roster seats unless resent.">
          <Chip
            label={`Revoked: ${revokedCount}`}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: ip.cardMutedBg,
              color: ip.heading,
              border: `1px solid ${ip.cardBorder}`,
              cursor: 'help',
              '&:hover': { bgcolor: '#e2e8f0', borderColor: '#cbd5e1' },
            }}
          />
        </Tooltip>
      </Box>

      {capReached && studentCap !== null && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your current plan is at its {studentCap}-student cap. Upgrade your package or revoke unused invitations before
          adding more students.
        </Alert>
      )}

      {showEmptyOnboarding ? (
        <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, boxShadow: 'none', mb: 3 }}>
          <CardContent sx={{ py: 4 }}>
            <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 1 }}>
              Add your students
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, maxWidth: 560, lineHeight: 1.6 }}>
              There are no student accounts for your school yet. Paste student email addresses below, one per line or
              comma-separated.
              <br />
              If you prefer to send a CSV, email it to globalyoungscholar@argus.ai.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={isSchoolAdminPreview || capReached}
              onClick={() => setAddDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              Add student emails
            </Button>
            <Typography variant="caption" display="block" sx={{ color: ip.subtext }}>
              You can add more any time using <strong>Add students</strong> above once your roster is active.
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {!showEmptyOnboarding && (
        <>
          <Card sx={{ bgcolor: '#fff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, mb: 3 }}>
            <CardContent>
              <Box
                data-tutorial-id="school-students-filters"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  mb: showFilters ? 2 : 0,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ width: { xs: '100%', sm: 'min(100%, 420px)' }, flex: '1 1 260px', display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name or email…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: ip.subtext, fontSize: '1.25rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: ROSTER_TOOLBAR_H,
                        minHeight: ROSTER_TOOLBAR_H,
                        boxSizing: 'border-box',
                        '& fieldset': { borderColor: ip.cardBorder },
                        '&:hover fieldset': { borderColor: ip.navy },
                        bgcolor: '#fff',
                      },
                      '& .MuiInputBase-input': {
                        color: ip.heading,
                        py: 0,
                        boxSizing: 'border-box',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    component="label"
                    htmlFor="students-sort-select"
                    variant="body2"
                    sx={{ color: ip.subtext, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    Sort by
                  </Typography>
                  <Select
                    id="students-sort-select"
                    size="small"
                    value={sortField}
                    onChange={e => setSortField(e.target.value as SortField)}
                    renderValue={v => SORT_FIELD_LABELS[v as SortField] ?? String(v)}
                    MenuProps={{ PaperProps: { sx: rosterSelectMenuPaperSx } }}
                    sx={rosterToolbarSelectSx(158)}
                  >
                    <MenuItem value="firstName">First name</MenuItem>
                    <MenuItem value="lastName">Last name</MenuItem>
                    <MenuItem value="grade">Class</MenuItem>
                    <MenuItem value="assessmentsCompleted">Assessments done</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                  </Select>
                </Box>
                <IconButton
                  onClick={() => setSortDirection(p => (p === 'asc' ? 'desc' : 'asc'))}
                  size="small"
                  sx={{
                    width: ROSTER_TOOLBAR_H,
                    height: ROSTER_TOOLBAR_H,
                    minWidth: ROSTER_TOOLBAR_H,
                    minHeight: ROSTER_TOOLBAR_H,
                    p: 0,
                    boxSizing: 'border-box',
                    border: `1px solid ${ip.cardBorder}`,
                    borderRadius: 1,
                    color: ip.heading,
                    '&:hover': { borderColor: ip.navy, bgcolor: 'rgba(16, 64, 139, 0.06)' },
                  }}
                  aria-label="Toggle sort direction"
                >
                  {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                </IconButton>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(s => !s)}
                  sx={{
                    height: ROSTER_TOOLBAR_H,
                    minHeight: ROSTER_TOOLBAR_H,
                    px: 2,
                    boxSizing: 'border-box',
                    borderColor: ip.cardBorder,
                    color: ip.heading,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { borderColor: ip.navy, bgcolor: 'rgba(16, 64, 139, 0.06)' },
                  }}
                >
                  {showFilters ? 'Hide filters' : 'Filters'}
                </Button>
              </Box>

              {showFilters && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    pt: 2,
                    borderTop: `1px solid ${ip.cardBorder}`,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      component="label"
                      htmlFor="students-status-filter"
                      variant="body2"
                      sx={{ color: ip.subtext, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Status
                    </Typography>
                    <Select
                      id="students-status-filter"
                      size="small"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                      renderValue={v => STATUS_FILTER_LABELS[v as StatusFilter]}
                      MenuProps={{ PaperProps: { sx: rosterSelectMenuPaperSx } }}
                      sx={rosterFilterSelectSx}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="registered">Registered</MenuItem>
                      <MenuItem value="invited">Invited</MenuItem>
                      <MenuItem value="revoked">Revoked</MenuItem>
                    </Select>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      component="label"
                      htmlFor="students-grade-filter"
                      variant="body2"
                      sx={{ color: ip.subtext, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Class
                    </Typography>
                    <Select
                      id="students-grade-filter"
                      size="small"
                      value={gradeFilter}
                      onChange={e => setGradeFilter(e.target.value as number | 'all')}
                      renderValue={v => (v === 'all' ? 'All' : `Class ${v}`)}
                      MenuProps={{ PaperProps: { sx: rosterSelectMenuPaperSx } }}
                      sx={rosterFilterSelectSx}
                    >
                      <MenuItem value="all">All</MenuItem>
                      {uniqueGrades.map(g => (
                        <MenuItem key={g} value={g}>
                          Class {g}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      component="label"
                      htmlFor="students-assessments-filter"
                      variant="body2"
                      sx={{ color: ip.subtext, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Assessments done
                    </Typography>
                    <Select
                      id="students-assessments-filter"
                      size="small"
                      value={assessmentsCompletedFilter}
                      onChange={e =>
                        setAssessmentsCompletedFilter(e.target.value as AssessmentsCompletedFilter)
                      }
                      renderValue={v => ASSESSMENTS_FILTER_LABELS[v as AssessmentsCompletedFilter]}
                      MenuProps={{ PaperProps: { sx: rosterSelectMenuPaperSx } }}
                      sx={rosterFilterSelectSx}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="0">0</MenuItem>
                      <MenuItem value="1">1</MenuItem>
                      <MenuItem value="2">2</MenuItem>
                      <MenuItem value="3_plus">3+</MenuItem>
                    </Select>
                  </Box>
                  {hasActiveFilters && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<ClearIcon />}
                      onClick={handleClearFilters}
                      size="small"
                      sx={{
                        height: ROSTER_TOOLBAR_H,
                        minHeight: ROSTER_TOOLBAR_H,
                        px: 2,
                        boxSizing: 'border-box',
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#fff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}` }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: ip.subtext, mb: 2 }}>
                Showing {filteredSorted.length} of {rows.length} rows
              </Typography>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  boxShadow: 'none',
                  bgcolor: '#fff',
                  color: ip.heading,
                  border: `1px solid ${ip.cardBorder}`,
                  borderRadius: 1,
                  overflowX: 'auto',
                  maxWidth: '100%',
                }}
              >
                <Table size="medium" sx={{ bgcolor: '#fff', minWidth: 640 }}>
                  <TableHead data-tutorial-id="school-students-table">
                    <TableRow
                      sx={{
                        bgcolor: ip.cardMutedBg,
                        '& .MuiTableCell-root': {
                          color: ip.heading,
                          fontWeight: 700,
                          borderBottom: `1px solid ${ip.cardBorder}`,
                        },
                      }}
                    >
                      <TableCell>Student</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Achievement</TableCell>
                      <TableCell>Assessments</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSorted.length === 0 ? (
                      <TableRow sx={{ bgcolor: '#fff' }}>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: ip.subtext, borderBottom: 'none' }}>
                          No rows match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSorted.map((r, index) =>
                        r.kind === 'registered' ? (
                          <TableRow
                            key={r.uid}
                            data-tutorial-id={index === 0 ? 'school-students-table' : undefined}
                            hover
                            sx={{
                              bgcolor: '#fff',
                              '&:nth-of-type(even)': { bgcolor: ip.cardMutedBg },
                              '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.06) !important' },
                              '& .MuiTableCell-root': {
                                color: ip.heading,
                                borderBottom: `1px solid ${ip.cardBorder}`,
                              },
                            }}
                          >
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: ip.heading }}>
                                {r.firstName} {r.lastName}
                              </Typography>
                              {r.email ? (
                                <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mt: 0.25 }}>
                                  {r.email}
                                </Typography>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label="Registered"
                                sx={{
                                  fontWeight: 600,
                                  bgcolor: 'rgba(34, 197, 94, 0.14)',
                                  color: '#166534',
                                  border: '1px solid rgba(34, 197, 94, 0.4)',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: ip.heading, fontWeight: 500 }}>{r.grade > 0 ? r.grade : '-'}</TableCell>
                            <TableCell sx={{ color: ip.heading, fontWeight: 500 }}>
                              <Chip
                                size="small"
                                label={formatAchievementTierLabel(r.achievementTier)}
                                sx={{
                                  fontWeight: 600,
                                  ...getAchievementTierChipSx(r.achievementTier),
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: ip.heading, fontWeight: 500 }}>{r.assessmentsCompleted}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                endIcon={<OpenInNewIcon sx={{ fontSize: '1rem !important' }} />}
                                onClick={() =>
                                  navigate(`${routeBase}/students/${encodeURIComponent(r.uid)}`, {
                                    state: {
                                      studentRow: r.dashboardRow,
                                      email: r.email,
                                    },
                                  })
                                }
                                sx={{ color: ip.statBlue, fontWeight: 600, textTransform: 'none' }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow
                            key={`inv:${r.email}`}
                            data-tutorial-id={index === 0 ? 'school-students-table' : undefined}
                            hover
                            sx={{
                              bgcolor: '#fff',
                              '&:nth-of-type(even)': { bgcolor: ip.cardMutedBg },
                              '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.06) !important' },
                              '& .MuiTableCell-root': {
                                color: ip.heading,
                                borderBottom: `1px solid ${ip.cardBorder}`,
                              },
                            }}
                          >
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: ip.heading }}>{r.email}</Typography>
                              <Typography variant="caption" sx={{ color: ip.subtext, display: 'block' }}>
                                {r.status === 'revoked' ? 'Invitation revoked' : 'Invited - not registered yet'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={r.status === 'revoked' ? 'Revoked' : 'Invited'}
                                sx={r.status === 'revoked' ? {
                                  fontWeight: 600,
                                  bgcolor: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #cbd5e1',
                                } : {
                                  fontWeight: 600,
                                  bgcolor: 'rgba(245, 158, 11, 0.14)',
                                  color: '#9a3412',
                                  border: '1px solid rgba(245, 158, 11, 0.45)',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: ip.subtext }}>-</TableCell>
                            <TableCell sx={{ color: ip.subtext }}>-</TableCell>
                            <TableCell sx={{ color: ip.subtext }}>-</TableCell>
                            <TableCell align="right">
                              {r.status === 'revoked' ? (
                                <Button
                                  size="small"
                                  disabled={resendingEmail === r.email}
                                  onClick={() => setResendConfirmEmail(r.email)}
                                  sx={{ color: ip.statBlue, fontWeight: 600, textTransform: 'none' }}
                                >
                                  {resendingEmail === r.email ? 'Sending...' : 'Resend invitation'}
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  color="error"
                                  disabled={revokingEmail === r.email}
                                  onClick={() => setRevokeConfirmEmail(r.email)}
                                  sx={{ fontWeight: 600, textTransform: 'none' }}
                                >
                                  {revokingEmail === r.email ? 'Revoking...' : 'Revoke invitation'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={addDialogOpen}
        onClose={() => !savingEmails && setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#ffffff',
              color: ip.heading,
              borderRadius: 2,
              border: `1px solid ${ip.cardBorder}`,
              boxShadow: '0 24px 48px rgba(15, 23, 42, 0.14)',
            },
          },
          backdrop: {
            sx: { bgcolor: 'rgba(15, 23, 42, 0.5)' },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: ip.heading,
            fontWeight: 700,
            fontSize: '1.15rem',
            borderBottom: `1px solid ${ip.cardBorder}`,
            pb: 2,
            pt: 2.5,
            px: 3,
          }}
        >
          Add student emails
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important', px: 3, pb: 1, bgcolor: '#ffffff' }}>
          {registrationError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRegistrationError(null)}>
              {registrationError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: ip.heading, mb: 2, lineHeight: 1.55, fontSize: '0.95rem' }}>
            Paste emails in the box below, one per line or comma-separated. New addresses are added to your school
            student email list and invitation emails are sent automatically.
          </Typography>
          <Typography variant="body2" sx={{ color: ip.heading, mb: 2, lineHeight: 1.55, fontSize: '0.95rem' }}>
            You can also email a CSV file to globalyoungscholar@argus.ai and we will upload it for your school.
          </Typography>
          {studentCap !== null && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your current plan allows {studentCap} active students; {Math.max(0, studentCap - activeRosterCount)}{' '}
              slot{Math.max(0, studentCap - activeRosterCount) === 1 ? '' : 's'} remain.
            </Alert>
          )}
          <TextField
            multiline
            minRows={6}
            fullWidth
            placeholder={'student1@school.edu\nstudent2@school.edu'}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                bgcolor: '#f8fafc',
                color: ip.heading,
                fontSize: '0.95rem',
                alignItems: 'flex-start',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: ip.cardBorder,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: ip.navy,
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: ip.navy,
                borderWidth: 1,
              },
              '& .MuiInputBase-input': {
                color: ip.heading,
                '&::placeholder': {
                  color: ip.subtext,
                  opacity: 1,
                },
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{ display: 'block', mt: 1.5, color: ip.heading, fontSize: '0.875rem', fontWeight: 500 }}
          >
            {parsedBulkPreview.length} valid new address{parsedBulkPreview.length === 1 ? '' : 'es'} detected in this box
            <Typography component="span" variant="body2" sx={{ color: ip.subtext, fontWeight: 400, display: 'block', mt: 0.5, fontSize: '0.8125rem' }}>
              (duplicates across your saved list are removed on save).
            </Typography>
          </Typography>
          {savingEmails && <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: ip.cardMutedBg, '& .MuiLinearProgress-bar': { bgcolor: ip.navy } }} />}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 1,
            gap: 1,
            borderTop: `1px solid ${ip.cardBorder}`,
            bgcolor: ip.cardMutedBg,
          }}
        >
          <Button
            onClick={() => setAddDialogOpen(false)}
            disabled={savingEmails}
            sx={{ textTransform: 'none', fontWeight: 600, color: ip.heading }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={savingEmails || parsedBulkPreview.length === 0}
            onClick={() => void mergeAndSaveEmails(parsedBulkPreview)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: ip.navy,
              boxShadow: 'none',
              px: 2,
              '&:hover': { bgcolor: '#0c356f', boxShadow: 'none' },
              '&.Mui-disabled': {
                bgcolor: '#e2e8f0',
                color: '#64748b',
              },
            }}
          >
            Send invitation
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!revokeConfirmEmail}
        onClose={() => !revokingEmail && setRevokeConfirmEmail(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#ffffff',
              color: ip.heading,
              borderRadius: 2,
              border: `1px solid ${ip.cardBorder}`,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: ip.heading, fontWeight: 700 }}>
          Revoke invitation?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.6 }}>
            This will remove {revokeConfirmEmail} from your active student email list. They will not be able to register
            under your school unless you resend the invitation.
          </Typography>
          {revokingEmail && <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: ip.cardMutedBg, '& .MuiLinearProgress-bar': { bgcolor: ip.navy } }} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setRevokeConfirmEmail(null)}
            disabled={!!revokingEmail}
            sx={{ textTransform: 'none', fontWeight: 600, color: ip.heading }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={!revokeConfirmEmail || !!revokingEmail}
            onClick={() => revokeConfirmEmail && void handleRevokeInvitation(revokeConfirmEmail)}
            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
          >
            {revokingEmail ? 'Revoking...' : 'Revoke invitation'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!resendConfirmEmail}
        onClose={() => !resendingEmail && setResendConfirmEmail(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#ffffff',
              color: ip.heading,
              borderRadius: 2,
              border: `1px solid ${ip.cardBorder}`,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: ip.heading, fontWeight: 700 }}>
          Resend invitation?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.6 }}>
            This will move {resendConfirmEmail} back to Invited status, add them to your active student email list, and
            send a new invitation email.
          </Typography>
          {resendingEmail && <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: ip.cardMutedBg, '& .MuiLinearProgress-bar': { bgcolor: ip.navy } }} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setResendConfirmEmail(null)}
            disabled={!!resendingEmail}
            sx={{ textTransform: 'none', fontWeight: 600, color: ip.heading }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!resendConfirmEmail || !!resendingEmail}
            onClick={() => resendConfirmEmail && void handleResendInvitation(resendConfirmEmail)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: ip.navy,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#0c356f', boxShadow: 'none' },
            }}
          >
            {resendingEmail ? 'Sending...' : 'Resend invitation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchoolAdminStudentsPage;
export { SchoolAdminStudentsPage };
