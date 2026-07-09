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
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
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

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Students"
        subtitle="Browse registered students and membership levels"
      />

      {stats && (
        <Box sx={platformAdminStatsGridSx}>
          <PlatformAdminStatCard
            title="Total students"
            value={stats.students_total}
            subtitle="Excludes test accounts"
            icon={<PeopleIcon />}
            accent={ip.statBlue}
          />
          <PlatformAdminStatCard
            title="Approved"
            value={stats.students_approved}
            subtitle={
              stats.students_total > 0
                ? `${Math.round((stats.students_approved / stats.students_total) * 100)}% of total`
                : undefined
            }
            icon={<CheckCircleIcon />}
            accent={ip.approveGreen}
            onClick={() => {
              setStatusFilter('approved');
              setSearch('');
            }}
          />
          <PlatformAdminStatCard
            title="Pending approval"
            value={stats.students_pending}
            subtitle="Not yet approved"
            icon={<PendingIcon />}
            accent="#d97706"
            onClick={() => {
              setStatusFilter('pending');
              setSearch('');
            }}
          />
          <PlatformAdminStatCard
            title="Rostered to school"
            value={stats.students_rostered}
            subtitle="Linked to a school ID"
            icon={<SchoolIcon />}
            accent={ip.statBlue}
            onClick={() => {
              setRosterFilter('yes');
              setSearch('');
            }}
          />
          <PlatformAdminStatCard
            title="Level 3+"
            value={stats.students_level_3_plus}
            subtitle="Premium membership access"
            icon={<LevelIcon />}
            accent="#7c3aed"
            onClick={() => {
              setMembershipFilter('3_plus');
              setSearch('');
            }}
          />
        </Box>
      )}

      <Card sx={{ ...platformAdminCardSx, mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Box
            sx={{
              ...platformAdminFilterToolbarRowSx,
              mb: activeFilterChips.length > 0 ? 1.5 : 0,
            }}
          >
            <TextField
              size="small"
              placeholder="Search by name, email, school, or UID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                flex: '1 1 260px',
                minWidth: 220,
                mb: 0,
                alignSelf: 'center',
                ...platformAdminSearchFieldSx,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: ip.subtext }} />
                  </InputAdornment>
                ),
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
              label="School"
              value={rosterFilter}
              labels={ROSTER_LABELS}
              minWidth={148}
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
                variant="outlined"
                onClick={clearFilters}
                startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                sx={platformAdminClearFiltersButtonSx}
              >
                Clear
              </Button>
            )}
          </Box>

          {activeFilterChips.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                pt: 1.5,
                borderTop: `1px solid ${ip.cardBorder}`,
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: ip.subtext, mr: 0.25 }}>
                Active filters
              </Typography>
              {activeFilterChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  size="small"
                  onDelete={chip.onDelete}
                  sx={{
                    height: 26,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: ip.sidebarActiveBg,
                    color: ip.sidebarActiveText,
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
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: ip.subtext }}>
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
