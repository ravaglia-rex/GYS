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
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
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
  listPlatformAdminSchools,
  listPlatformAdminStudents,
  type PlatformAdminSchoolSummary,
  type PlatformAdminStudentRow,
  type PlatformAdminStudentStats,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminClearFiltersButtonSx,
  platformAdminFilterSelectSx,
  platformAdminFilterToolbarRowSx,
  platformAdminPageContainerSx,
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

type StatusFilter = 'all' | 'approved' | 'pending';
type RosterFilter = 'all' | 'yes' | 'no';
type GradeFilter = 'all' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
type MembershipFilter = 'all' | '1' | '2' | '3' | '3_plus';

const ALL_SCHOOLS_VALUE = '__all__';

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

function parseInitialSchoolSelection(raw: string | null): {
  allSchoolsSelected: boolean;
  selectedSchoolIds: string[];
} {
  if (!raw) return { allSchoolsSelected: false, selectedSchoolIds: [] };
  if (raw.toLowerCase() === 'all') return { allSchoolsSelected: true, selectedSchoolIds: [] };
  const ids = Array.from(new Set(raw.split(',').map((id) => id.trim()).filter(Boolean)));
  return { allSchoolsSelected: false, selectedSchoolIds: ids };
}

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

  const schoolSelected = allSchoolsSelected || selectedSchoolIds.length > 0;

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
    gradeFilter !== 'all' ||
    membershipFilter !== 'all' ||
    search.trim().length > 0;

  const clearSecondaryFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRosterFilter('all');
    setGradeFilter('all');
    setMembershipFilter('all');
  };

  const clearSchoolSelection = () => {
    setAllSchoolsSelected(false);
    setSelectedSchoolIds([]);
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (allSchoolsSelected) params.set('schools', 'all');
    else if (selectedSchoolIds.length > 0) params.set('schools', selectedSchoolIds.join(','));
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (rosterFilter !== 'all') params.set('roster', rosterFilter);
    if (gradeFilter !== 'all') params.set('grade', gradeFilter);
    if (membershipFilter !== 'all') params.set('membership', membershipFilter);
    setSearchParams(params, { replace: true });
  }, [
    allSchoolsSelected,
    selectedSchoolIds,
    statusFilter,
    rosterFilter,
    gradeFilter,
    membershipFilter,
    setSearchParams,
  ]);

  const load = useCallback(async () => {
    if (!schoolSelected) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const studentData = await listPlatformAdminStudents({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        roster: rosterFilter === 'all' ? undefined : rosterFilter,
        grade: gradeFilter === 'all' ? undefined : gradeFilter,
        membership: membershipFilter === 'all' ? undefined : membershipFilter,
        school_ids: allSchoolsSelected ? 'all' : selectedSchoolIds,
        limit: 500,
      });
      setStudents(studentData);
    } catch {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [
    schoolSelected,
    search,
    statusFilter,
    rosterFilter,
    gradeFilter,
    membershipFilter,
    allSchoolsSelected,
    selectedSchoolIds,
  ]);

  useEffect(() => {
    const timer = setTimeout(load, search && schoolSelected ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search, schoolSelected]);

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
        label: schoolNameById.get(id) || id,
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
    gradeFilter,
    membershipFilter,
    search,
  ]);

  const tableColSpan = isSuperAdmin ? 8 : 7;

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Students"
        subtitle="Select a school to load students, then filter by status, grade, and membership"
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
                  return schoolsLoading ? 'Loading schools…' : 'Select school(s) — required';
                }
                if (selected.length === 1) {
                  return schoolNameById.get(selected[0]) || selected[0];
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
              {schools.map((school) => (
                <MenuItem key={school.id} value={school.id}>
                  <Checkbox
                    checked={!allSchoolsSelected && selectedSchoolIds.includes(school.id)}
                    size="small"
                  />
                  <ListItemText
                    primary={school.school_name || school.id}
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

      {!schoolSelected ? (
        <Card sx={platformAdminCardSx}>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 40, color: ip.subtext, mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 0.75 }}>
              Select a school to view students
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, maxWidth: 420, mx: 'auto' }}>
              Choose one or more schools (or All schools) in the School* filter above to load results.
            </Typography>
          </CardContent>
        </Card>
      ) : loading ? (
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
