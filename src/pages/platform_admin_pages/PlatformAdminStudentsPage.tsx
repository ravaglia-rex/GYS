import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  CheckCircleOutline as ActiveIcon,
  HourglassEmpty as PendingIcon,
  School as SchoolIcon,
  HowToReg as OnRosterIcon,
  Payments as SelfPaidIcon,
  Visibility as ViewIcon,
  CardGiftcard as ComplimentaryIcon,
} from '@mui/icons-material';
import { TableVirtuoso } from 'react-virtuoso';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  createPlatformAdminComplimentaryInvite,
  formatDate,
  getPlatformAdminStudentStats,
  listPlatformAdminSchools,
  listPlatformAdminStudents,
  revokePlatformAdminComplimentaryInvite,
  type PlatformAdminSchoolSummary,
  type PlatformAdminStudentRow,
  type PlatformAdminStudentStats,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminClearFiltersButtonSx,
  platformAdminDialogFieldLabelSx,
  platformAdminDialogPaperSx,
  platformAdminDialogSelectSx,
  platformAdminDialogTextFieldSx,
  platformAdminFilterSelectSx,
  platformAdminFilterToolbarRowSx,
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
  platformAdminSearchFieldSx,
  platformAdminSelectMenuPaperSx,
  platformAdminStatsGridSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
  platformAdminTextButtonSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  PlatformAdminPageHeader,
  PlatformAdminChip,
  PlatformAdminStatCard,
  PlatformAdminFilterControl,
  PlatformAdminTableSection,
} from './platformAdminComponents';
import { isPlatformAdminTestStudent } from './platformAdminTestStudents';
import { isPlatformAdminTestSchool } from './platformAdminTestSchools';
import { RootState } from '../../state_data/reducer';
import { MEMBERSHIP_LEVEL_LABEL } from '../../utils/studentMembershipPricing';

type StatusFilter = 'all' | 'approved' | 'pending';
type RosterFilter = 'all' | 'yes' | 'no';
type SetupFilter = 'all' | 'complete' | 'incomplete';
type PaymentFilter = 'all' | 'self_paid';
type GradeFilter = 'all' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
type MembershipFilter = 'all' | '1' | '2' | '3' | '3_plus';
type StudentStatFilter = 'total' | 'on_roster' | 'active' | 'pending' | 'self_paid';

const ALL_SCHOOLS_VALUE = '__all__';
/** Must match the backend's NO_SCHOOL_FILTER_VALUE sentinel in platformAdminCollection/index.ts. */
const NO_SCHOOL_FILTER_VALUE = '__no_school__';
/** Matches the backend's NOT_LISTED_SCHOOL_ID (students who picked "school not listed" at signup). */
const NOT_LISTED_SCHOOL_ID = 'not-listed';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All statuses',
  approved: 'Payment complete',
  pending: 'Payment incomplete',
};

const ROSTER_LABELS: Record<RosterFilter, string> = {
  all: 'All roster',
  yes: 'Has school',
  no: 'No school',
};

const SETUP_LABELS: Record<SetupFilter, string> = {
  all: 'All setup',
  complete: 'Password set',
  incomplete: 'No password yet',
};

const PAYMENT_LABELS: Record<PaymentFilter, string> = {
  all: 'All payments',
  self_paid: 'Self-paid',
};

const GRADE_LABELS: Record<GradeFilter, string> = {
  all: 'All grades',
  '6': 'Grade 6',
  '7': 'Grade 7',
  '8': 'Grade 8',
  '9': 'Grade 9',
  '10': 'Grade 10',
  '11': 'Grade 11',
  '12': 'Grade 12',
};

const MEMBERSHIP_LABELS: Record<MembershipFilter, string> = {
  all: 'All levels',
  '1': 'Level 1',
  '2': 'Level 2',
  '3': 'Level 3 · Stream Ready',
  '3_plus': 'Stream Ready+',
};

function parseInitialSchoolSelection(raw: string | null): {
  allSchoolsSelected: boolean;
  selectedSchoolIds: string[];
} {
  if (!raw) return { allSchoolsSelected: false, selectedSchoolIds: [] };
  if (raw.toLowerCase() === 'all') return { allSchoolsSelected: true, selectedSchoolIds: [] };
  const ids = Array.from(new Set(raw.split(',').map((id) => id.trim()).filter(Boolean)));
  return { allSchoolsSelected: false, selectedSchoolIds: ids };
}

const PLATFORM_STUDENTS_VIRTUOSO_HEIGHT = 560;

