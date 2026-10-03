import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutline as PassIcon,
  FileDownload as FileDownloadIcon,
  HighlightOff as FailIcon,
  Lock as LockIcon,
  PeopleAltOutlined as CompletionIcon,
  SpeedOutlined as ScoreIcon,
  TimelineOutlined as RateIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../state_data/reducer';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { useSchoolAdminExamCompletions, useSchoolAdminSummary } from '../../query/hooks';
import { assessmentDisplayName } from '../../utils/schoolAdminTierAnalytics';
import { areExamScoresVisible } from '../../constants/constants';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { SchoolAdminPageHeader, schoolAdminPageContainerSx } from './schoolAdminPageStyles';
import type {
  SchoolExamCompletionRow,
  SchoolExamCompletionStats,
  SchoolExamCompletionsResponse,
  StudentRow,
} from '../../db/schoolAdminCollection';
import { buildGreenfieldPreviewStudentRows } from '../../data/schoolPreviewMock';

const EXAM_TABS: Array<{ id: string; minLevel: number; accent: string }> = [
  { id: 'analytical_reasoning', minLevel: 1, accent: '#10408B' },
  { id: 'verbal_reasoning', minLevel: 2, accent: '#0F766E' },
  { id: 'mathematical_reasoning', minLevel: 2, accent: '#B45309' },
  { id: 'comprehensive_personality', minLevel: 3, accent: '#6D28D9' },
  { id: 'ai_literacy', minLevel: 3, accent: '#0369A1' },
];

const PERSONALITY_ID = 'comprehensive_personality';
const PAGE_SIZE = 25;

const SCORE_RANGES = [
  { key: '0-499', label: '0–499', min: 0, max: 499 },
  { key: '500-699', label: '500–699', min: 500, max: 699 },
  { key: '700-799', label: '700–799', min: 700, max: 799 },
  { key: '800-1000', label: '800–1000', min: 800, max: 1000 },
] as const;

/** App theme is dark. These controls sit on white cards, so text and borders must be set explicitly. */
const lightFieldSx = {
  '& .MuiInputLabel-root': { color: `${ip.subtext} !important` },
  '& .MuiInputLabel-root.Mui-focused': { color: `${ip.navy} !important` },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    color: ip.heading,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: ip.cardBorder },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy },
  },
  '& .MuiOutlinedInput-input': { color: `${ip.heading} !important` },
  '& .MuiSelect-select': { color: `${ip.heading} !important` },
  '& .MuiSvgIcon-root': { color: ip.heading },
} as const;

const lightMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: '#fff',
      color: ip.heading,
      '& .MuiMenuItem-root': { color: ip.heading },
    },
  },
} as const;

const bodyCellSx = {
  color: `${ip.heading} !important`,
  borderBottom: `1px solid ${ip.cardBorder}`,
} as const;

function planFloor(planId: string | null | undefined): number {
  const id = (planId ?? '').trim().toLowerCase();
  if (id === 'premium') return 3;
  if (id === 'standard') return 2;
  return 1;
}

