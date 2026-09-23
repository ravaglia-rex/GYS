import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getPlatformAdminOfficialExamItemAbilityAnalytics,
  getPlatformAdminOfficialExamItemScoreAnalytics,
  type OfficialExamItemAbilityAnalytics,
  type OfficialItemScoreAnalytics,
} from '../../db/platformAdminAnalytics';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminChip } from './platformAdminComponents';

type AnalyticsTab = 'ability' | 'score';

function discriminationTone(
  delta: number | null
): 'success' | 'warning' | 'error' | 'neutral' {
  if (delta == null) return 'neutral';
  if (delta >= 25) return 'success';
  if (delta >= 10) return 'warning';
  return 'error';
}

function abilityLabelTone(
  label: string | null | undefined
): 'success' | 'warning' | 'error' | 'neutral' {
  if (label === 'increasing') return 'success';
  if (label === 'weak_flat' || label === 'insufficient_evidence') return 'warning';
  if (label === 'reversed' || label === 'non_monotonic') return 'error';
  return 'neutral';
}

function formatPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v}%`;
}

function formatSec(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v}s`;
}

function formatLabel(label: string): string {
  return label.replace(/_/g, ' ');
}

function groupTitle(group: string): string {
  if (group === 'lower') return 'Lower';
  if (group === 'middle') return 'Middle';
  if (group === 'upper') return 'Upper';
  return group;
}

