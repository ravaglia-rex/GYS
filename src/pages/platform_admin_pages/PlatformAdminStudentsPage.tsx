import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  MenuList,
  Checkbox,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popper,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  CheckCircleOutline as ActiveIcon,
  School as SchoolIcon,
  Payments as SelfPaidIcon,
  PersonOff as OthersIcon,
  MarkEmailUnread as PendingInviteIcon,
  Visibility as ViewIcon,
  CardGiftcard as ComplimentaryIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { TableVirtuoso } from 'react-virtuoso';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import {
  createPlatformAdminComplimentaryInvite,
  listPlatformAdminStudents,
  revokePlatformAdminComplimentaryInvite,
  type PlatformAdminStudentRow,
} from '../../db/platformAdminCollection';
import {
  usePlatformAdminSchools,
  usePlatformAdminStudentStats,
  usePlatformAdminStudents,
} from '../../query/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import {
  platformAdminCardSx,
  platformAdminClearFiltersButtonSx,
  platformAdminDialogAutocompleteSx,
  platformAdminDialogFieldLabelSx,
  platformAdminDialogPaperSx,
  platformAdminDialogSelectSx,
  platformAdminDialogTextFieldSx,
  platformAdminFilterToolbarRowSx,
  platformAdminOutlinedButtonSx,
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
type PaymentFilter = 'all' | 'self_paid' | 'membership_upgrade' | 'individual';
type AccountFilter = 'all' | 'registered' | 'invite';
type GradeFilter = 'all' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
type MembershipFilter = 'all' | '1' | '2' | '3' | '3_plus';
type StudentStatFilter =
  | 'on_roster'
  | 'active'
  | 'account_no_password'
  | 'no_account'
  | 'individual'
  | 'others';

/** Roster export buckets — mirrors the four roster-related stats cards. */
type StudentExportBucket = 'on_roster' | 'fully_setup' | 'account_no_password' | 'no_account';

const STUDENT_EXPORT_OPTIONS: {
  bucket: StudentExportBucket;
  label: string;
  fileLabel: string;
  filters: {
    roster: 'yes';
    setup?: 'complete' | 'incomplete';
    account?: 'registered' | 'invite';
  };
}[] = [
  {
    bucket: 'on_roster',
    label: 'All on Roster',
    fileLabel: 'All_on_Roster',
    filters: { roster: 'yes' },
  },
  {
    bucket: 'fully_setup',
    label: 'Fully Set Up',
    fileLabel: 'Fully_Set_Up',
    filters: { roster: 'yes', setup: 'complete', account: 'registered' },
  },
  {
    bucket: 'account_no_password',
    label: 'Account, No Password',
    fileLabel: 'Account_No_Password',
    filters: { roster: 'yes', setup: 'incomplete', account: 'registered' },
  },
  {
    bucket: 'no_account',
    label: 'No Account Yet',
    fileLabel: 'No_Account_Yet',
    filters: { roster: 'yes', account: 'invite' },
  },
];

function deriveStudentExportStatus(row: PlatformAdminStudentRow): string {
  if (row.is_invite) return 'No Account Yet';
  if (row.password_setup_complete === true) return 'Fully Set Up';
  return 'Account, No Password';
}

function formatExportJoinedDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sanitizeExportFileToken(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60) || 'School';
}

function studentExportEmail(row: PlatformAdminStudentRow): string {
  if (row.login_email_is_synthetic && row.login_user_id) return row.login_user_id;
  return row.email || '';
}

function membershipExportLabel(level: number | null | undefined): string {
  if (level == null) return '';
  const named = MEMBERSHIP_LEVEL_LABEL[level as 1 | 2 | 3 | 4];
  return named ? `Level ${level} · ${named}` : `Level ${level}`;
}
const ALL_SCHOOLS_VALUE = '__all__';
/** Must match the backend's NO_SCHOOL_FILTER_VALUE sentinel in platformAdminCollection/index.ts. */
const NO_SCHOOL_FILTER_VALUE = '__no_school__';
/** School filter takes most of the row; search gets the remainder. */
const SCHOOL_FILTER_FLEX = '6 1 0%';
const SEARCH_FILTER_FLEX = '4 1 0%';
/** Matches the backend's NOT_LISTED_SCHOOL_ID (students who picked "school not listed" at signup). */
const NOT_LISTED_SCHOOL_ID = 'not-listed';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All statuses',
  approved: 'Payment complete',
  pending: 'Payment incomplete',
};

const ROSTER_LABELS: Record<RosterFilter, string> = {
  all: 'All roster',
  yes: 'Linked to a school',
  no: 'Not linked to a school',
};

/** Compact closed-select labels; menu + filter chips keep ROSTER_LABELS. */
const ROSTER_VALUE_LABELS: Partial<Record<RosterFilter, string>> = {
  yes: 'Linked',
  no: 'Not linked',
};

