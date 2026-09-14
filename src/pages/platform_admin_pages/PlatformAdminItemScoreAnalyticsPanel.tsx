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
  getPlatformAdminOfficialExamItemScoreAnalytics,
  type OfficialItemScoreAnalytics,
} from '../../db/platformAdminAnalytics';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminChip } from './platformAdminComponents';

function discriminationTone(
  delta: number | null
): 'success' | 'warning' | 'error' | 'neutral' {
  if (delta == null) return 'neutral';
  if (delta >= 25) return 'success';
  if (delta >= 10) return 'warning';
  return 'error';
}

function formatPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v}%`;
}

function formatSec(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v}s`;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<OfficialItemScoreAnalytics | null>(null);

  useEffect(() => {
    setAnalytics(null);
    setError(null);
    setOpen(false);
  }, [examId, itemId, level]);

  useEffect(() => {
    if (!open || !examId || !itemId || analytics) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getPlatformAdminOfficialExamItemScoreAnalytics(examId, { itemId, level })
      .then((res) => {
        if (!cancelled) setAnalytics(res.analytics);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load score-band analytics');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, examId, itemId, level, analytics]);

  if (timesSeen <= 0) return null;

  const disc = analytics?.discrimination;
  const densityChart =
    analytics?.density
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
          {open ? 'Hide' : 'Show'} by exam score
        </Button>
        <Typography sx={{ color: '#64748b', fontSize: 12 }}>
          Correct % and time by that attempt’s /1000 score
        </Typography>
      </Box>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1.25 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} sx={{ color: ip.navy }} />
            </Box>
          ) : null}
          {error ? (
            <Typography sx={{ color: '#b91c1c', fontSize: 13 }}>{error}</Typography>
          ) : null}
          {analytics && !loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                <PlatformAdminChip
                  label={`n=${analytics.times_seen}`}
                  tone="neutral"
                />
                <PlatformAdminChip
                  label={`${analytics.accuracy_pct}% overall`}
                  tone="neutral"
                />
                {disc ? (
                  <PlatformAdminChip
                    label={
                      disc.delta_pp == null
                        ? 'Discrimination —'
                        : `Discrimination ${disc.delta_pp >= 0 ? '+' : ''}${disc.delta_pp} pp (${disc.high_label} − ${disc.low_label})`
                    }
                    tone={discriminationTone(disc.delta_pp)}
                  />
                ) : null}
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 420 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: ip.heading }}>Score band</TableCell>
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
                    {analytics.by_score_band.map((row) => (
                      <TableRow key={row.bucket}>
                        <TableCell sx={{ color: '#334155', fontSize: 13 }}>{row.bucket}</TableCell>
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
                  <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: 13, mb: 0.75 }}>
                    Where responses cluster (50-pt score bins)
                  </Typography>
                  <Box sx={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={densityChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                            const row = payload?.[0]?.payload as { label?: string; n?: number } | undefined;
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
      </Collapse>
    </Box>
  );
}