/** Fixed % widths so TableVirtuoso rows don't reflow columns as rows virtualize in/out. */
const STUDENT_COL = {
  name: { width: '14%', minWidth: 110 },
  email: { width: '16%', minWidth: 150 },
  school: { width: '16%', minWidth: 130 },
  grade: { width: '6%', minWidth: 56 },
  membership: { width: '9%', minWidth: 80 },
  coins: { width: '8%', minWidth: 72 },
  status: { width: '11%', minWidth: 100 },
  joined: { width: '10%', minWidth: 90 },
  actions: { width: '10%', minWidth: 100 },
} as const;

type StudentSortKey = 'coins' | 'joined' | 'name';
type StudentSortDir = 'asc' | 'desc';

const studentColSx = (key: keyof typeof STUDENT_COL, extra?: Record<string, unknown>) => ({
  ...STUDENT_COL[key],
  boxSizing: 'border-box' as const,
  ...extra,
});

const PlatformStudentsVirtuosoComponents = {
  Scroller: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    function PlatformStudentsScroller({ style, ...props }, ref) {
      return (
        <TableContainer
          component={Paper}
          elevation={0}
          {...props}
          ref={ref}
          style={style}
          sx={platformAdminTablePaperSx}
        />
      );
    }
  ),
  Table: (props: React.ComponentProps<typeof Table>) => (
    <Table
      {...props}
      size="medium"
      sx={{
        ...platformAdminTableSx,
        tableLayout: 'fixed',
        width: '100%',
        minWidth: 960,
        borderCollapse: 'separate',
      }}
    />
  ),
  TableHead: React.forwardRef<HTMLTableSectionElement, React.ComponentProps<typeof TableHead>>(
    function PlatformStudentsTableHead(props, ref) {
      return <TableHead {...props} ref={ref} />;
    }
  ),
  TableRow,
  TableBody: React.forwardRef<HTMLTableSectionElement, React.ComponentProps<typeof TableBody>>(
    function PlatformStudentsTableBody(props, ref) {
      return <TableBody {...props} ref={ref} />;
    }
  ),
};

const PlatformAdminStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const platformAdminRole = useSelector((state: RootState) => state.auth.platformAdminRole);
  const isSuperAdmin = platformAdminRole === 'super';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
  const initialRoster = (searchParams.get('roster') as RosterFilter) || 'all';
  const initialSetup = (searchParams.get('setup') as SetupFilter) || 'all';
  const initialPayment = (searchParams.get('payment') as PaymentFilter) || 'all';
  const initialGrade = (searchParams.get('grade') as GradeFilter) || 'all';
  const initialMembership = (searchParams.get('membership') as MembershipFilter) || 'all';
  const initialSchool = parseInitialSchoolSelection(searchParams.get('schools'));

  const [schools, setSchools] = useState<PlatformAdminSchoolSummary[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [allSchoolsSelected, setAllSchoolsSelected] = useState(initialSchool.allSchoolsSelected);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>(initialSchool.selectedSchoolIds);

  const [students, setStudents] = useState<PlatformAdminStudentRow[]>([]);
  const [stats, setStats] = useState<PlatformAdminStudentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<StudentSortKey>('joined');
  const [sortDir, setSortDir] = useState<StudentSortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    ['all', 'approved', 'pending'].includes(initialStatus) ? initialStatus : 'all'
  );
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>(
    ['all', 'yes', 'no'].includes(initialRoster) ? initialRoster : 'all'
  );
  const [setupFilter, setSetupFilter] = useState<SetupFilter>(
    ['all', 'complete', 'incomplete'].includes(initialSetup) ? initialSetup : 'all'
  );
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>(
    ['all', 'self_paid'].includes(initialPayment) ? initialPayment : 'all'
  );
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>(
    Object.keys(GRADE_LABELS).includes(initialGrade) ? initialGrade : 'all'
  );
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilter>(
    Object.keys(MEMBERSHIP_LABELS).includes(initialMembership) ? initialMembership : 'all'
  );

  const [complimentaryError, setComplimentaryError] = useState<string | null>(null);
  const [complimentaryMessage, setComplimentaryMessage] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLevel, setInviteLevel] = useState<1 | 2 | 3 | 4>(1);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [revokeBusyEmail, setRevokeBusyEmail] = useState<string | null>(null);

  const schoolSelected = allSchoolsSelected || selectedSchoolIds.length > 0;
  /** Unlinked students have no school_id - allow loading them without picking a school. */
  const canLoadStudents = schoolSelected || rosterFilter === 'no';

  const schoolNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const school of schools) {
      map.set(school.id, school.school_name || school.id);
    }
    return map;
  }, [schools]);

  const schoolSelectValue = allSchoolsSelected ? [ALL_SCHOOLS_VALUE] : selectedSchoolIds;

  const deleteSuccessMessage =
    typeof location.state === 'object' &&
    location.state !== null &&
    'deleteSuccess' in location.state &&
    typeof (location.state as { deleteSuccess?: unknown }).deleteSuccess === 'string'
      ? (location.state as { deleteSuccess: string }).deleteSuccess
      : null;

  const hasSecondaryFilters =
    statusFilter !== 'all' ||
    rosterFilter !== 'all' ||
    setupFilter !== 'all' ||
    paymentFilter !== 'all' ||
    gradeFilter !== 'all' ||
    membershipFilter !== 'all' ||
    search.trim().length > 0;

  const clearSecondaryFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRosterFilter('all');
    setSetupFilter('all');
    setPaymentFilter('all');
    setGradeFilter('all');
    setMembershipFilter('all');
  };

  const clearSchoolSelection = () => {
    setAllSchoolsSelected(false);
    setSelectedSchoolIds([]);
  };

  const activeStatFilter = useMemo((): StudentStatFilter | null => {
    if (!allSchoolsSelected) return null;
    if (statusFilter !== 'all' || gradeFilter !== 'all' || membershipFilter !== 'all' || search.trim()) {
      return null;
    }
    if (paymentFilter === 'self_paid' && rosterFilter === 'all' && setupFilter === 'all') {
      return 'self_paid';
    }
    if (rosterFilter === 'yes' && setupFilter === 'complete' && paymentFilter === 'all') {
      return 'active';
    }
    if (rosterFilter === 'yes' && setupFilter === 'incomplete' && paymentFilter === 'all') {
      return 'pending';
    }
    if (rosterFilter === 'yes' && setupFilter === 'all' && paymentFilter === 'all') {
      return 'on_roster';
    }
    if (rosterFilter === 'all' && setupFilter === 'all' && paymentFilter === 'all') {
      return 'total';
    }
    return null;
  }, [
    allSchoolsSelected,
    statusFilter,
    gradeFilter,
    membershipFilter,
    search,
    paymentFilter,
    rosterFilter,
    setupFilter,
  ]);

  const applyStatFilter = (stat: StudentStatFilter) => {
    if (activeStatFilter === stat) {
      clearSecondaryFilters();
      return;
    }
    setAllSchoolsSelected(true);
    setSelectedSchoolIds([]);
    setSearch('');
    setStatusFilter('all');
    setGradeFilter('all');
    setMembershipFilter('all');
    switch (stat) {
      case 'total':
        setRosterFilter('all');
        setSetupFilter('all');
        setPaymentFilter('all');
        break;
      case 'on_roster':
        setRosterFilter('yes');
        setSetupFilter('all');
        setPaymentFilter('all');
        break;
      case 'active':
        setRosterFilter('yes');
        setSetupFilter('complete');
        setPaymentFilter('all');
        break;
      case 'pending':
        setRosterFilter('yes');
        setSetupFilter('incomplete');
        setPaymentFilter('all');
        break;
      case 'self_paid':
        setRosterFilter('all');
        setSetupFilter('all');
        setPaymentFilter('self_paid');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSchoolsLoading(true);
      try {
        const rows = await listPlatformAdminSchools({ limit: 200 });
        if (!cancelled) setSchools(rows);
      } catch {
        if (!cancelled) setError('Failed to load schools.');
      } finally {
        if (!cancelled) setSchoolsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const studentStats = await getPlatformAdminStudentStats();
        if (!cancelled) setStats(studentStats);
      } catch {
        // Stats are secondary; table errors are surfaced separately.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openInviteDialog = () => {
    setInviteEmail('');
    setInviteLevel(1);
    setInviteDialogOpen(true);
  };

  const handleCreateComplimentaryInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setComplimentaryError('Enter a valid student email.');
      return;
    }
    setInviteBusy(true);
    setComplimentaryError(null);
    setComplimentaryMessage(null);
    try {
      const result = await createPlatformAdminComplimentaryInvite({
        email,
        membership_level: inviteLevel,
      });
      setInviteDialogOpen(false);
      setComplimentaryMessage(
        result.invite_sent
          ? result.updated
            ? `Updated complimentary invite for ${email} and resent the invitation email.`
            : `Complimentary invite sent to ${email}.`
          : result.updated
            ? `Updated complimentary invite for ${email}, but the invitation email failed to send.`
            : `Complimentary invite saved for ${email}, but the invitation email failed to send.`
      );
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setComplimentaryError(
        err?.response?.data?.error || err?.message || 'Failed to create complimentary invite.'
      );
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRevokeComplimentaryInvite = async (email: string) => {
    setRevokeBusyEmail(email);
    setComplimentaryError(null);
    setComplimentaryMessage(null);
    try {
      await revokePlatformAdminComplimentaryInvite(email);
      setComplimentaryMessage(`Revoked complimentary invite for ${email}.`);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setComplimentaryError(
        err?.response?.data?.error || err?.message || 'Failed to revoke complimentary invite.'
      );
    } finally {
      setRevokeBusyEmail(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (allSchoolsSelected) params.set('schools', 'all');
    else if (selectedSchoolIds.length > 0) params.set('schools', selectedSchoolIds.join(','));
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (rosterFilter !== 'all') params.set('roster', rosterFilter);
    if (setupFilter !== 'all') params.set('setup', setupFilter);
    if (paymentFilter !== 'all') params.set('payment', paymentFilter);
    if (gradeFilter !== 'all') params.set('grade', gradeFilter);
    if (membershipFilter !== 'all') params.set('membership', membershipFilter);
    setSearchParams(params, { replace: true });
  }, [
    allSchoolsSelected,
    selectedSchoolIds,
    statusFilter,
    rosterFilter,
    setupFilter,
    paymentFilter,
    gradeFilter,
    membershipFilter,
    setSearchParams,
  ]);

  const load = useCallback(async () => {
    if (!canLoadStudents) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // "No school" students are never on a school list - always query across all schools.
      const school_ids =
        rosterFilter === 'no' || allSchoolsSelected ? 'all' : selectedSchoolIds;
      const studentData = await listPlatformAdminStudents({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        roster: rosterFilter === 'all' ? undefined : rosterFilter,
        setup: setupFilter === 'all' ? undefined : setupFilter,
        payment: paymentFilter === 'all' ? undefined : paymentFilter,
        grade: gradeFilter === 'all' ? undefined : gradeFilter,
        membership: membershipFilter === 'all' ? undefined : membershipFilter,
        school_ids,
        limit: 500,
      });
      setStudents(studentData);
    } catch {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [
    canLoadStudents,
    search,
    statusFilter,
    rosterFilter,
    setupFilter,
    paymentFilter,
    gradeFilter,
    membershipFilter,
    allSchoolsSelected,
    selectedSchoolIds,
  ]);

  useEffect(() => {
    const timer = setTimeout(load, search && canLoadStudents ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search, canLoadStudents]);

  const handleRosterFilterChange = (value: RosterFilter) => {
    setRosterFilter(value);
    // Unlinked students only appear under All schools - switch automatically.
    if (value === 'no') {
      setAllSchoolsSelected(true);
      setSelectedSchoolIds([]);
    }
  };

  const handleSchoolSelectChange = (rawValues: string | string[]) => {
    const values = typeof rawValues === 'string' ? rawValues.split(',') : rawValues;
    const previouslyAll = allSchoolsSelected;
    const justSelectedAll = values.includes(ALL_SCHOOLS_VALUE) && !previouslyAll;
    const selectedSpecific = values.filter((v) => v !== ALL_SCHOOLS_VALUE);

    if (justSelectedAll || (values.includes(ALL_SCHOOLS_VALUE) && selectedSpecific.length === 0)) {
      setAllSchoolsSelected(true);
      setSelectedSchoolIds([]);
      return;
    }

    setAllSchoolsSelected(false);
    setSelectedSchoolIds(selectedSpecific);
  };

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onDelete: () => void }[] = [];
    if (allSchoolsSelected) {
      chips.push({ key: 'schools', label: 'All schools', onDelete: clearSchoolSelection });
    } else if (selectedSchoolIds.length === 1) {
      const id = selectedSchoolIds[0];
      chips.push({
        key: 'schools',
        label: id === NO_SCHOOL_FILTER_VALUE ? 'No specific school' : schoolNameById.get(id) || id,
        onDelete: clearSchoolSelection,
      });
    } else if (selectedSchoolIds.length > 1) {
      chips.push({
        key: 'schools',
        label: `${selectedSchoolIds.length} schools`,
        onDelete: clearSchoolSelection,
      });
    }
    if (statusFilter !== 'all') {
      chips.push({ key: 'status', label: STATUS_LABELS[statusFilter], onDelete: () => setStatusFilter('all') });
    }
    if (rosterFilter !== 'all') {
      chips.push({ key: 'roster', label: ROSTER_LABELS[rosterFilter], onDelete: () => setRosterFilter('all') });
    }
    if (setupFilter !== 'all') {
      chips.push({ key: 'setup', label: SETUP_LABELS[setupFilter], onDelete: () => setSetupFilter('all') });
    }
    if (paymentFilter !== 'all') {
      chips.push({
        key: 'payment',
        label: PAYMENT_LABELS[paymentFilter],
        onDelete: () => setPaymentFilter('all'),
      });
    }
    if (gradeFilter !== 'all') {
      chips.push({ key: 'grade', label: GRADE_LABELS[gradeFilter], onDelete: () => setGradeFilter('all') });
    }
    if (membershipFilter !== 'all') {
      chips.push({
        key: 'membership',
        label: MEMBERSHIP_LABELS[membershipFilter],
        onDelete: () => setMembershipFilter('all'),
      });
    }
    if (search.trim()) {
      chips.push({ key: 'search', label: `Search: ${search.trim()}`, onDelete: () => setSearch('') });
    }
    return chips;
  }, [
    allSchoolsSelected,
    selectedSchoolIds,
    schoolNameById,
    statusFilter,
    rosterFilter,
    setupFilter,
    paymentFilter,
    gradeFilter,
    membershipFilter,
    search,
  ]);

  const tableColSpan = isSuperAdmin ? 9 : 8;

  const sortedStudents = useMemo(() => {
    const rows = [...students];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === 'coins') {
        return (a.argus_coins - b.argus_coins) * dir;
      }
      if (sortKey === 'name') {
        const an = `${a.first_name} ${a.last_name}`.trim().toLowerCase();
        const bn = `${b.first_name} ${b.last_name}`.trim().toLowerCase();
        return an.localeCompare(bn) * dir;
      }
      const aJoined = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bJoined = b.created_at ? new Date(b.created_at).getTime() : 0;
      return (aJoined - bJoined) * dir;
    });
    return rows;
  }, [students, sortKey, sortDir]);

  const toggleSort = (key: StudentSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'name' ? 'asc' : 'desc');
  };

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Students"
        subtitle="School invite lists and registered accounts. Active + Pending = On roster."
        action={
          isSuperAdmin ? (
            <Button
              variant="contained"
              startIcon={<ComplimentaryIcon />}
              onClick={openInviteDialog}
              sx={platformAdminPrimaryButtonSx}
            >
              Invite free student
            </Button>
          ) : undefined
        }
      />

      {deleteSuccessMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {deleteSuccessMessage}
        </Alert>
      )}
      {isSuperAdmin && complimentaryMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setComplimentaryMessage(null)}>
          {complimentaryMessage}
        </Alert>
      )}
      {isSuperAdmin && complimentaryError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setComplimentaryError(null)}>
          {complimentaryError}
        </Alert>
      )}

      <Box
        sx={{
          ...platformAdminStatsGridSx,
          gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
        }}
      >
        <PlatformAdminStatCard
          title="Total accounts"
          value={stats?.students_total ?? '-'}
          subtitle="All accounts"
          icon={<PeopleIcon sx={{ fontSize: 22 }} />}
          accent={ip.statBlue}
          selected={activeStatFilter === 'total'}
          onClick={() => applyStatFilter('total')}
        />
        <PlatformAdminStatCard
          title="On roster"
          value={stats?.students_on_roster ?? '-'}
          subtitle="Linked to a school"
          icon={<OnRosterIcon sx={{ fontSize: 22 }} />}
          accent={ip.statBlue}
          selected={activeStatFilter === 'on_roster'}
          onClick={() => applyStatFilter('on_roster')}
        />
        <PlatformAdminStatCard
          title="Active"
          value={stats?.students_active ?? '-'}
          subtitle="Password set"
          icon={<ActiveIcon sx={{ fontSize: 22 }} />}
          accent={ip.approveGreen}
          selected={activeStatFilter === 'active'}
          onClick={() => applyStatFilter('active')}
        />
        <PlatformAdminStatCard
          title="Pending"
          value={stats?.students_pending ?? '-'}
          subtitle="No password yet"
          icon={<PendingIcon sx={{ fontSize: 22 }} />}
          accent="#D97706"
          selected={activeStatFilter === 'pending'}
          onClick={() => applyStatFilter('pending')}
        />
        <PlatformAdminStatCard
          title="Self-paid"
          value={stats?.students_self_paid ?? '-'}
          subtitle="Paid themselves"
          icon={<SelfPaidIcon sx={{ fontSize: 22 }} />}
          accent={ip.navy}
          selected={activeStatFilter === 'self_paid'}
          onClick={() => applyStatFilter('self_paid')}
        />
      </Box>

      <Card sx={{ ...platformAdminCardSx, mb: 2.5 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              width: '100%',
            }}
          >
            <Typography
              component="label"
              htmlFor="students-school-filter"
              variant="body2"
              sx={{
                color: ip.heading,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                fontSize: '0.8rem',
                flexShrink: 0,
              }}
            >
              School*
            </Typography>
            <Select
              id="students-school-filter"
              multiple
              displayEmpty
              size="small"
              value={schoolSelectValue}
              onChange={(e) => handleSchoolSelectChange(e.target.value)}
              input={<OutlinedInput />}
              disabled={schoolsLoading}
              renderValue={(selected) => {
                if (allSchoolsSelected) return 'All schools';
                if (selected.length === 0) {
                  return schoolsLoading ? 'Loading schools…' : 'Select school(s) - required';
                }
                if (selected.length === 1) {
                  const id = selected[0];
                  if (id === NO_SCHOOL_FILTER_VALUE) return 'No specific school';
                  const school = schools.find((s) => s.id === id);
                  const name = school?.school_name || schoolNameById.get(id) || id;
                  const count = school?.student_count ?? 0;
                  return `${name} (${count})`;
                }
                return `${selected.length} schools`;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    ...platformAdminSelectMenuPaperSx,
                    maxHeight: 360,
                    minWidth: 320,
                  },
                },
              }}
              sx={{
                ...platformAdminFilterSelectSx(240),
                flex: 1,
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                '& .MuiSelect-select': {
                  ...platformAdminFilterSelectSx(240)['& .MuiSelect-select'],
                  color:
                    schoolSelected || schoolsLoading
                      ? `${ip.heading} !important`
                      : `${ip.subtext} !important`,
                  WebkitTextFillColor: schoolSelected || schoolsLoading ? ip.heading : ip.subtext,
                },
              }}
            >
              <MenuItem value={ALL_SCHOOLS_VALUE}>
                <Checkbox checked={allSchoolsSelected} size="small" />
                <ListItemText primary="All schools" />
              </MenuItem>
              <MenuItem value={NO_SCHOOL_FILTER_VALUE}>
                <Checkbox
                  checked={!allSchoolsSelected && selectedSchoolIds.includes(NO_SCHOOL_FILTER_VALUE)}
                  size="small"
                />
                <ListItemText
                  primary="No specific school"
                  secondary="Unrostered students & pending invites"
                  primaryTypographyProps={{ fontWeight: 600, color: ip.heading }}
                  secondaryTypographyProps={{ sx: { color: ip.subtext, fontSize: '0.7rem' } }}
                />
              </MenuItem>
              {schools.map((school) => (
                <MenuItem key={school.id} value={school.id}>
                  <Checkbox
                    checked={!allSchoolsSelected && selectedSchoolIds.includes(school.id)}
                    size="small"
                  />
                  <ListItemText
                    primary={`${school.school_name || school.id} (${school.student_count ?? 0})`}
                    secondary={
                      isPlatformAdminTestSchool(school.id)
                        ? `${school.id} · Test`
                        : school.id
                    }
                    primaryTypographyProps={{ fontWeight: 600, color: ip.heading }}
                    secondaryTypographyProps={{ sx: { color: ip.subtext, fontSize: '0.7rem' } }}
                  />
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box
            sx={{
              ...platformAdminFilterToolbarRowSx,
              mt: 1.75,
              pt: 1.75,
              borderTop: `1px solid ${ip.cardBorder}`,
            }}
          >
            <TextField
              size="small"
              placeholder="Search name, email, school…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: ip.subtext, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                ...platformAdminSearchFieldSx,
                flex: '1 1 220px',
                minWidth: 200,
              }}
            />
            <PlatformAdminFilterControl
              id="students-status-filter"
              label="Status"
              value={statusFilter}
              labels={STATUS_LABELS}
              minWidth={148}
              onChange={setStatusFilter}
            />
            <PlatformAdminFilterControl
              id="students-roster-filter"
              label="Roster"
              value={rosterFilter}
              labels={ROSTER_LABELS}
              minWidth={140}
              onChange={handleRosterFilterChange}
            />
            <PlatformAdminFilterControl
              id="students-grade-filter"
              label="Grade"
              value={gradeFilter}
              labels={GRADE_LABELS}
              minWidth={132}
              onChange={setGradeFilter}
            />
            <PlatformAdminFilterControl
              id="students-membership-filter"
              label="Membership"
              value={membershipFilter}
              labels={MEMBERSHIP_LABELS}
              minWidth={148}
              onChange={setMembershipFilter}
            />
            {(hasSecondaryFilters || schoolSelected) && (
              <Button
                size="small"
                startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  clearSecondaryFilters();
                  clearSchoolSelection();
                }}
                sx={platformAdminClearFiltersButtonSx}
              >
                Clear
              </Button>
            )}
          </Box>

          {activeFilterChips.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              {activeFilterChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  size="small"
                  onDelete={chip.onDelete}
                  sx={{
                    bgcolor: ip.sidebarActiveBg,
                    color: ip.sidebarActiveText,
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': { color: ip.sidebarActiveText, fontSize: 16 },
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!canLoadStudents ? (
        <Card sx={platformAdminCardSx}>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 40, color: ip.subtext, mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 0.75 }}>
              Select a school to view students
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, maxWidth: 420, mx: 'auto' }}>
              Choose one or more schools (or All schools) in the School* filter above to load results.
              To find students with no school, plus pending invites, choose &quot;No specific
              school&quot;.
            </Typography>
          </CardContent>
        </Card>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: ip.navy }} />
        </Box>
      ) : (
        <PlatformAdminTableSection
          countLabel={`Showing ${sortedStudents.length} student${sortedStudents.length === 1 ? '' : 's'}`}
        >
          {sortedStudents.length === 0 ? (
            <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
              <Table
                size="medium"
                sx={{ ...platformAdminTableSx, tableLayout: 'fixed', width: '100%', minWidth: 960 }}
              >
                <TableHead>
                  <TableRow sx={platformAdminTableHeadRowSx}>
                    <TableCell sx={studentColSx('name')}>
                      <TableSortLabel
                        active={sortKey === 'name'}
                        direction={sortKey === 'name' ? sortDir : 'asc'}
                        onClick={() => toggleSort('name')}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={studentColSx('email')}>Email</TableCell>
                    <TableCell sx={studentColSx('school')}>School</TableCell>
                    <TableCell sx={studentColSx('grade')}>Grade</TableCell>
                    <TableCell sx={studentColSx('membership')}>Membership</TableCell>
                    <TableCell sx={studentColSx('coins')} align="right">
                      <TableSortLabel
                        active={sortKey === 'coins'}
                        direction={sortKey === 'coins' ? sortDir : 'desc'}
                        onClick={() => toggleSort('coins')}
                      >
                        Coins
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={studentColSx('status')}>Status</TableCell>
                    <TableCell sx={studentColSx('joined')}>
                      <TableSortLabel
                        active={sortKey === 'joined'}
                        direction={sortKey === 'joined' ? sortDir : 'desc'}
                        onClick={() => toggleSort('joined')}
                      >
                        Joined
                      </TableSortLabel>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell align="right" sx={studentColSx('actions')}>
                        Actions
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={tableColSpan} align="center" sx={{ py: 5, color: ip.subtext }}>
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableVirtuoso
              style={{ height: Math.min(PLATFORM_STUDENTS_VIRTUOSO_HEIGHT, 72 + sortedStudents.length * 56) }}
              data={sortedStudents}
              components={PlatformStudentsVirtuosoComponents}
              fixedHeaderContent={() => (
                <TableRow sx={platformAdminTableHeadRowSx}>
                  <TableCell sx={studentColSx('name')}>
                    <TableSortLabel
                      active={sortKey === 'name'}
                      direction={sortKey === 'name' ? sortDir : 'asc'}
                      onClick={() => toggleSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={studentColSx('email')}>Email</TableCell>
                  <TableCell sx={studentColSx('school')}>School</TableCell>
                  <TableCell sx={studentColSx('grade')}>Grade</TableCell>
                  <TableCell sx={studentColSx('membership')}>Membership</TableCell>
                  <TableCell sx={studentColSx('coins')} align="right">
                    <TableSortLabel
                      active={sortKey === 'coins'}
                      direction={sortKey === 'coins' ? sortDir : 'desc'}
                      onClick={() => toggleSort('coins')}
                    >
                      Coins
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={studentColSx('status')}>Status</TableCell>
                  <TableCell sx={studentColSx('joined')}>
                    <TableSortLabel
                      active={sortKey === 'joined'}
                      direction={sortKey === 'joined' ? sortDir : 'desc'}
                      onClick={() => toggleSort('joined')}
                    >
                      Joined
                    </TableSortLabel>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell align="right" sx={studentColSx('actions')}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              )}
              itemContent={(_index, student) => (
                <>
                  <TableCell sx={studentColSx('name', { fontWeight: 600, color: ip.heading })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: student.is_invite ? ip.subtext : ip.heading,
                          fontStyle: student.is_invite ? 'italic' : 'normal',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {student.is_invite
                          ? 'Not yet registered'
                          : [student.first_name, student.last_name].filter(Boolean).join(' ') ||
                            ' - '}
                      </Typography>
                      {isPlatformAdminTestStudent(student) && (
                        <PlatformAdminChip label="Test" tone="info" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={studentColSx('email', {
                      color: ip.heading,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    })}
                  >
                    <Tooltip title={student.email || ''} placement="top-start">
                      <Box component="span">{student.email || ' - '}</Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={studentColSx('school')}>
                    {student.school_name ? (
                      <>
                        <Tooltip title={student.school_name} placement="top-start">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: ip.heading,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {student.school_name}
                          </Typography>
                        </Tooltip>
                        <Typography
                          variant="caption"
                          sx={{
                            color: ip.subtext,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {student.school_id}
                        </Typography>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: ip.subtext,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {student.school_id && student.school_id !== NOT_LISTED_SCHOOL_ID
                          ? student.school_id
                          : 'No specific school'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={studentColSx('grade', { color: ip.heading, fontWeight: 600 })}>
                    {student.grade ?? ' - '}
                  </TableCell>
                  <TableCell sx={studentColSx('membership', { color: ip.heading, whiteSpace: 'nowrap' })}>
                    {student.membership_level != null ? `Level ${student.membership_level}` : ' - '}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={studentColSx('coins', { color: ip.heading, fontWeight: 700, whiteSpace: 'nowrap' })}
                  >
                    {typeof student.argus_coins === 'number' ? student.argus_coins.toLocaleString() : '0'}
                  </TableCell>
                  <TableCell sx={studentColSx('status')}>
                    {student.is_invite ? (
                      <PlatformAdminChip label="Invited" tone="warning" />
                    ) : student.approval_status ? (
                      <PlatformAdminChip
                        label={
                          student.approval_status.toLowerCase() === 'approved'
                            ? 'Payment complete'
                            : student.approval_status.toLowerCase() === 'pending_payment' ||
                                student.approval_status.toLowerCase() === 'pending'
                              ? 'Payment incomplete'
                              : student.approval_status
                        }
                        tone={
                          student.approval_status.toLowerCase() === 'approved' ? 'success' : 'warning'
                        }
                      />
                    ) : (
                      ' - '
                    )}
                  </TableCell>
                  <TableCell sx={studentColSx('joined', { color: ip.subtext, whiteSpace: 'nowrap' })}>
                    {formatDate(student.created_at)}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell align="right" sx={studentColSx('actions', { whiteSpace: 'nowrap' })}>
                      {student.is_invite ? (
                        <Button
                          size="small"
                          disabled={revokeBusyEmail === student.email}
                          onClick={() => void handleRevokeComplimentaryInvite(student.email)}
                          sx={platformAdminTextButtonSx}
                        >
                          {revokeBusyEmail === student.email ? 'Revoking…' : 'Revoke invite'}
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          startIcon={<ViewIcon sx={{ fontSize: 18 }} />}
                          onClick={() => navigate(`/platform-admin/students/${student.uid}`)}
                          sx={platformAdminTextButtonSx}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  )}
                </>
              )}
            />
          )}
        </PlatformAdminTableSection>
      )}

      {isSuperAdmin && (
      <Dialog
        open={inviteDialogOpen}
        onClose={() => !inviteBusy && setInviteDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading, px: 3, pt: 2.5, pb: 1 }}>
          Invite free student
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 3, pt: 1, pb: 1 }}>
          <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.55 }}>
            The student registers at the normal signup flow with this email. They are not added to
            any school roster. Payment is waived up to the package you select.
          </Typography>
          <Box>
            <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="comp-invite-email">
              Student email
            </Typography>
            <TextField
              id="comp-invite-email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="student@example.com"
              sx={platformAdminDialogTextFieldSx}
            />
          </Box>
          <Box>
            <Typography
              sx={platformAdminDialogFieldLabelSx}
              component="label"
              htmlFor="comp-invite-level"
            >
              Complimentary package
            </Typography>
            <Select
              id="comp-invite-level"
              fullWidth
              size="small"
              value={inviteLevel}
              onChange={(e) => setInviteLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
              sx={platformAdminDialogSelectSx}
            >
              {([1, 2, 3, 4] as const).map((level) => (
                <MenuItem key={level} value={level}>
                  Level {level} · {MEMBERSHIP_LEVEL_LABEL[level]}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setInviteDialogOpen(false)}
            disabled={inviteBusy}
            sx={platformAdminTextButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateComplimentaryInvite()}
            disabled={inviteBusy || !inviteEmail.trim()}
            sx={platformAdminPrimaryButtonSx}
          >
            {inviteBusy ? 'Sending…' : 'Send invite'}
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </Box>
  );
};

export default PlatformAdminStudentsPage;