const SETUP_LABELS: Record<SetupFilter, string> = {
  all: 'All setup',
  complete: 'Password set',
  incomplete: 'No password yet',
};

const PAYMENT_LABELS: Record<PaymentFilter, string> = {
  all: 'All payments',
  self_paid: 'Self-paid',
  membership_upgrade: 'Membership upgrade',
  individual: 'Self-paid & upgrades',
};

const ACCOUNT_LABELS: Record<AccountFilter, string> = {
  all: 'All accounts',
  registered: 'Has account',
  invite: 'Invite only',
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

/**
 * Fixed % widths so TableVirtuoso rows don't reflow columns as rows virtualize in/out.
 * The joined date lives on the student detail page only, which leaves Status enough room to show
 * labels like "Payment incomplete" without clipping.
 */
const STUDENT_COL = {
  name: { width: '14%', minWidth: 110 },
  email: { width: '16%', minWidth: 140 },
  school: { width: '15%', minWidth: 120 },
  grade: { width: '5%', minWidth: 52 },
  membership: { width: '8%', minWidth: 80 },
  coins: { width: '9%', minWidth: 88 },
  qod: { width: '9%', minWidth: 88 },
  status: { width: '16%', minWidth: 140 },
  actions: { width: '11%', minWidth: 104 },
} as const;

/** `joined` has no column header; it stays the default order (newest accounts first). */
type StudentSortKey =
  | 'coins'
  | 'qod'
  | 'joined'
  | 'name'
  | 'login_streak'
  | 'qod_streak'
  | 'practice';
type StudentSortDir = 'asc' | 'desc';

const STUDENT_SORT_LABELS: Record<StudentSortKey, string> = {
  joined: 'Joined (newest)',
  name: 'Name',
  coins: 'Coins (balance)',
  qod: 'QoD attempted',
  login_streak: 'Login streak (longest)',
  qod_streak: 'QoD streak (longest)',
  practice: 'Practice sessions',
};

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
  const queryClient = useQueryClient();
  const platformAdminRole = useSelector((state: RootState) => state.auth.platformAdminRole);
  const isSuperAdmin = platformAdminRole === 'super';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
  const initialRoster = (searchParams.get('roster') as RosterFilter) || 'all';
  const initialSetup = (searchParams.get('setup') as SetupFilter) || 'all';
  const initialPayment = (searchParams.get('payment') as PaymentFilter) || 'all';
  const initialAccount = (searchParams.get('account') as AccountFilter) || 'all';
  const initialGrade = (searchParams.get('grade') as GradeFilter) || 'all';
  const initialMembership = (searchParams.get('membership') as MembershipFilter) || 'all';
  const initialSchool = parseInitialSchoolSelection(searchParams.get('schools'));

  const [allSchoolsSelected, setAllSchoolsSelected] = useState(initialSchool.allSchoolsSelected);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>(initialSchool.selectedSchoolIds);
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false);
  const schoolMenuAnchorRef = useRef<HTMLButtonElement | null>(null);
  const schoolMenuPaperRef = useRef<HTMLDivElement | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
    ['all', 'self_paid', 'membership_upgrade', 'individual'].includes(initialPayment)
      ? initialPayment
      : 'all'
  );
  const [accountFilter, setAccountFilter] = useState<AccountFilter>(
    ['all', 'registered', 'invite'].includes(initialAccount) ? initialAccount : 'all'
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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSchoolId, setExportSchoolId] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [exportDialogError, setExportDialogError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const schoolSelected = allSchoolsSelected || selectedSchoolIds.length > 0;
  /** Unlinked students have no school_id - allow loading them without picking a school. */
  const canLoadStudents = schoolSelected || rosterFilter === 'no';

  // Close the school Popper on outside click / Escape. Avoid MUI ClickAwayListener —
  // its ESM build is named-export-only, and barrel imports have resolved to undefined
  // at runtime ("Element type is invalid … got: undefined").
  useEffect(() => {
    if (!schoolMenuOpen) return undefined;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (schoolMenuAnchorRef.current?.contains(target)) return;
      if (schoolMenuPaperRef.current?.contains(target)) return;
      setSchoolMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSchoolMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [schoolMenuOpen]);
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      search && canLoadStudents ? 300 : 0
    );
    return () => clearTimeout(timer);
  }, [search, canLoadStudents]);

  const schoolsQuery = usePlatformAdminSchools({ limit: 200 });
  const statsQuery = usePlatformAdminStudentStats();
  const studentListParams = useMemo(() => {
    const school_ids =
      rosterFilter === 'no' || allSchoolsSelected ? ('all' as const) : selectedSchoolIds;
    return {
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      roster: rosterFilter === 'all' ? undefined : rosterFilter,
      setup: setupFilter === 'all' ? undefined : setupFilter,
      payment: paymentFilter === 'all' ? undefined : paymentFilter,
      account: accountFilter === 'all' ? undefined : accountFilter,
      grade: gradeFilter === 'all' ? undefined : gradeFilter,
      membership: membershipFilter === 'all' ? undefined : membershipFilter,
      school_ids,
      limit: 500,
    };
  }, [
    debouncedSearch,
    statusFilter,
    rosterFilter,
    setupFilter,
    paymentFilter,
    accountFilter,
    gradeFilter,
    membershipFilter,
    allSchoolsSelected,
    selectedSchoolIds,
  ]);
  const studentsQuery = usePlatformAdminStudents(studentListParams, canLoadStudents);

  const schools = useMemo(() => schoolsQuery.data ?? [], [schoolsQuery.data]);
  const schoolsLoading = schoolsQuery.isLoading;
  const stats = statsQuery.data ?? null;
  const rosterAccountPending = stats
    ? Math.max(0, stats.students_rostered - stats.students_active)
    : null;
  const individualPaidCount = stats
    ? stats.students_self_paid + stats.students_membership_upgrade
    : null;
  const students = useMemo(
    () => (canLoadStudents ? studentsQuery.data?.students ?? [] : []),
    [canLoadStudents, studentsQuery.data?.students]
  );
  const totalMatching = canLoadStudents ? studentsQuery.data?.totalMatching ?? 0 : 0;
  const loading = canLoadStudents && studentsQuery.isLoading;
  const error =
    schoolsQuery.isError
      ? 'Failed to load schools.'
      : canLoadStudents && studentsQuery.isError
        ? 'Failed to load students.'
        : null;

  const invalidateStudentQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['platformAdminStudents'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.platformAdminStudentStats() });
  }, [queryClient]);

  const schoolNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const school of schools) {
      map.set(school.id, school.school_name || school.id);
    }
    return map;
  }, [schools]);

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
    accountFilter !== 'all' ||
    gradeFilter !== 'all' ||
    membershipFilter !== 'all' ||
    search.trim().length > 0;

  const clearSecondaryFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRosterFilter('all');
    setSetupFilter('all');
    setPaymentFilter('all');
    setAccountFilter('all');
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
    if (
      rosterFilter === 'yes' &&
      setupFilter === 'all' &&
      paymentFilter === 'all' &&
      accountFilter === 'all'
    ) {
      return 'on_roster';
    }
    if (
      rosterFilter === 'yes' &&
      setupFilter === 'complete' &&
      paymentFilter === 'all' &&
      accountFilter === 'registered'
    ) {
      return 'active';
    }
    if (
      rosterFilter === 'yes' &&
      setupFilter === 'incomplete' &&
      paymentFilter === 'all' &&
      accountFilter === 'registered'
    ) {
      return 'account_no_password';
    }
    if (
      rosterFilter === 'yes' &&
      setupFilter === 'all' &&
      paymentFilter === 'all' &&
      accountFilter === 'invite'
    ) {
      return 'no_account';
    }
    if (
      paymentFilter === 'individual' &&
      setupFilter === 'all' &&
      rosterFilter === 'all' &&
      accountFilter === 'registered'
    ) {
      return 'individual';
    }
    if (
      rosterFilter === 'no' &&
      setupFilter === 'incomplete' &&
      paymentFilter === 'all' &&
      accountFilter === 'registered'
    ) {
      return 'others';
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
    accountFilter,
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
      case 'on_roster':
        setRosterFilter('yes');
        setSetupFilter('all');
        setPaymentFilter('all');
        setAccountFilter('all');
        break;
      case 'active':
        setRosterFilter('yes');
        setSetupFilter('complete');
        setPaymentFilter('all');
        setAccountFilter('registered');
        break;
      case 'account_no_password':
        setRosterFilter('yes');
        setSetupFilter('incomplete');
        setPaymentFilter('all');
        setAccountFilter('registered');
        break;
      case 'no_account':
        setRosterFilter('yes');
        setSetupFilter('all');
        setPaymentFilter('all');
        setAccountFilter('invite');
        break;
      case 'individual':
        setRosterFilter('all');
        setSetupFilter('all');
        setPaymentFilter('individual');
        setAccountFilter('registered');
        break;
      case 'others':
        setRosterFilter('no');
        setSetupFilter('incomplete');
        setPaymentFilter('all');
        setAccountFilter('registered');
        break;
      default:
        break;
    }
  };

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
      await invalidateStudentQueries();
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
      await invalidateStudentQueries();
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
    if (accountFilter !== 'all') params.set('account', accountFilter);
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
    accountFilter,
    gradeFilter,
    membershipFilter,
    setSearchParams,
  ]);

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

  const toggleSchoolMenuOption = (value: string) => {
    if (value === ALL_SCHOOLS_VALUE) {
      handleSchoolSelectChange([ALL_SCHOOLS_VALUE]);
      return;
    }
    if (allSchoolsSelected) {
      handleSchoolSelectChange([value]);
      return;
    }
    const next = selectedSchoolIds.includes(value)
      ? selectedSchoolIds.filter((id) => id !== value)
      : [...selectedSchoolIds, value];
    handleSchoolSelectChange(next);
  };

  const schoolFilterLabel = useMemo(() => {
    if (allSchoolsSelected) return 'All schools';
    if (selectedSchoolIds.length === 0) {
      return schoolsLoading ? 'Loading schools…' : 'Select school(s) - required';
    }
    if (selectedSchoolIds.length === 1) {
      const id = selectedSchoolIds[0];
      if (id === NO_SCHOOL_FILTER_VALUE) return 'No specific school';
      const school = schools.find((s) => s.id === id);
      const name = school?.school_name || schoolNameById.get(id) || id;
      const count = school?.student_count ?? 0;
      return `${name} (${count})`;
    }
    return `${selectedSchoolIds.length} schools`;
  }, [
    allSchoolsSelected,
    selectedSchoolIds,
    schoolsLoading,
    schools,
    schoolNameById,
  ]);

  const activeFilterChips = useMemo(() => {
    // Chips are prefixed with the filter they came from - several filters share school wording
    // ("All schools" scope vs "Not linked to a school" roster), which reads as a contradiction
    // once the chips sit side by side.
    const chips: { key: string; label: string; onDelete: () => void }[] = [];
    if (allSchoolsSelected) {
      chips.push({ key: 'schools', label: 'School: All schools', onDelete: clearSchoolSelection });
    } else if (selectedSchoolIds.length === 1) {
      const id = selectedSchoolIds[0];
      chips.push({
        key: 'schools',
        label: `School: ${
          id === NO_SCHOOL_FILTER_VALUE ? 'No specific school' : schoolNameById.get(id) || id
        }`,
        onDelete: clearSchoolSelection,
      });
    } else if (selectedSchoolIds.length > 1) {
      chips.push({
        key: 'schools',
        label: `School: ${selectedSchoolIds.length} schools`,
        onDelete: clearSchoolSelection,
      });
    }
    if (statusFilter !== 'all') {
      chips.push({ key: 'status', label: STATUS_LABELS[statusFilter], onDelete: () => setStatusFilter('all') });
    }
    if (rosterFilter !== 'all') {
      chips.push({
        key: 'roster',
        label: `Roster: ${ROSTER_LABELS[rosterFilter]}`,
        onDelete: () => setRosterFilter('all'),
      });
    }
    if (setupFilter !== 'all') {
      chips.push({
        key: 'setup',
        label: `Setup: ${SETUP_LABELS[setupFilter]}`,
        onDelete: () => setSetupFilter('all'),
      });
    }
    if (paymentFilter !== 'all') {
      chips.push({
        key: 'payment',
        label: `Payment: ${PAYMENT_LABELS[paymentFilter]}`,
        onDelete: () => setPaymentFilter('all'),
      });
    }
    if (accountFilter !== 'all') {
      chips.push({
        key: 'account',
        label: ACCOUNT_LABELS[accountFilter],
        onDelete: () => setAccountFilter('all'),
      });
    }
    if (gradeFilter !== 'all') {
      chips.push({ key: 'grade', label: GRADE_LABELS[gradeFilter], onDelete: () => setGradeFilter('all') });
    }
    if (membershipFilter !== 'all') {
      chips.push({
        key: 'membership',
        label: `Membership: ${MEMBERSHIP_LABELS[membershipFilter]}`,
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
    accountFilter,
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
      if (sortKey === 'qod') {
        const aQod = a.qod_attempted_total ?? 0;
        const bQod = b.qod_attempted_total ?? 0;
        if (aQod !== bQod) return (aQod - bQod) * dir;
        return ((a.qod_accuracy_pct ?? 0) - (b.qod_accuracy_pct ?? 0)) * dir;
      }
      if (sortKey === 'login_streak') {
        return ((a.login_streak_longest ?? 0) - (b.login_streak_longest ?? 0)) * dir;
      }
      if (sortKey === 'qod_streak') {
        return ((a.qod_streak_longest ?? 0) - (b.qod_streak_longest ?? 0)) * dir;
      }
      if (sortKey === 'practice') {
        return ((a.practice_sessions_total ?? 0) - (b.practice_sessions_total ?? 0)) * dir;
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

  const openExportDialog = () => {
    // Prefill from the page filter when exactly one real school is already selected.
    const prefill =
      !allSchoolsSelected &&
      selectedSchoolIds.length === 1 &&
      selectedSchoolIds[0] !== NO_SCHOOL_FILTER_VALUE
        ? selectedSchoolIds[0]
        : '';
    setExportSchoolId(prefill);
    setExportDialogError(null);
    setExportDialogOpen(true);
  };

  const handleExport = async (bucket: StudentExportBucket) => {
    if (exportBusy) return;
    if (!exportSchoolId) {
      setExportDialogError('Select a school to export.');
      return;
    }
    const option = STUDENT_EXPORT_OPTIONS.find((o) => o.bucket === bucket);
    if (!option) return;

    setExportBusy(true);
    setExportDialogError(null);
    setExportError(null);
    setExportMessage(null);
    try {
      const result = await listPlatformAdminStudents({
        school_ids: [exportSchoolId],
        roster: option.filters.roster,
        setup: option.filters.setup,
        account: option.filters.account,
        limit: 5000,
        export: true,
      });

      const sheetRows = result.students.map((row) => {
        return {
          'First Name': row.first_name || '',
          'Last Name': row.last_name || '',
          'Email / User ID': studentExportEmail(row),
          Grade: row.grade ?? '',
          Section: row.section || '',
          School: row.school_name || '',
          Status: deriveStudentExportStatus(row),
          'Membership Level': membershipExportLabel(row.membership_level),
          'Joined Date': formatExportJoinedDate(row.created_at),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(sheetRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      const dateStamp = new Date().toISOString().slice(0, 10);
      const schoolToken = sanitizeExportFileToken(
        schoolNameById.get(exportSchoolId) || exportSchoolId
      );
      const filename = `${schoolToken}_${option.fileLabel}_${dateStamp}.xlsx`;
      XLSX.writeFile(workbook, filename);

      const clipped =
        result.totalMatching > result.students.length
          ? ` (showing ${result.students.length.toLocaleString()} of ${result.totalMatching.toLocaleString()} matching)`
          : '';
      setExportDialogOpen(false);
      setExportMessage(
        `Exported ${result.students.length.toLocaleString()} student${
          result.students.length === 1 ? '' : 's'
        } — ${option.label}${clipped}.`
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setExportDialogError(
        err?.response?.data?.error || err?.message || 'Failed to export students.'
      );
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Students"
        subtitle="Total = accounts with password set. Self-paid = individual signup with no school. Upgrades = school-roster kids with individual / upgrade payment. Roster pending + Others cover incomplete setup."
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              disabled={exportBusy}
              onClick={openExportDialog}
              sx={platformAdminOutlinedButtonSx}
            >
              Export
            </Button>
            {isSuperAdmin ? (
              <Button
                variant="contained"
                startIcon={<ComplimentaryIcon />}
                onClick={openInviteDialog}
                sx={platformAdminPrimaryButtonSx}
              >
                Invite free student
              </Button>
            ) : null}
          </Box>
        }
      />

      {deleteSuccessMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {deleteSuccessMessage}
        </Alert>
      )}
      {exportMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setExportMessage(null)}>
          {exportMessage}
        </Alert>
      )}
      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
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
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(6, 1fr)',
          },
        }}
      >
        <PlatformAdminStatCard
          title="Total on Roster"
          value={stats?.students_on_roster ?? '-'}
          subtitle="Invited to a school roster"
          icon={<SchoolIcon sx={{ fontSize: 22 }} />}
          accent={ip.statBlue}
          selected={activeStatFilter === 'on_roster'}
          onClick={() => applyStatFilter('on_roster')}
        />
        <PlatformAdminStatCard
          title="Fully Set Up"
          value={stats?.students_active ?? '-'}
          subtitle="On roster · account + password"
          icon={<ActiveIcon sx={{ fontSize: 22 }} />}
          accent={ip.approveGreen}
          selected={activeStatFilter === 'active'}
          onClick={() => applyStatFilter('active')}
        />
        <PlatformAdminStatCard
          title="Account, No Password"
          value={rosterAccountPending ?? '-'}
          subtitle="On roster · account created, password pending"
          icon={<PeopleIcon sx={{ fontSize: 22 }} />}
          accent="#B45309"
          selected={activeStatFilter === 'account_no_password'}
          onClick={() => applyStatFilter('account_no_password')}
        />
        <PlatformAdminStatCard
          title="No Account Yet"
          value={stats?.students_pending_invite ?? '-'}
          subtitle="On roster · no account created"
          icon={<PendingInviteIcon sx={{ fontSize: 22 }} />}
          accent="#B45309"
          selected={activeStatFilter === 'no_account'}
          onClick={() => applyStatFilter('no_account')}
        />
        <PlatformAdminStatCard
          title="Self-paid & Upgrades"
          value={individualPaidCount ?? '-'}
          subtitle={
            stats
              ? `${stats.students_self_paid} self-paid · ${stats.students_membership_upgrade} upgrades`
              : 'Paid individually (any route)'
          }
          icon={<SelfPaidIcon sx={{ fontSize: 22 }} />}
          accent="#7C3AED"
          selected={activeStatFilter === 'individual'}
          onClick={() => applyStatFilter('individual')}
        />
        <PlatformAdminStatCard
          title="Others"
          value={stats?.students_others ?? '-'}
          subtitle="No school · password pending"
          icon={<OthersIcon sx={{ fontSize: 22 }} />}
          accent={ip.statBlue}
          selected={activeStatFilter === 'others'}
          onClick={() => applyStatFilter('others')}
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
            <Button
              id="students-school-filter"
              ref={schoolMenuAnchorRef}
              type="button"
              disableRipple
              disabled={schoolsLoading}
              aria-haspopup="listbox"
              aria-expanded={schoolMenuOpen ? 'true' : undefined}
              onClick={() => setSchoolMenuOpen((open) => !open)}
              endIcon={
                <KeyboardArrowDownIcon
                  sx={{
                    color: schoolsLoading ? ip.subtext : ip.heading,
                    fontSize: 20,
                    transform: schoolMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 120ms ease',
                  }}
                />
              }
              sx={{
                flex: SCHOOL_FILTER_FLEX,
                minWidth: 280,
                width: 'auto',
                height: 40,
                minHeight: 40,
                justifyContent: 'space-between',
                textTransform: 'none',
                bgcolor: schoolsLoading ? '#F8FAFC' : '#fff',
                color: ip.heading,
                border: `1px solid ${ip.cardBorder}`,
                borderRadius: 1.5,
                boxShadow: 'none',
                px: 1.25,
                '&:hover': {
                  borderColor: ip.navy,
                  bgcolor: '#fff',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  bgcolor: '#F8FAFC',
                  borderColor: ip.cardBorder,
                  opacity: 1,
                },
                '& .MuiButton-endIcon': { ml: 1, mr: 0 },
              }}
            >
              <Typography
                component="span"
                noWrap
                sx={{
                  flex: 1,
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: schoolSelected || schoolsLoading ? ip.heading : ip.subtext,
                }}
              >
                {schoolFilterLabel}
              </Typography>
            </Button>
            <Popper
              open={schoolMenuOpen}
              anchorEl={schoolMenuAnchorRef.current}
              placement="bottom-start"
              disablePortal={false}
              modifiers={[
                { name: 'offset', options: { offset: [0, 4] } },
                { name: 'flip', enabled: false },
                {
                  name: 'preventOverflow',
                  options: { altAxis: false, tether: false, padding: 8 },
                },
              ]}
              sx={{ zIndex: (theme) => theme.zIndex.modal }}
            >
              <Paper
                ref={schoolMenuPaperRef}
                elevation={0}
                sx={{
                      ...platformAdminSelectMenuPaperSx,
                      mt: 0,
                      width: schoolMenuAnchorRef.current?.offsetWidth ?? 420,
                      maxWidth: schoolMenuAnchorRef.current?.offsetWidth ?? 420,
                      maxHeight: 320,
                      overflowY: 'auto',
                    }}
              >
                <MenuList
                  id="students-school-filter-menu"
                  autoFocusItem={false}
                  dense
                  sx={{ py: 0.5 }}
                  aria-labelledby="students-school-filter"
                >
                  <MenuItem
                    dense
                    selected={allSchoolsSelected}
                    onClick={() => toggleSchoolMenuOption(ALL_SCHOOLS_VALUE)}
                    sx={{ alignItems: 'flex-start', py: 0.75 }}
                  >
                    <Checkbox checked={allSchoolsSelected} size="small" sx={{ pt: 0.25 }} />
                    <ListItemText
                      primary="All schools"
                      primaryTypographyProps={{
                        fontWeight: 600,
                        color: ip.heading,
                        noWrap: true,
                      }}
                    />
                  </MenuItem>
                  <MenuItem
                    dense
                    selected={
                      !allSchoolsSelected &&
                      selectedSchoolIds.includes(NO_SCHOOL_FILTER_VALUE)
                    }
                    onClick={() => toggleSchoolMenuOption(NO_SCHOOL_FILTER_VALUE)}
                    sx={{ alignItems: 'flex-start', py: 0.75 }}
                  >
                    <Checkbox
                      checked={
                        !allSchoolsSelected &&
                        selectedSchoolIds.includes(NO_SCHOOL_FILTER_VALUE)
                      }
                      size="small"
                      sx={{ pt: 0.25 }}
                    />
                    <ListItemText
                      primary="No specific school"
                      secondary="Unrostered students & pending invites"
                      primaryTypographyProps={{
                        fontWeight: 600,
                        color: ip.heading,
                        noWrap: true,
                      }}
                      secondaryTypographyProps={{
                        sx: { color: ip.subtext, fontSize: '0.7rem', lineHeight: 1.3 },
                      }}
                    />
                  </MenuItem>
                  {schools.map((school) => {
                    const locationLabel = [school.city, school.state]
                      .filter(Boolean)
                      .join(', ');
                    const secondaryParts = [
                      locationLabel || null,
                      isPlatformAdminTestSchool(school.id) ? 'Test' : null,
                    ].filter(Boolean);
                    const checked =
                      !allSchoolsSelected && selectedSchoolIds.includes(school.id);
                    return (
                      <MenuItem
                        key={school.id}
                        dense
                        title={school.id}
                        selected={checked}
                        onClick={() => toggleSchoolMenuOption(school.id)}
                        sx={{ alignItems: 'flex-start', py: 0.75 }}
                      >
                        <Checkbox checked={checked} size="small" sx={{ pt: 0.25 }} />
                        <ListItemText
                          primary={`${school.school_name || school.id} (${school.student_count ?? 0})`}
                          secondary={
                            secondaryParts.length > 0
                              ? secondaryParts.join(' · ')
                              : undefined
                          }
                          primaryTypographyProps={{
                            fontWeight: 600,
                            color: ip.heading,
                            noWrap: true,
                            title: school.school_name || school.id,
                          }}
                          secondaryTypographyProps={{
                            noWrap: true,
                            sx: {
                              color: ip.subtext,
                              fontSize: '0.7rem',
                              lineHeight: 1.3,
                            },
                          }}
                        />
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Paper>
            </Popper>
            <TextField
              size="small"
              placeholder="Search name, email, or school"
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
                flex: SEARCH_FILTER_FLEX,
                minWidth: 160,
              }}
            />
          </Box>

          <Box
            sx={{
              ...platformAdminFilterToolbarRowSx,
              width: '100%',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              mt: 1.75,
              pt: 1.75,
              borderTop: `1px solid ${ip.cardBorder}`,
            }}
          >
            <PlatformAdminFilterControl
              id="students-sort-filter"
              label="Sort by"
              value={sortKey}
              labels={STUDENT_SORT_LABELS}
              minWidth={168}
              fullWidth
              onChange={(key) => {
                setSortKey(key);
                setSortDir(key === 'name' ? 'asc' : 'desc');
              }}
            />
            <PlatformAdminFilterControl
              id="students-status-filter"
              label="Status"
              value={statusFilter}
              labels={STATUS_LABELS}
              minWidth={148}
              fullWidth
              onChange={setStatusFilter}
            />
            <PlatformAdminFilterControl
              id="students-roster-filter"
              label="Roster"
              value={rosterFilter}
              labels={ROSTER_LABELS}
              valueLabels={ROSTER_VALUE_LABELS}
              minWidth={120}
              fullWidth
              onChange={handleRosterFilterChange}
            />
            <PlatformAdminFilterControl
              id="students-grade-filter"
              label="Grade"
              value={gradeFilter}
              labels={GRADE_LABELS}
              minWidth={132}
              fullWidth
              onChange={setGradeFilter}
            />
            <PlatformAdminFilterControl
              id="students-membership-filter"
              label="Membership"
              value={membershipFilter}
              labels={MEMBERSHIP_LABELS}
              minWidth={148}
              fullWidth
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
                sx={{ ...platformAdminClearFiltersButtonSx, flexShrink: 0 }}
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
          countLabel={
            totalMatching > sortedStudents.length
              ? `Showing ${sortedStudents.length} of ${totalMatching} matching students`
              : `Showing ${sortedStudents.length} student${sortedStudents.length === 1 ? '' : 's'}`
          }
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
                        Balance / Life
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={studentColSx('qod')} align="right">
                      <TableSortLabel
                        active={sortKey === 'qod'}
                        direction={sortKey === 'qod' ? sortDir : 'desc'}
                        onClick={() => toggleSort('qod')}
                      >
                        QoD
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={studentColSx('status')}>Status</TableCell>
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
                      Balance / Life
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={studentColSx('qod')} align="right">
                    <TableSortLabel
                      active={sortKey === 'qod'}
                      direction={sortKey === 'qod' ? sortDir : 'desc'}
                      onClick={() => toggleSort('qod')}
                    >
                      QoD
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={studentColSx('status')}>Status</TableCell>
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
                        {student.school_id && student.school_id !== NOT_LISTED_SCHOOL_ID ? (
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
                        ) : null}
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
                    {(typeof student.argus_coins === 'number' ? student.argus_coins : 0).toLocaleString()}
                    <Typography
                      component="span"
                      sx={{ color: ip.subtext, fontWeight: 500, fontSize: '0.75rem', ml: 0.5 }}
                    >
                      /{' '}
                      {(typeof student.coins_lifetime_earned === 'number'
                        ? student.coins_lifetime_earned
                        : 0
                      ).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={studentColSx('qod', { color: ip.heading, whiteSpace: 'nowrap' })}
                  >
                    {(student.qod_attempted_total ?? 0) > 0 ? (
                      <>
                        <Typography component="span" sx={{ fontWeight: 700, fontSize: 'inherit' }}>
                          {(student.qod_attempted_total ?? 0).toLocaleString()}
                        </Typography>
                        <Typography component="span" sx={{ color: ip.subtext, fontSize: '0.75rem', ml: 0.5 }}>
                          · {student.qod_accuracy_pct ?? 0}%
                        </Typography>
                      </>
                    ) : (
                      '0'
                    )}
                  </TableCell>
                  <TableCell sx={studentColSx('status', { whiteSpace: 'nowrap' })}>
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
                  {isSuperAdmin && (
                    <TableCell align="right" sx={studentColSx('actions', { whiteSpace: 'nowrap' })}>
                      {student.is_invite && student.uid.startsWith('invite:') ? (
                        <Button
                          size="small"
                          disabled={revokeBusyEmail === student.email}
                          onClick={() => void handleRevokeComplimentaryInvite(student.email)}
                          sx={platformAdminTextButtonSx}
                        >
                          {revokeBusyEmail === student.email ? 'Revoking…' : 'Revoke invite'}
                        </Button>
                      ) : student.is_invite ? (
                        <Typography variant="caption" sx={{ color: ip.subtext }}>
                          School invite
                        </Typography>
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

      <Dialog
        open={exportDialogOpen}
        onClose={() => !exportBusy && setExportDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading, px: 3, pt: 2.5, pb: 1 }}>
          Export students
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 3, pt: 1, pb: 1 }}>
          <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.55 }}>
            Pick a school, then choose which roster group to download as Excel.
          </Typography>
          <Box>
            <Typography
              sx={platformAdminDialogFieldLabelSx}
              component="label"
              htmlFor="export-school"
            >
              School*
            </Typography>
            <Autocomplete
              id="export-school"
              fullWidth
              size="small"
              options={schools}
              loading={schoolsLoading}
              disabled={exportBusy || schoolsLoading}
              value={schools.find((s) => s.id === exportSchoolId) ?? null}
              onChange={(_event, school) => {
                setExportSchoolId(school?.id ?? '');
                setExportDialogError(null);
              }}
              getOptionLabel={(school) => {
                const name = school.school_name || school.id;
                const count =
                  typeof school.student_count === 'number' ? ` (${school.student_count})` : '';
                const test = isPlatformAdminTestSchool(school.id) ? ' · Test' : '';
                return `${name}${count}${test}`;
              }}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(options, { inputValue }) => {
                const q = inputValue.trim().toLowerCase();
                if (!q) return options;
                return options.filter((school) => {
                  const name = (school.school_name || '').toLowerCase();
                  const id = school.id.toLowerCase();
                  const city = (school.city || '').toLowerCase();
                  const state = (school.state || '').toLowerCase();
                  return (
                    name.includes(q) ||
                    id.includes(q) ||
                    city.includes(q) ||
                    state.includes(q)
                  );
                });
              }}
              noOptionsText={schoolsLoading ? 'Loading schools…' : 'No matching schools'}
              sx={platformAdminDialogAutocompleteSx}
              slotProps={{
                paper: {
                  sx: {
                    ...platformAdminSelectMenuPaperSx,
                    maxHeight: 280,
                  },
                },
                listbox: {
                  sx: { maxHeight: 280 },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search school name…"
                  sx={platformAdminDialogTextFieldSx}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start" sx={{ ml: 0.5, mr: 0 }}>
                          <SearchIcon sx={{ fontSize: 18, color: ip.subtext }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {schoolsLoading ? (
                          <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
          {exportDialogError && (
            <Alert severity="error" onClose={() => setExportDialogError(null)}>
              {exportDialogError}
            </Alert>
          )}
          <Box>
            <Typography sx={{ ...platformAdminDialogFieldLabelSx, mb: 1 }}>
              Export
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {STUDENT_EXPORT_OPTIONS.map((option) => (
                <Button
                  key={option.bucket}
                  variant="outlined"
                  fullWidth
                  disabled={exportBusy}
                  startIcon={
                    exportBusy ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FileDownloadIcon />
                    )
                  }
                  onClick={() => void handleExport(option.bucket)}
                  sx={{
                    ...platformAdminOutlinedButtonSx,
                    justifyContent: 'flex-start',
                    py: 1.1,
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setExportDialogOpen(false)}
            disabled={exportBusy}
            sx={platformAdminTextButtonSx}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default PlatformAdminStudentsPage;
