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
  Paper,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  CheckCircleOutline as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  School as SchoolIcon,
  WorkspacePremium as LevelIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  formatDate,
  getPlatformAdminStudentStats,
  listPlatformAdminStudents,
  type PlatformAdminStudentRow,
  type PlatformAdminStudentStats,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminClearFiltersButtonSx,
  platformAdminFilterToolbarRowSx,
  platformAdminPageContainerSx,
  platformAdminSearchFieldSx,
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
import { RootState } from '../../state_data/reducer';

type StatusFilter = 'all' | 'approved' | 'pending';
type RosterFilter = 'all' | 'yes' | 'no';
type GradeFilter = 'all' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
type MembershipFilter = 'all' | '1' | '2' | '3' | '3_plus';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All statuses',
  approved: 'Approved',
  pending: 'Not approved',
};

const ROSTER_LABELS: Record<RosterFilter, string> = {
  all: 'All roster',
  yes: 'Has school',
  no: 'No school',
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
  '3': 'Level 3',
  '3_plus': 'Level 3+',
};

const PlatformAdminStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const platformAdminRole = useSelector((state: RootState) => state.auth.platformAdminRole);
  const isSuperAdmin = platformAdminRole === 'super';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
  const initialRoster = (searchParams.get('roster') as RosterFilter) || 'all';
  const initialGrade = (searchParams.get('grade') as GradeFilter) || 'all';
  const initialMembership = (searchParams.get('membership') as MembershipFilter) || 'all';

  const [students, setStudents] = useState<PlatformAdminStudentRow[]>([]);
  const [stats, setStats] = useState<PlatformAdminStudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    ['all', 'approved', 'pending'].includes(initialStatus) ? initialStatus : 'all'
  );
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>(
    ['all', 'yes', 'no'].includes(initialRoster) ? initialRoster : 'all'
  );
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>(
    Object.keys(GRADE_LABELS).includes(initialGrade) ? initialGrade : 'all'
  );
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilter>(
    Object.keys(MEMBERSHIP_LABELS).includes(initialMembership) ? initialMembership : 'all'
  );

  const deleteSuccessMessage =
    typeof location.state === 'object' &&
    location.state !== null &&
    'deleteSuccess' in location.state &&
    typeof (location.state as { deleteSuccess?: unknown }).deleteSuccess === 'string'
      ? (location.state as { deleteSuccess: string }).deleteSuccess
      : null;

  const hasActiveFilters =
    statusFilter !== 'all' ||
    rosterFilter !== 'all' ||
    gradeFilter !== 'all' ||
    membershipFilter !== 'all' ||
    search.trim().length > 0;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRosterFilter('all');
    setGradeFilter('all');
    setMembershipFilter('all');
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (rosterFilter !== 'all') params.set('roster', rosterFilter);
    if (gradeFilter !== 'all') params.set('grade', gradeFilter);
    if (membershipFilter !== 'all') params.set('membership', membershipFilter);
    setSearchParams(params, { replace: true });
  }, [statusFilter, rosterFilter, gradeFilter, membershipFilter, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentData, studentStats] = await Promise.all([
        listPlatformAdminStudents({
          search: search.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          roster: rosterFilter === 'all' ? undefined : rosterFilter,
          grade: gradeFilter === 'all' ? undefined : gradeFilter,
          membership: membershipFilter === 'all' ? undefined : membershipFilter,
          limit: 500,
        }),
        getPlatformAdminStudentStats(),
      ]);
      setStudents(studentData);
      setStats(studentStats);
    } catch {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, rosterFilter, gradeFilter, membershipFilter]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onDelete: () => void }[] = [];
    if (statusFilter !== 'all') {
      chips.push({ key: 'status', label: STATUS_LABELS[statusFilter], onDelete: () => setStatusFilter('all') });
    }
    if (rosterFilter !== 'all') {
      chips.push({ key: 'roster', label: ROSTER_LABELS[rosterFilter], onDelete: () => setRosterFilter('all') });
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
  }, [statusFilter, rosterFilter, gradeFilter, membershipFilter, search]);

  const tableColSpan = isSuperAdmin ? 8 : 7;

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Students"
        subtitle="Platform-wide student roster with approval, school, and membership filters"
      />

      {deleteSuccessMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {deleteSuccessMessage}
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
          title="Total students"
          value={stats?.students_total ?? '—'}
          subtitle="Excludes test accounts"
          icon={<PeopleIcon sx={{ fontSize: 22 }} />}
          accent={ip.statBlue}
        />
        <PlatformAdminStatCard
          title="Approved"
          value={stats?.students_approved ?? '—'}
          icon={<CheckCircleIcon sx={{ fontSize: 22 }} />}
          accent={ip.approveGreen}
        />
        <PlatformAdminStatCard
          title="Pending"
          value={stats?.students_pending ?? '—'}
          icon={<PendingIcon sx={{ fontSize: 22 }} />}
          accent="#D97706"
        />
        <PlatformAdminStatCard
          title="Rostered"
          value={stats?.students_rostered ?? '—'}
          icon={<SchoolIcon sx={{ fontSize: 22 }} />}
          accent={ip.statBlue}
        />
        <PlatformAdminStatCard
          title="Level 3+"
          value={stats?.students_level_3_plus ?? '—'}
          icon={<LevelIcon sx={{ fontSize: 22 }} />}
          accent={ip.navy}
        />
      </Box>

      <Card sx={{ ...platformAdminCardSx, mb: 2.5 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={platformAdminFilterToolbarRowSx}>
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
              sx={{ ...platformAdminSearchFieldSx, flex: 1, minWidth: 220 }}
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
              onChange={setRosterFilter}
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
            {hasActiveFilters && (
              <Button
                size="small"
                startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                onClick={clearFilters}
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: ip.navy }} />
        </Box>
      ) : (
        <PlatformAdminTableSection
          countLabel={`Showing ${students.length} student${students.length === 1 ? '' : 's'}`}
        >
          <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
            <Table size="medium" sx={platformAdminTableSx}>
              <TableHead>
                <TableRow sx={platformAdminTableHeadRowSx}>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>School</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Membership</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  {isSuperAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan} align="center" sx={{ py: 5, color: ip.subtext }}>
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.uid}>
                      <TableCell sx={{ fontWeight: 600, color: ip.heading }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                          <Typography
                            component="span"
                            sx={{ fontWeight: 600, color: ip.heading, minWidth: 0 }}
                          >
                            {[student.first_name, student.last_name].filter(Boolean).join(' ') || ' - '}
                          </Typography>
                          {isPlatformAdminTestStudent(student) && (
                            <PlatformAdminChip label="Test" tone="info" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: ip.heading }}>{student.email || ' - '}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
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
                                  maxWidth: 200,
                                }}
                              >
                                {student.school_name}
                              </Typography>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: ip.subtext, display: 'block' }}>
                              {student.school_id}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ color: ip.subtext }}>
                            {student.school_id || ' - '}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: ip.heading, fontWeight: 600 }}>{student.grade ?? ' - '}</TableCell>
                      <TableCell sx={{ color: ip.heading }}>
                        {student.membership_level != null ? `Level ${student.membership_level}` : ' - '}
                      </TableCell>
                      <TableCell>
                        {student.approval_status ? (
                          <PlatformAdminChip
                            label={student.approval_status}
                            tone={student.approval_status.toLowerCase() === 'approved' ? 'success' : 'warning'}
                          />
                        ) : (
                          ' - '
                        )}
                      </TableCell>
                      <TableCell sx={{ color: ip.subtext, whiteSpace: 'nowrap' }}>
                        {formatDate(student.created_at)}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<ViewIcon sx={{ fontSize: 18 }} />}
                            onClick={() => navigate(`/platform-admin/students/${student.uid}`)}
                            sx={platformAdminTextButtonSx}
                          >
                            View
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </PlatformAdminTableSection>
      )}
    </Box>
  );
};

export default PlatformAdminStudentsPage;