export function PlatformAdminItemScoreAnalyticsPanel({
  examId,
  itemId,
  level = null,
  timesSeen = 0,
}: {
  examId: string;
  itemId: string;
  level?: number | null;
  timesSeen?: number;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AnalyticsTab>('ability');
  const [scoreLoading, setScoreLoading] = useState(false);
  const [abilityLoading, setAbilityLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [abilityError, setAbilityError] = useState<string | null>(null);
  const [scoreAnalytics, setScoreAnalytics] = useState<OfficialItemScoreAnalytics | null>(null);
  const [abilityPayload, setAbilityPayload] =
    useState<OfficialExamItemAbilityAnalytics | null>(null);

  useEffect(() => {
    setScoreAnalytics(null);
    setAbilityPayload(null);
    setScoreError(null);
    setAbilityError(null);
    setOpen(false);
    setTab('ability');
  }, [examId, itemId, level]);

  useEffect(() => {
    if (!open || !examId || !itemId || abilityPayload) return;
    let cancelled = false;
    setAbilityLoading(true);
    setAbilityError(null);
    void getPlatformAdminOfficialExamItemAbilityAnalytics(examId, { itemId, level })
      .then((res) => {
        if (!cancelled) setAbilityPayload(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setAbilityError(
            e instanceof Error ? e.message : 'Failed to load ability analytics'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAbilityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, examId, itemId, level, abilityPayload]);

  useEffect(() => {
    if (!open || tab !== 'score' || !examId || !itemId || scoreAnalytics) return;
    let cancelled = false;
    setScoreLoading(true);
    setScoreError(null);
    void getPlatformAdminOfficialExamItemScoreAnalytics(examId, { itemId, level })
      .then((res) => {
        if (!cancelled) setScoreAnalytics(res.analytics);
      })
      .catch((e) => {
        if (!cancelled) {
          setScoreError(
            e instanceof Error ? e.message : 'Failed to load score-band analytics'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setScoreLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, examId, itemId, level, scoreAnalytics]);

  if (timesSeen <= 0) return null;

  const disc = scoreAnalytics?.discrimination;
  const ability = abilityPayload?.analytics;
  const calib = abilityPayload?.calibration;
  const densityChart =
    scoreAnalytics?.density
      .filter((b) => b.times_seen > 0)
      .map((b) => ({
        label: b.label,
        mid: Math.round((b.min_points + b.max_points) / 2),
        correct: b.times_correct,
        incorrect: b.times_incorrect,
        accuracy_pct: b.accuracy_pct,
        avg_time_sec: b.avg_time_sec,
        n: b.times_seen,
      })) ?? [];

  return (
    <Box sx={{ mt: 1.75, pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          onClick={() => setOpen((v) => !v)}
          sx={{ textTransform: 'none', fontWeight: 700, color: ip.navy, px: 0.5 }}
        >
          {open ? 'Hide' : 'Show'} item analytics
        </Button>
        <Typography sx={{ color: '#64748b', fontSize: 12 }}>
          Independent Ability (default) and By Exam Score
        </Typography>
      </Box>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1.25 }}>
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1.25, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant={tab === 'ability' ? 'contained' : 'text'}
              onClick={() => setTab('ability')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: tab === 'ability' ? ip.navy : 'transparent',
                color: tab === 'ability' ? '#fff' : ip.navy,
                '&:hover': { bgcolor: tab === 'ability' ? ip.navy : 'rgba(15,23,42,0.06)' },
              }}
            >
              Independent Ability
            </Button>
            <Button
              size="small"
              variant={tab === 'score' ? 'contained' : 'text'}
              onClick={() => setTab('score')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: tab === 'score' ? ip.navy : 'transparent',
                color: tab === 'score' ? '#fff' : ip.navy,
                '&:hover': { bgcolor: tab === 'score' ? ip.navy : 'rgba(15,23,42,0.06)' },
              }}
            >
              By Exam Score
            </Button>
          </Box>

          {tab === 'ability' ? (
            <Box>
              {abilityLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={20} sx={{ color: ip.navy }} />
                </Box>
              ) : null}
              {abilityError ? (
                <Typography sx={{ color: '#b91c1c', fontSize: 13 }}>{abilityError}</Typography>
              ) : null}
              {!abilityLoading && !abilityError && abilityPayload?.source === 'empty' ? (
                <Typography sx={{ color: '#64748b', fontSize: 13 }}>
                  Not calibrated yet. Run{' '}
                  <code style={{ fontSize: 12 }}>
                    npm run script:calibrate-official-ability-gradient -- --exam=… --level=1
                    --apply
                  </code>{' '}
                  then reload.
                </Typography>
              ) : null}
              {ability && !abilityLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                    <PlatformAdminChip
                      label={`n=${ability.total_submitted}`}
                      tone="neutral"
                    />
                    <PlatformAdminChip
                      label={formatLabel(ability.label)}
                      tone={abilityLabelTone(ability.label)}
                    />
                    <PlatformAdminChip
                      label={
                        ability.upper_minus_lower_pp == null
                          ? 'Upper−Lower —'
                          : `Upper−Lower ${ability.upper_minus_lower_pp >= 0 ? '+' : ''}${ability.upper_minus_lower_pp} pp`
                      }
                      tone={discriminationTone(ability.upper_minus_lower_pp)}
                    />
                    {ability.correlation != null ? (
                      <PlatformAdminChip
                        label={`r=${ability.correlation}`}
                        tone="neutral"
                      />
                    ) : null}
                    {ability.logistic_slope != null ? (
                      <PlatformAdminChip
                        label={`slope=${ability.logistic_slope}`}
                        tone="neutral"
                      />
                    ) : null}
                  </Box>

                  {calib ? (
                    <Typography sx={{ color: '#64748b', fontSize: 12 }}>
                      Filters: Padampat excluded
                      {calib.active_exclusions.length
                        ? ` (${calib.active_exclusions.length} rules)`
                        : ''}
                      {calib.retained_responses
                        ? ` · retained responses ${calib.retained_responses}`
                        : ''}
                      {calib.rapid_response_ms != null
                        ? ` · rapid < ${calib.rapid_response_ms}ms`
                        : ''}
                      {calib.generated_at
                        ? ` · calibrated ${new Date(calib.generated_at).toLocaleString()}`
                        : ''}
                    </Typography>
                  ) : null}

                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 520 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: ip.heading }}>
                            Ability group
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            n
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            Correct %
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            95% Wilson CI
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            Median time
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            Rapid %
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ability.by_group.map((row) => (
                          <TableRow key={row.group}>
                            <TableCell sx={{ color: '#334155', fontSize: 13 }}>
                              {groupTitle(row.group)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {row.n}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {row.n > 0 ? formatPct(row.correct_pct) : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {row.wilson_ci_low != null && row.wilson_ci_high != null
                                ? `${row.wilson_ci_low}–${row.wilson_ci_high}%`
                                : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {formatSec(row.median_time_sec)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {formatPct(row.rapid_pct)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              ) : null}
            </Box>
          ) : (
            <Box>
              {scoreLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={20} sx={{ color: ip.navy }} />
                </Box>
              ) : null}
              {scoreError ? (
                <Typography sx={{ color: '#b91c1c', fontSize: 13 }}>{scoreError}</Typography>
              ) : null}
              {scoreAnalytics && !scoreLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                    <PlatformAdminChip
                      label={`n=${scoreAnalytics.times_seen}`}
                      tone="neutral"
                    />
                    <PlatformAdminChip
                      label={`${scoreAnalytics.accuracy_pct}% overall`}
                      tone="neutral"
                    />
                    {disc ? (
                      <PlatformAdminChip
                        label={
                          disc.delta_pp == null
                            ? 'Score-band accuracy gap —'
                            : `Score-band accuracy gap ${disc.delta_pp >= 0 ? '+' : ''}${disc.delta_pp} pp (${disc.high_label} − ${disc.low_label})`
                        }
                        tone={discriminationTone(disc.delta_pp)}
                      />
                    ) : null}
                  </Box>

                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 420 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: ip.heading }}>
                            Score band
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            n
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            Correct %
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ip.heading }}>
                            Avg time
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {scoreAnalytics.by_score_band.map((row) => (
                          <TableRow key={row.bucket}>
                            <TableCell sx={{ color: '#334155', fontSize: 13 }}>
                              {row.bucket}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {row.times_seen}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {row.times_seen > 0 ? formatPct(row.accuracy_pct) : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#334155', fontSize: 13 }}>
                              {formatSec(row.avg_time_sec)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  {densityChart.length > 0 ? (
                    <Box>
                      <Typography
                        sx={{ fontWeight: 700, color: ip.heading, fontSize: 13, mb: 0.75 }}
                      >
                        Where responses cluster (50-pt score bins)
                      </Typography>
                      <Box sx={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                          <ComposedChart
                            data={densityChart}
                            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                              dataKey="mid"
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              label={{
                                value: 'Attempt score',
                                position: 'insideBottom',
                                offset: -2,
                                style: { fill: '#64748b', fontSize: 11 },
                              }}
                            />
                            <YAxis
                              yAxisId="count"
                              allowDecimals={false}
                              tick={{ fontSize: 11, fill: '#64748b' }}
                            />
                            <YAxis
                              yAxisId="pct"
                              orientation="right"
                              domain={[0, 100]}
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip
                              formatter={(value, name) => {
                                const n = typeof name === 'string' ? name : String(name ?? '');
                                if (n === 'accuracy_pct') return [`${value}%`, 'Correct %'];
                                if (n === 'correct') return [value, 'Correct'];
                                if (n === 'incorrect') return [value, 'Incorrect'];
                                return [value, n];
                              }}
                              labelFormatter={(_, payload) => {
                                const row = payload?.[0]?.payload as
                                  | { label?: string; n?: number }
                                  | undefined;
                                return row?.label
                                  ? `Score ${row.label}${row.n != null ? ` · n=${row.n}` : ''}`
                                  : '';
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar
                              yAxisId="count"
                              dataKey="correct"
                              name="Correct"
                              stackId="resp"
                              fill="#15803d"
                              maxBarSize={18}
                            />
                            <Bar
                              yAxisId="count"
                              dataKey="incorrect"
                              name="Incorrect"
                              stackId="resp"
                              fill="#94a3b8"
                              maxBarSize={18}
                            />
                            <Line
                              yAxisId="pct"
                              type="monotone"
                              dataKey="accuracy_pct"
                              name="Correct %"
                              stroke={ip.navy}
                              strokeWidth={2}
                              dot={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