function pointsFromStored(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  const fraction = raw <= 1 ? raw : raw / 100;
  return Math.round(Math.max(0, Math.min(1, fraction)) * 1000);
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function classSectionLabel(row: SchoolExamCompletionRow): string {
  const grade = row.grade > 0 ? String(row.grade) : '';
  const section = row.section.trim();
  if (grade && section) return `${grade}-${section}`;
  if (grade) return grade;
  if (section) return section;
  return '—';
}

function studentName(row: SchoolExamCompletionRow): string {
  return `${row.first_name} ${row.last_name}`.trim() || 'Student';
}

function statsFromRows(
  rows: SchoolExamCompletionRow[],
  examId: string
): SchoolExamCompletionStats {
  const personality = examId === PERSONALITY_ID;
  const scoresDeferred = !personality && !areExamScoresVisible(examId);
  const passCount = rows.filter((row) => row.passed).length;
  const scored = scoresDeferred ? [] : rows.filter((row) => row.score_points != null);
  const avg =
    scored.length > 0
      ? Math.round(scored.reduce((sum, row) => sum + (row.score_points ?? 0), 0) / scored.length)
      : null;
  return {
    row_count: rows.length,
    pass_count: passCount,
    pass_rate_pct: personality || rows.length === 0 ? null : Math.round((100 * passCount) / rows.length),
    avg_score_points: personality || scoresDeferred ? null : avg,
    scores_deferred: scoresDeferred,
  };
}

/** Preview roster has best score and cleared levels, not per-level maps. */
function buildPreviewCompletions(students: StudentRow[]): SchoolExamCompletionsResponse {
  const byExam: SchoolExamCompletionsResponse['by_exam'] = {};
  for (const tab of EXAM_TABS) byExam[tab.id] = { students: [], stats: statsFromRows([], tab.id) };

  students.forEach((student, index) => {
    const identity = {
      uid: student.uid,
      first_name: student.first_name,
      last_name: student.last_name,
      grade: student.grade,
      section: student.section ?? '',
    };
    for (const examId of ['analytical_reasoning', 'verbal_reasoning', 'mathematical_reasoning', 'ai_literacy']) {
      const progress = student.assessment_progress?.[examId];
      if (!progress || (progress.attempts_count ?? 0) <= 0) continue;
      const levels = new Set<number>();
      for (const [key, cleared] of Object.entries(progress.tiers_cleared ?? {})) {
        const level = Number(key);
        if (cleared && (level === 1 || level === 2 || level === 3)) levels.add(level);
      }
      if (levels.size === 0) levels.add(1);
      const highest = Math.max(...Array.from(levels));
      const base = pointsFromStored(progress.best_score);
      const reveal = areExamScoresVisible(examId);
      for (const level of Array.from(levels)) {
        const day = String(1 + ((index + level) % 27)).padStart(2, '0');
        byExam[examId]!.students.push({
          ...identity,
          level,
          score_points: reveal && base != null ? Math.max(0, base - (highest - level) * 40) : null,
          score_pending: false,
          passed: progress.tiers_cleared?.[String(level)] === true,
          finished_at: `2026-03-${day}T09:30:00.000Z`,
        });
      }
    }
    const personality = student.assessment_progress?.[PERSONALITY_ID];
    const personalityDone =
      personality?.status === 'completed' || personality?.status === 'tier_advanced';
    if (personalityDone) {
      byExam[PERSONALITY_ID]!.students.push({
        ...identity,
        level: null,
        score_points: null,
        score_pending: false,
        passed: true,
        finished_at: null,
      });
    }
  });

  for (const tab of EXAM_TABS) {
    byExam[tab.id]!.stats = statsFromRows(byExam[tab.id]!.students, tab.id);
  }
  return {
    schoolId: 'preview',
    school_covered_membership_level: 3,
    by_exam: byExam,
  };
}

function downloadCsv(filename: string, rows: SchoolExamCompletionRow[], showScore: boolean) {
  const header = ['When', 'Student', 'Class', 'Level', 'Score', 'Passed'];
  const lines = rows.map((row) => {
    const score = !showScore ? '' : row.score_pending ? 'Pending' : row.score_points == null ? '' : String(row.score_points);
    const cells = [
      formatWhen(row.finished_at),
      studentName(row),
      classSectionLabel(row),
      row.level == null ? '' : String(row.level),
      score,
      row.passed ? 'Yes' : 'No',
    ];
    return cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',');
  });
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const SchoolAdminAnalyticsPage: React.FC = () => {
  const location = useLocation();
  const isPreview = location.pathname.startsWith('/for-schools/preview');
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const schoolId = schoolAdmin?.schoolId ? String(schoolAdmin.schoolId).trim() : undefined;

  const summaryQuery = useSchoolAdminSummary(schoolId, !isPreview);
  const completionsQuery = useSchoolAdminExamCompletions(schoolId, !isPreview);

  const previewPayload = useMemo(
    () => (isPreview ? buildPreviewCompletions(buildGreenfieldPreviewStudentRows()) : null),
    [isPreview]
  );
  const payload = isPreview ? previewPayload : completionsQuery.data ?? null;
  const floor =
    payload?.school_covered_membership_level ??
    planFloor(summaryQuery.data?.selected_plan_id);

  const [examId, setExamId] = useState('analytical_reasoning');
  const [nameQuery, setNameQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [passedFilter, setPassedFilter] = useState('all');
  const [scoreRange, setScoreRange] = useState('all');
  const [page, setPage] = useState(0);

  const active = payload?.by_exam?.[examId];
  const rows = useMemo(() => active?.students ?? [], [active]);
  const stats = active?.stats;
  const personality = examId === PERSONALITY_ID;
  const showScore = !personality && !stats?.scores_deferred && areExamScoresVisible(examId);

  const grades = useMemo(() => {
    const set = new Set<number>();
    for (const row of rows) {
      if (row.grade > 0) set.add(row.grade);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (gradeFilter !== 'all' && String(row.grade) !== gradeFilter) continue;
      const section = row.section.trim();
      if (section) set.add(section);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [rows, gradeFilter]);

  const filtered = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    const band = SCORE_RANGES.find((range) => range.key === scoreRange);
    return rows
      .filter((row) => {
        if (q && !studentName(row).toLowerCase().includes(q)) return false;
        if (gradeFilter !== 'all' && String(row.grade) !== gradeFilter) return false;
        const sectionActive =
          sectionFilter !== 'all' &&
          sections.some((section) => section.toLowerCase() === sectionFilter.toLowerCase());
        if (sectionActive && row.section.trim().toLowerCase() !== sectionFilter.toLowerCase()) return false;
        if (!personality && levelFilter !== 'all' && String(row.level) !== levelFilter) return false;
        if (passedFilter === 'yes' && !row.passed) return false;
        if (passedFilter === 'no' && row.passed) return false;
        if (showScore && band) {
          if (row.score_points == null || row.score_points < band.min || row.score_points > band.max) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aMs = a.finished_at ? Date.parse(a.finished_at) : 0;
        const bMs = b.finished_at ? Date.parse(b.finished_at) : 0;
        return bMs - aMs || studentName(a).localeCompare(studentName(b));
      });
  }, [rows, nameQuery, gradeFilter, sectionFilter, sections, levelFilter, passedFilter, scoreRange, personality, showScore]);

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    const student = nameQuery.trim();
    if (student) {
      chips.push({
        key: 'student',
        label: `Student: ${student}`,
        clear: () => {
          setNameQuery('');
          setPage(0);
        },
      });
    }
    if (gradeFilter !== 'all') {
      chips.push({
        key: 'class',
        label: `Class ${gradeFilter}`,
        clear: () => {
          setGradeFilter('all');
          setSectionFilter('all');
          setPage(0);
        },
      });
    }
    const sectionActive =
      sectionFilter !== 'all' &&
      sections.some((section) => section.toLowerCase() === sectionFilter.toLowerCase());
    if (sectionActive) {
      chips.push({
        key: 'section',
        label: `Section ${sectionFilter}`,
        clear: () => {
          setSectionFilter('all');
          setPage(0);
        },
      });
    }
    if (!personality && levelFilter !== 'all') {
      chips.push({
        key: 'level',
        label: `Level ${levelFilter}`,
        clear: () => {
          setLevelFilter('all');
          setPage(0);
        },
      });
    }
    if (passedFilter === 'yes' || passedFilter === 'no') {
      chips.push({
        key: 'passed',
        label: passedFilter === 'yes' ? 'Passed' : 'Not passed',
        clear: () => {
          setPassedFilter('all');
          setPage(0);
        },
      });
    }
    if (showScore && scoreRange !== 'all') {
      const band = SCORE_RANGES.find((range) => range.key === scoreRange);
      if (band) {
        chips.push({
          key: 'score',
          label: `Score ${band.label}`,
          clear: () => {
            setScoreRange('all');
            setPage(0);
          },
        });
      }
    }
    return chips;
  }, [nameQuery, gradeFilter, sectionFilter, sections, personality, levelFilter, passedFilter, showScore, scoreRange]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const loading = !isPreview && (completionsQuery.isLoading || summaryQuery.isLoading);

  return (
    <Box sx={{ ...schoolAdminPageContainerSx, px: { xs: 1.5, md: 2 }, pt: 3 }}>
      <PageTutorial pageKey="school.analytics" ready={!loading} />
      <SchoolAdminPageHeader
        title="Analytics"
        subtitle="One row per student per level. Filters and export use this list and do not reload the roster."
      />

      <Box
        data-tutorial-id="school-analytics-exam-tabs"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(5, minmax(0, 1fr))' },
          gap: 1.25,
          mb: 2.5,
          width: '100%',
          p: 0.75,
          borderRadius: 3,
          bgcolor: '#fff',
          border: `1px solid ${ip.cardBorder}`,
          boxShadow: '0 8px 24px rgba(16, 64, 139, 0.06)',
        }}
      >
        {EXAM_TABS.map((tab) => {
          const locked = tab.minLevel > floor;
          const selected = tab.id === examId;
          const button = (
            <Button
              disabled={locked}
              onClick={() => {
                setExamId(tab.id);
                setLevelFilter('all');
                setScoreRange('all');
                setPage(0);
              }}
              startIcon={locked ? <LockIcon sx={{ fontSize: '1rem !important' }} /> : undefined}
              sx={{
                width: '100%',
                minWidth: 0,
                height: '100%',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: 1,
                py: 1.35,
                whiteSpace: 'normal',
                lineHeight: 1.25,
                color: selected ? '#fff' : ip.heading,
                bgcolor: selected ? tab.accent : 'transparent',
                border: '1px solid',
                borderColor: selected ? tab.accent : 'transparent',
                boxShadow: selected ? `0 8px 16px ${tab.accent}33` : 'none',
                '&:hover': {
                  bgcolor: selected ? tab.accent : `${tab.accent}12`,
                  borderColor: selected ? tab.accent : `${tab.accent}55`,
                },
                '&.Mui-disabled': { color: ip.subtext, bgcolor: 'transparent', borderColor: 'transparent' },
              }}
            >
              {assessmentDisplayName(tab.id)}
            </Button>
          );
          if (!locked) return <Box key={tab.id}>{button}</Box>;
          return (
            <Tooltip key={tab.id} title="Upgrade to unlock this exam" arrow>
              <Box component="span" sx={{ display: 'flex', minWidth: 0 }}>{button}</Box>
            </Tooltip>
          );
        })}
      </Box>

      {loading ? (
        <Typography sx={{ color: ip.heading, fontWeight: 600 }}>Loading exam results…</Typography>
      ) : completionsQuery.isError && !isPreview ? (
        <Alert severity="error">Could not load exam results. Refresh the page or try again in a moment.</Alert>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2.5 }}>
            <Stat label="Total completion" value={String(stats?.row_count ?? 0)} accent="#10408B" icon={<CompletionIcon />} />
            <Stat
              label="Avg score"
              value={stats?.avg_score_points != null ? `${stats.avg_score_points} / 1000` : '—'}
              accent="#0F766E"
              icon={<ScoreIcon />}
            />
            <Stat
              label="Pass rate"
              value={stats?.pass_rate_pct != null ? `${stats.pass_rate_pct}%` : '—'}
              accent="#B45309"
              icon={<RateIcon />}
            />
          </Box>

          {stats?.scores_deferred ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Numeric scores for this exam are deferred. Level and pass or fail stay visible.
            </Alert>
          ) : null}

          <Card
            sx={{
              bgcolor: '#fff',
              border: `1px solid ${ip.cardBorder}`,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
              borderRadius: 3,
              mb: 2,
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TextField
                  size="small"
                  label="Student"
                  value={nameQuery}
                  onChange={(event) => {
                    setNameQuery(event.target.value);
                    setPage(0);
                  }}
                  sx={{ flex: 1, minWidth: 0, ...lightFieldSx }}
                />
                <Button
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => downloadCsv(`${examId}-completions.csv`, filtered, showScore)}
                  sx={{
                    flexShrink: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: ip.navy,
                    borderRadius: 2,
                    px: 2,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 16px rgba(16, 64, 139, 0.22)',
                    '&:hover': { bgcolor: '#0c356f' },
                  }}
                >
                  Export this view
                </Button>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: `repeat(${2 + (personality ? 0 : 1) + 1 + (showScore ? 1 : 0)}, minmax(0, 1fr))`,
                  },
                  gap: 1.5,
                  width: '100%',
                }}
              >
              <FormControl fullWidth size="small" sx={{ minWidth: 0, ...lightFieldSx }}>
                <InputLabel>Class</InputLabel>
                <Select label="Class" value={gradeFilter} MenuProps={lightMenuProps} onChange={(event) => { setGradeFilter(String(event.target.value)); setSectionFilter('all'); setPage(0); }}>
                  <MenuItem value="all">All classes</MenuItem>
                  {grades.map((grade) => (
                    <MenuItem key={grade} value={String(grade)}>
                      Class {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ minWidth: 0, ...lightFieldSx }}>
                <InputLabel>Section</InputLabel>
                <Select
                  label="Section"
                  value={
                    sectionFilter === 'all' ||
                    sections.some((section) => section.toLowerCase() === sectionFilter.toLowerCase())
                      ? sectionFilter
                      : 'all'
                  }
                  MenuProps={lightMenuProps}
                  onChange={(event) => {
                    setSectionFilter(String(event.target.value));
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All sections</MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section} value={section}>
                      Section {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {personality ? null : (
                <FormControl fullWidth size="small" sx={{ minWidth: 0, ...lightFieldSx }}>
                  <InputLabel>Level</InputLabel>
                  <Select label="Level" value={levelFilter} MenuProps={lightMenuProps} onChange={(event) => { setLevelFilter(String(event.target.value)); setPage(0); }}>
                    <MenuItem value="all">All levels</MenuItem>
                    <MenuItem value="1">Level 1</MenuItem>
                    <MenuItem value="2">Level 2</MenuItem>
                    <MenuItem value="3">Level 3</MenuItem>
                  </Select>
                </FormControl>
              )}
              <FormControl fullWidth size="small" sx={{ minWidth: 0, ...lightFieldSx }}>
                <InputLabel>Passed</InputLabel>
                <Select label="Passed" value={passedFilter} MenuProps={lightMenuProps} onChange={(event) => { setPassedFilter(String(event.target.value)); setPage(0); }}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="yes">Passed</MenuItem>
                  <MenuItem value="no">Not passed</MenuItem>
                </Select>
              </FormControl>
              {showScore ? (
                <FormControl fullWidth size="small" sx={{ minWidth: 0, ...lightFieldSx }}>
                  <InputLabel>Score</InputLabel>
                  <Select
                    label="Score"
                    value={scoreRange}
                    MenuProps={lightMenuProps}
                    onChange={(event) => {
                      setScoreRange(String(event.target.value));
                      setPage(0);
                    }}
                  >
                    <MenuItem value="all">All scores</MenuItem>
                    {SCORE_RANGES.map((range) => (
                      <MenuItem key={range.key} value={range.key}>
                        {range.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
              </Box>
              {activeFilters.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {activeFilters.map((filter) => (
                    <Chip
                      key={filter.key}
                      label={filter.label}
                      size="small"
                      onDelete={filter.clear}
                      sx={{
                        height: 28,
                        fontWeight: 700,
                        color: `${ip.heading} !important`,
                        bgcolor: 'rgba(16, 64, 139, 0.08)',
                        border: `1px solid rgba(16, 64, 139, 0.16)`,
                        '& .MuiChip-label': { color: `${ip.heading} !important` },
                        '& .MuiChip-deleteIcon': { color: `${ip.navy} !important` },
                        '& .MuiChip-deleteIcon:hover': { color: `${ip.heading} !important` },
                      }}
                    />
                  ))}
                </Box>
              ) : null}
            </CardContent>
          </Card>

          <TableContainer
            data-tutorial-id="school-analytics-table"
            sx={{
              border: `1px solid ${ip.cardBorder}`,
              borderRadius: 3,
              bgcolor: '#fff',
              boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden',
            }}
          >
            <Table size="small" sx={{ bgcolor: '#fff' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#0F2C59' }}>
                  {['When', 'Student', 'Class', 'Level', 'Score', 'Passed'].map((label) => (
                    <TableCell
                      key={label}
                      sx={{
                        fontWeight: 700,
                        color: '#fff !important',
                        borderBottom: 'none',
                        letterSpacing: 0.2,
                        py: 1.4,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ color: ip.subtext, py: 5, textAlign: 'center' }}>
                      No results for this exam and filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row, index) => (
                    <TableRow
                      key={`${row.uid}-${row.level ?? 'personality'}`}
                      hover
                      sx={{
                        bgcolor: index % 2 === 0 ? '#fff' : '#F8FAFC',
                        '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.06) !important' },
                      }}
                    >
                      <TableCell sx={bodyCellSx}>{formatWhen(row.finished_at)}</TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>{studentName(row)}</TableCell>
                      <TableCell sx={bodyCellSx}>{classSectionLabel(row)}</TableCell>
                      <TableCell sx={bodyCellSx}>
                        {row.level == null ? (
                          '—'
                        ) : (
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              minWidth: 28,
                              justifyContent: 'center',
                              px: 0.9,
                              py: 0.2,
                              borderRadius: 99,
                              bgcolor: 'rgba(16, 64, 139, 0.1)',
                              color: ip.navy,
                              fontWeight: 800,
                            }}
                          >
                            {row.level}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                        {!showScore ? '—' : row.score_pending ? 'Pending' : row.score_points == null ? '—' : row.score_points}
                      </TableCell>
                      <TableCell sx={bodyCellSx}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.4,
                            px: 1,
                            py: 0.25,
                            borderRadius: 99,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: row.passed ? '#166534' : '#9F1239',
                            bgcolor: row.passed ? '#DCFCE7' : '#FFE4E6',
                          }}
                        >
                          {row.passed ? <PassIcon sx={{ fontSize: '0.95rem' }} /> : <FailIcon sx={{ fontSize: '0.95rem' }} />}
                          {row.passed ? 'Yes' : 'No'}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: ip.subtext, fontWeight: 600 }}>
              Showing {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length} rows.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={safePage <= 0}
                onClick={() => setPage(safePage - 1)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: ip.navy, borderColor: ip.cardBorder }}
              >
                Previous
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: ip.navy, boxShadow: 'none', '&:hover': { bgcolor: '#0c356f' } }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <Card
      sx={{
        bgcolor: '#fff',
        border: `1px solid ${ip.cardBorder}`,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, bgcolor: accent }} />
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: '22px !important' }}>
        <Box>
          <Typography variant="caption" sx={{ color: ip.subtext, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 700 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ color: ip.heading, fontWeight: 800, mt: 0.35, letterSpacing: -0.4 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
            bgcolor: `${accent}16`,
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}

export default SchoolAdminAnalyticsPage;
