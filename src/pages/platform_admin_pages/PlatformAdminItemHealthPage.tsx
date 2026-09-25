import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrow from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  platformAdminOutlinedButtonSx,
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
  platformAdminFilterSelectSx,
  platformAdminSelectMenuPaperSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
} from './platformAdminPageStyles';
import {
  PlatformAdminChip,
  PlatformAdminPageHeader,
  PlatformAdminStatCard,
  PlatformAdminTableSection,
  adminChipSx,
  type AdminChipTone,
} from './platformAdminComponents';
import {
  getPlatformAdminOfficialExamSummaries,
  isItemHealthSupported,
  listPlatformAdminItemHealthRows,
  listPlatformAdminItemHealthRuns,
  runPlatformAdminItemHealthJob,
  type ItemHealthFlag,
  type ItemHealthRow,
  type ItemHealthRunMeta,
  type OfficialExamSummaryRow,
} from '../../db/platformAdminAnalytics';

type FlagFilter = '' | 'P0' | 'P1' | 'P2';
type StatusFilter = '' | 'COLLECTING' | 'REVIEW_READY' | 'STABLE';

const LEVELS = [1, 2, 3];

const examPickerTabsSx = {
  mb: 1.5,
  minHeight: 40,
  p: 0.5,
  borderRadius: 2,
  bgcolor: 'rgba(16, 64, 139, 0.05)',
  border: '1px solid rgba(16, 64, 139, 0.12)',
  '& .MuiTabs-flexContainer': { gap: 0.5 },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    minHeight: 32,
    minWidth: 'auto',
    px: 1.5,
    borderRadius: 1.25,
    color: `${ip.subtext} !important`,
  },
  '& .MuiTab-root.Mui-selected': {
    color: `${ip.navy} !important`,
    fontWeight: 800,
    bgcolor: '#fff',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
  },
  '& .MuiTabs-indicator': { display: 'none' },
} as const;

const toggleGroupSx = {
  bgcolor: '#fff',
  flexWrap: 'wrap',
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    px: 1.5,
    color: ip.heading,
    borderColor: '#cbd5e1',
    fontWeight: 600,
    '&.Mui-selected': {
      bgcolor: 'rgba(16, 64, 139, 0.1)',
      color: ip.navy,
      borderColor: '#94a3b8',
      '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.16)' },
    },
    '&:hover': { bgcolor: '#f8fafc' },
  },
} as const;

function shortOfficialExamLabel(label: string): string {
  return label.replace(/\s+Reasoning$/i, '').trim() || label;
}

function severityTone(severity: string): AdminChipTone {
  if (severity === 'P0') return 'error';
  if (severity === 'P1') return 'warning';
  if (severity === 'P2') return 'info';
  return 'neutral';
}

function statusTone(status: string | undefined): AdminChipTone {
  if (status === 'STABLE') return 'success';
  if (status === 'REVIEW_READY') return 'info';
  return 'neutral';
}

function formatPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(1)}%`;
}

function formatNum(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(digits);
}

function flagLabels(flags: ItemHealthFlag[] | undefined): string {
  if (!flags?.length) return '—';
  return flags
    .filter((f) => f.severity === 'P0' || f.severity === 'P1' || f.severity === 'P2')
    .map((f) => f.code.replace(/^P[012]_/, ''))
    .slice(0, 3)
    .join(', ');
}

const PlatformAdminItemHealthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = searchParams.get('exam') || '';
  const levelRaw = Number(searchParams.get('level'));
  const level = Number.isFinite(levelRaw) && levelRaw >= 1 ? Math.floor(levelRaw) : 1;

  const [examSummaries, setExamSummaries] = useState<OfficialExamSummaryRow[]>([]);
  const [runs, setRuns] = useState<ItemHealthRunMeta[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [rows, setRows] = useState<ItemHealthRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [runMeta, setRunMeta] = useState<Record<string, unknown> | null>(null);
  const [flagFilter, setFlagFilter] = useState<FlagFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<ItemHealthRow | null>(null);

  const supported = Boolean(examId) && isItemHealthSupported(examId, level);
  const selectedExam = examSummaries.find((e) => e.exam_id === examId) ?? null;

  const setExamQuery = useCallback(
    (patch: { exam?: string; level?: number }) => {
      const next = new URLSearchParams(searchParams);
      if (patch.exam !== undefined) {
        if (patch.exam) next.set('exam', patch.exam);
        else next.delete('exam');
      }
      if (patch.level !== undefined) next.set('level', String(patch.level));
      setSearchParams(next, { replace: true });
      setSelectedRunId('');
      setRuns([]);
      setRows([]);
      setTotalRows(0);
      setRunMeta(null);
      setJobMessage(null);
      setExpandedId(null);
    },
    [searchParams, setSearchParams]
  );

  const loadRuns = useCallback(async () => {
    if (!examId || !isItemHealthSupported(examId, level)) {
      setRuns([]);
      return [] as ItemHealthRunMeta[];
    }
    const { runs: next } = await listPlatformAdminItemHealthRuns(examId, { level });
    setRuns(next);
    return next;
  }, [examId, level]);

  const loadRows = useCallback(
    async (runId: string, flag: FlagFilter, status: StatusFilter) => {
      if (!examId || !runId || !isItemHealthSupported(examId, level)) {
        setRows([]);
        setTotalRows(0);
        setRunMeta(null);
        return;
      }
      const data = await listPlatformAdminItemHealthRows(examId, runId, {
        level,
        flag: flag || undefined,
        status: status || undefined,
        limit: 400,
      });
      setRows(data.rows);
      setTotalRows(data.total);
      setRunMeta(data.run);
    },
    [examId, level]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!examSummaries.length) {
        const { exams } = await getPlatformAdminOfficialExamSummaries();
        setExamSummaries(exams);
        if (!examId && exams[0]?.exam_id) {
          setExamQuery({ exam: exams[0].exam_id, level });
          setLoading(false);
          return;
        }
      }
      if (!examId || !isItemHealthSupported(examId, level)) {
        setRuns([]);
        setRows([]);
        setTotalRows(0);
        setRunMeta(null);
        setSelectedRunId('');
        return;
      }
      const nextRuns = await loadRuns();
      const preferred =
        selectedRunId && nextRuns.some((r) => r.id === selectedRunId)
          ? selectedRunId
          : nextRuns[0]?.id ?? '';
      setSelectedRunId(preferred);
      await loadRows(preferred, flagFilter, statusFilter);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load item health');
    } finally {
      setLoading(false);
    }
  }, [
    examId,
    examSummaries.length,
    flagFilter,
    level,
    loadRows,
    loadRuns,
    selectedRunId,
    setExamQuery,
    statusFilter,
  ]);

  useEffect(() => {
    void (async () => {
      try {
        const { exams } = await getPlatformAdminOfficialExamSummaries();
        setExamSummaries(exams);
        if (!examId && exams[0]?.exam_id) {
          const next = new URLSearchParams(searchParams);
          next.set('exam', exams[0].exam_id);
          if (!next.get('level')) next.set('level', '1');
          setSearchParams(next, { replace: true });
        } else if (!searchParams.get('level')) {
          const next = new URLSearchParams(searchParams);
          next.set('level', String(level));
          setSearchParams(next, { replace: true });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load exams');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, level]);

  useEffect(() => {
    if (!supported || !selectedRunId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadRows(selectedRunId, flagFilter, statusFilter);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load rows');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flagFilter, loadRows, selectedRunId, statusFilter, supported]);

  const handleRunJob = async () => {
    if (!examId || !supported) return;
    setRunningJob(true);
    setJobMessage(null);
    setError(null);
    try {
      const result = await runPlatformAdminItemHealthJob(examId, { level });
      if (!result.supported) {
        setError('Item health is not available for this exam/level yet.');
        return;
      }
      setJobMessage(
        `Run ${result.run_id} finished — wrote ${result.rows_written} item rows (recommendation-only).`
      );
      const nextRuns = await loadRuns();
      const id = result.run_id || nextRuns[0]?.id || '';
      setSelectedRunId(id);
      await loadRows(id, flagFilter, statusFilter);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Item-health job failed (may need a longer Cloud Function timeout on large cohorts).'
      );
    } finally {
      setRunningJob(false);
    }
  };

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? null,
    [runs, selectedRunId]
  );

  const stats = {
    p0: Number(runMeta?.p0_count ?? selectedRun?.p0_count) || 0,
    p1: Number(runMeta?.p1_count ?? selectedRun?.p1_count) || 0,
    p2: Number(runMeta?.p2_count ?? selectedRun?.p2_count) || 0,
    reviewReady:
      Number(runMeta?.review_ready_count ?? selectedRun?.review_ready_count) || 0,
    collecting:
      Number(runMeta?.collecting_count ?? selectedRun?.collecting_count) || 0,
    units:
      Number(runMeta?.total_evidence_units ?? selectedRun?.total_evidence_units) || 0,
  };

  const examLabel = selectedExam
    ? shortOfficialExamLabel(selectedExam.label)
    : examId || 'Exam';

  return (
    <Box
      sx={{
        ...platformAdminPageContainerSx,
        maxWidth: 1280,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        bgcolor: '#F1F5F9',
        borderRadius: { md: 3 },
        border: { md: `1px solid ${ip.cardBorder}` },
      }}
    >
      <PlatformAdminPageHeader
        title="Item Health"
        subtitle="Friday recommendation queue for official exam items. Same page for Analytical, Verbal, Math, and later exams — pick the exam and level below. Flags possible key/content issues and tier mislabels; does not change scores, keys, or difficulty by itself."
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={() => void refresh()}
              disabled={loading || runningJob}
              sx={platformAdminOutlinedButtonSx}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={
                runningJob ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />
              }
              onClick={() => void handleRunJob()}
              disabled={runningJob || !supported}
              sx={platformAdminPrimaryButtonSx}
            >
              {runningJob ? 'Running…' : 'Run checkup now'}
            </Button>
          </Box>
        }
      />

      <Tabs
        value={examId || false}
        onChange={(_e, value: string) => setExamQuery({ exam: value })}
        variant="scrollable"
        scrollButtons="auto"
        sx={examPickerTabsSx}
      >
        {examSummaries.map((exam) => (
          <Tab
            key={exam.exam_id}
            value={exam.exam_id}
            label={shortOfficialExamLabel(exam.label)}
          />
        ))}
      </Tabs>

      <Tabs
        value={level}
        onChange={(_e, value: number) => setExamQuery({ level: value })}
        sx={examPickerTabsSx}
      >
        {LEVELS.map((lvl) => (
          <Tab
            key={lvl}
            value={lvl}
            label={
              isItemHealthSupported(examId, lvl)
                ? `Level ${lvl}`
                : `Level ${lvl} · soon`
            }
          />
        ))}
      </Tabs>

      <Alert severity="info" icon={<HealthAndSafetyOutlinedIcon />} sx={{ mb: 2 }}>
        Recommendation-only. Use this list to decide what to review in Item Bank. No automatic
        invalidation or Monday score changes.
      </Alert>

      {!supported && examId ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Item health for <strong>{examLabel} Level {level}</strong> is not wired yet. Analytical
          Reasoning Level 1 is available now; Verbal, Math, and other levels will use this same
          page when their pipelines land.
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {jobMessage ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setJobMessage(null)}>
          {jobMessage}
        </Alert>
      ) : null}

      {(loading || runningJob) && (
        <LinearProgress
          sx={{
            mb: 2,
            height: 3,
            borderRadius: 1,
            bgcolor: 'rgba(16, 64, 139, 0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: ip.navy },
          }}
        />
      )}

      {supported ? (
        <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(6, 1fr)',
          },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <PlatformAdminStatCard
          title="P0 candidates"
          value={stats.p0}
          icon={<HealthAndSafetyOutlinedIcon sx={{ fontSize: 18 }} />}
          accent="#b91c1c"
        />
        <PlatformAdminStatCard
          title="P1 review"
          value={stats.p1}
          icon={<HealthAndSafetyOutlinedIcon sx={{ fontSize: 18 }} />}
          accent="#b45309"
        />
        <PlatformAdminStatCard
          title="P2 relevel"
          value={stats.p2}
          icon={<HealthAndSafetyOutlinedIcon sx={{ fontSize: 18 }} />}
          accent="#2563eb"
        />
        <PlatformAdminStatCard
          title="Review ready"
          value={stats.reviewReady}
          icon={<HealthAndSafetyOutlinedIcon sx={{ fontSize: 18 }} />}
          accent={ip.navy}
        />
        <PlatformAdminStatCard
          title="Still collecting"
          value={stats.collecting}
          icon={<HealthAndSafetyOutlinedIcon sx={{ fontSize: 18 }} />}
          accent="#64748b"
        />
        <PlatformAdminStatCard
          title="Items in run"
          value={stats.units}
          icon={<HealthAndSafetyOutlinedIcon sx={{ fontSize: 18 }} />}
          accent="#0f766e"
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 260 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: ip.heading, mb: 0.5 }}>
            Run
          </Typography>
          <Select
            size="small"
            displayEmpty
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(String(e.target.value))}
            sx={platformAdminFilterSelectSx(260)}
            MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
            renderValue={(value) => {
              const id = String(value ?? '');
              if (!id) {
                return (
                  <Box component="span" sx={{ color: ip.subtext, fontWeight: 600 }}>
                    No runs yet — run checkup
                  </Box>
                );
              }
              const run = runs.find((r) => r.id === id);
              return (
                <Box component="span" sx={{ color: ip.heading, fontWeight: 600 }}>
                  {id}
                  {run?.status ? ` · ${run.status}` : ''}
                </Box>
              );
            }}
          >
            {runs.length === 0 ? (
              <MenuItem value="" disabled sx={{ color: ip.subtext }}>
                No runs yet — click Run checkup now
              </MenuItem>
            ) : (
              runs.map((r) => (
                <MenuItem key={r.id} value={r.id} sx={{ color: ip.heading }}>
                  {r.id}
                  {r.status ? ` · ${r.status}` : ''}
                </MenuItem>
              ))
            )}
          </Select>
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: ip.heading, mb: 0.5 }}>
            Flag
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={flagFilter}
            onChange={(_e, v) => setFlagFilter((v ?? '') as FlagFilter)}
            sx={toggleGroupSx}
          >
            <ToggleButton value="">All</ToggleButton>
            <ToggleButton value="P0">P0</ToggleButton>
            <ToggleButton value="P1">P1</ToggleButton>
            <ToggleButton value="P2">P2</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: ip.heading, mb: 0.5 }}>
            Data status
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={statusFilter}
            onChange={(_e, v) => setStatusFilter((v ?? '') as StatusFilter)}
            sx={toggleGroupSx}
          >
            <ToggleButton value="">All</ToggleButton>
            <ToggleButton value="REVIEW_READY">Review ready</ToggleButton>
            <ToggleButton value="STABLE">Stable</ToggleButton>
            <ToggleButton value="COLLECTING">Collecting</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {selectedRun?.data_cutoff_ts || selectedRun?.run_started_at ? (
        <Typography sx={{ color: ip.subtext, fontSize: '0.85rem', mb: 1.5 }}>
          Data cutoff{' '}
          {selectedRun.data_cutoff_ts
            ? new Date(selectedRun.data_cutoff_ts).toLocaleString()
            : '—'}
          {selectedRun.run_started_at
            ? ` · Run started ${new Date(selectedRun.run_started_at).toLocaleString()}`
            : ''}
          {` · Showing ${rows.length} of ${totalRows}`}
        </Typography>
      ) : null}

      <PlatformAdminTableSection
        countLabel={`${totalRows} items in queue (showing ${rows.length})`}
      >
        <TableContainer sx={platformAdminTablePaperSx}>
          <Table size="small" sx={platformAdminTableSx}>
            <TableHead>
              <TableRow sx={platformAdminTableHeadRowSx}>
                <TableCell width={40} />
                <TableCell>Item</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell align="right">n</TableCell>
                <TableCell align="right">% correct</TableCell>
                <TableCell align="right">Upper−Lower</TableCell>
                <TableCell align="right">r</TableCell>
                <TableCell align="right">b obs</TableCell>
                <TableCell>Tier</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: ip.subtext }}>
                    {runs.length === 0
                      ? 'No checkup has been run yet. Click “Run checkup now” to build the first queue.'
                      : 'No rows match these filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const id = row.id || row.evidence_unit_id || row.item_id || '';
                  const open = expandedId === id;
                  const statsRow = row.statistics;
                  return (
                    <React.Fragment key={id}>
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setExpandedId(open ? null : id)}
                      >
                        <TableCell>
                          <IconButton size="small">
                            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {row.item_id || row.evidence_unit_id || id}
                          </Typography>
                          {row.design_band ? (
                            <Typography sx={{ fontSize: '0.72rem', color: ip.subtext }}>
                              {row.design_band}
                              {row.operational_tier ? ` · ${row.operational_tier}` : ''}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <PlatformAdminChip
                            label={row.data_sufficiency_status || '—'}
                            tone={statusTone(row.data_sufficiency_status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {row.has_p0 ? (
                              <Chip label="P0" size="small" sx={adminChipSx('error')} />
                            ) : null}
                            {row.has_p1 ? (
                              <Chip label="P1" size="small" sx={adminChipSx('warning')} />
                            ) : null}
                            {row.has_p2 ? (
                              <Chip label="P2" size="small" sx={adminChipSx('info')} />
                            ) : null}
                            {!row.has_p0 && !row.has_p1 && !row.has_p2 ? (
                              <Typography sx={{ fontSize: '0.8rem', color: ip.subtext }}>
                                {flagLabels(row.flags)}
                              </Typography>
                            ) : (
                              <Tooltip title={flagLabels(row.flags)}>
                                <Typography
                                  sx={{
                                    fontSize: '0.72rem',
                                    color: ip.subtext,
                                    maxWidth: 140,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {flagLabels(row.flags)}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{statsRow?.retained_n ?? '—'}</TableCell>
                        <TableCell align="right">
                          {formatPct(statsRow?.overall?.correct_pct)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNum(statsRow?.upper_minus_lower_pp, 1)}
                        </TableCell>
                        <TableCell align="right">{formatNum(statsRow?.point_biserial, 3)}</TableCell>
                        <TableCell align="right">{formatNum(statsRow?.b_observed, 3)}</TableCell>
                        <TableCell>
                          {row.proposed_adjacent_tier ? (
                            <PlatformAdminChip
                              label={`${row.operational_tier || '?'} → ${row.proposed_adjacent_tier}`}
                              tone="info"
                            />
                          ) : (
                            row.operational_tier || '—'
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={10} sx={{ py: 0, border: 0 }}>
                          <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc' }}>
                              <Typography sx={{ fontWeight: 700, mb: 1, fontSize: '0.85rem' }}>
                                Flags
                              </Typography>
                              {(row.flags || []).length === 0 ? (
                                <Typography sx={{ color: ip.subtext, fontSize: '0.85rem' }}>
                                  No flags.
                                </Typography>
                              ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                  {(row.flags || []).map((f, i) => (
                                    <Box key={`${f.code}-${i}`} sx={{ display: 'flex', gap: 1 }}>
                                      <Chip
                                        label={f.severity}
                                        size="small"
                                        sx={adminChipSx(severityTone(f.severity))}
                                      />
                                      <Typography sx={{ fontSize: '0.85rem' }}>
                                        <strong>{f.code}</strong>
                                        {f.detail ? ` — ${f.detail}` : ''}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                              <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={platformAdminOutlinedButtonSx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailRow(row);
                                  }}
                                >
                                  Full stats JSON
                                </Button>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </PlatformAdminTableSection>

      <Dialog
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {detailRow?.item_id || detailRow?.evidence_unit_id || 'Item stats'}
        </DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              bgcolor: '#0f172a',
              color: '#e2e8f0',
              borderRadius: 1,
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '60vh',
            }}
          >
            {JSON.stringify(
              {
                flags: detailRow?.flags,
                statistics: detailRow?.statistics,
                proposed_adjacent_tier: detailRow?.proposed_adjacent_tier,
                operational_tier: detailRow?.operational_tier,
                design_band: detailRow?.design_band,
              },
              null,
              2
            )}
          </Box>
        </DialogContent>
      </Dialog>
        </>
      ) : null}
    </Box>
  );
};

export default PlatformAdminItemHealthPage;
