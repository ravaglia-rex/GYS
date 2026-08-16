import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import {
  getPlatformAdminOfficialExamItemBank,
  getPlatformAdminOfficialExamSummaries,
  type OfficialExamItemBank,
  type OfficialExamSummaryRow,
  type OfficialItemBankFilterKey,
  type OfficialItemBankFilters,
  type OfficialQuestionStatRow,
} from '../../db/platformAdminAnalytics';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  platformAdminFilterToolbarRowSx,
} from './platformAdminPageStyles';
import {
  PlatformAdminAnalyticsSection,
  PlatformAdminFilterControl,
} from './platformAdminComponents';
import { PlatformAdminQuestionPerformanceCard } from './PlatformAdminExamQuestionCard';

/**
 * Subconstruct is hidden for now: on current AR banks it is the strand label
 * (or a family→strand alias), so the filter duplicates Strand.
 * Restore `'subconstruct'` here if a later official upload stores a distinct
 * `item.subconstruct` / `subconstruct_tags` that is not the strand.
 */
const FILTER_KEYS: OfficialItemBankFilterKey[] = [
  'strand',
  'instruction_family',
  'band',
  'family',
  'mechanic',
];

const FILTER_LABELS: Record<OfficialItemBankFilterKey, string> = {
  strand: 'Strand',
  instruction_family: 'Topic / IF',
  band: 'Band',
  family: 'Family',
  subconstruct: 'Subconstruct',
  mechanic: 'Mechanic',
};

const LEVELS = [1, 2, 3];
const ALL_VALUE = 'all';
const ITEM_BANK_PAGE_SIZE = 40;

function ItemBankVirtualList({
  questions,
  loading,
}: {
  questions: OfficialQuestionStatRow[];
  loading: boolean;
}) {
  const [visible, setVisible] = useState(ITEM_BANK_PAGE_SIZE);
  const shown = questions.slice(0, visible);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={22} sx={{ color: ip.navy }} />
        </Box>
      ) : null}
      {shown.map((q, qi) => (
        <PlatformAdminQuestionPerformanceCard key={q.item_id} question={q} index={qi} />
      ))}
      {visible < questions.length ? (
        <Button
          onClick={() => setVisible((n) => n + ITEM_BANK_PAGE_SIZE)}
          sx={{ alignSelf: 'center', textTransform: 'none' }}
        >
          Show more ({questions.length - visible} remaining)
        </Button>
      ) : null}
    </Box>
  );
}

const examPickerTabsSx = {
  mb: 2,
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

function shortOfficialExamLabel(label: string): string {
  return label.replace(/\s+Reasoning$/i, '').trim() || label;
}

function readFilters(params: URLSearchParams): OfficialItemBankFilters {
  const filters: OfficialItemBankFilters = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key)?.trim();
    if (value) filters[key] = value;
  }
  return filters;
}

function filtersEqual(a: OfficialItemBankFilters, b: OfficialItemBankFilters): boolean {
  return FILTER_KEYS.every((key) => (a[key] || '') === (b[key] || ''));
}

export function PlatformAdminItemBankSection({
  refreshNonce = 0,
  onLoadingChange,
}: {
  refreshNonce?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [summaries, setSummaries] = useState<OfficialExamSummaryRow[]>([]);
  const [bank, setBank] = useState<OfficialExamItemBank | null>(null);
  const [loading, setLoading] = useState(false);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);
  const appliedRefreshRef = useRef(0);

  const examId = searchParams.get('exam') || '';
  const levelRaw = Number(searchParams.get('level'));
  const level = Number.isFinite(levelRaw) && levelRaw > 0 ? Math.floor(levelRaw) : 1;
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const setQuery = useCallback(
    (patch: { exam?: string; level?: number; filters?: OfficialItemBankFilters }) => {
      const next = new URLSearchParams();
      const nextExam = patch.exam ?? examId;
      const nextLevel = patch.level ?? level;
      const nextFilters = patch.filters ?? filters;
      if (nextExam) next.set('exam', nextExam);
      next.set('level', String(nextLevel));
      for (const key of FILTER_KEYS) {
        const value = nextFilters[key];
        if (value) next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [examId, filters, level, setSearchParams]
  );

  useEffect(() => {
    let cancelled = false;
    const refresh = refreshNonce > appliedRefreshRef.current;
    setSummariesLoading(true);
    void getPlatformAdminOfficialExamSummaries({ refresh })
      .then((data) => {
        if (cancelled) return;
        setSummaries(data.exams);
        if (!examId && data.exams[0]?.exam_id) {
          setQuery({ exam: data.exams[0].exam_id, level, filters });
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setError(err?.response?.data?.error || err?.message || 'Failed to load exams');
      })
      .finally(() => {
        if (!cancelled) setSummariesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!examId) return;
    const req = ++reqRef.current;
    setLoading(true);
    setError(null);
    onLoadingChange?.(true);
    const refresh = refreshNonce > appliedRefreshRef.current;
    appliedRefreshRef.current = refreshNonce;
    void getPlatformAdminOfficialExamItemBank(examId, {
      level,
      filters,
      refresh,
    })
      .then((data) => {
        if (req !== reqRef.current) return;
        setBank(data);
      })
      .catch((e: unknown) => {
        if (req !== reqRef.current) return;
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setError(err?.response?.data?.error || err?.message || 'Failed to load item bank');
        setBank(null);
      })
      .finally(() => {
        if (req !== reqRef.current) return;
        setLoading(false);
        onLoadingChange?.(false);
      });
  }, [examId, level, filters, refreshNonce, onLoadingChange]);

  const selectedExam = summaries.find((e) => e.exam_id === examId) ?? null;
  const facets = bank?.facets;
  const visibleFilterKeys = FILTER_KEYS.filter((key) => {
    if (filters[key]) return true;
    return (facets?.[key] || []).length > 0;
  });

  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {summariesLoading && summaries.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: ip.navy }} />
        </Box>
      ) : (
        <>
          <Tabs
            value={examId || false}
            onChange={(_e, value: string) => setQuery({ exam: value, filters: {} })}
            variant="scrollable"
            scrollButtons="auto"
            sx={examPickerTabsSx}
          >
            {summaries.map((exam) => (
              <Tab
                key={exam.exam_id}
                value={exam.exam_id}
                label={shortOfficialExamLabel(exam.label)}
              />
            ))}
          </Tabs>

          <Tabs
            value={level}
            onChange={(_e, value: number) => setQuery({ level: value })}
            sx={examPickerTabsSx}
          >
            {LEVELS.map((lvl) => (
              <Tab key={lvl} value={lvl} label={`Level ${lvl}`} />
            ))}
          </Tabs>

          <PlatformAdminAnalyticsSection
            title={
              selectedExam
                ? `${shortOfficialExamLabel(selectedExam.label)} · Level ${level} item bank`
                : 'Item bank'
            }
            subtitle={
              bank
                ? `${bank.total_items.toLocaleString()} items · ${bank.served_items.toLocaleString()} served. Filters combine. Unserved items stay visible.`
                : 'Browse every official bank item with options, the correct answer, and pick rates.'
            }
            accent="teal"
          >
            {visibleFilterKeys.length > 0 ? (
              <Box sx={{ ...platformAdminFilterToolbarRowSx, mb: 2, flexWrap: 'wrap', gap: 1.25 }}>
                {visibleFilterKeys.map((key) => {
                  const options = facets?.[key] || [];
                  const labels: Record<string, string> = { [ALL_VALUE]: `All ${FILTER_LABELS[key].toLowerCase()}` };
                  for (const row of options) {
                    labels[row.key] = `${row.label} (${row.count})`;
                  }
                  const current = filters[key];
                  if (current && !labels[current]) labels[current] = current;
                  return (
                    <PlatformAdminFilterControl
                      key={key}
                      id={`item-bank-${key}`}
                      label={FILTER_LABELS[key]}
                      labels={labels}
                      value={current || ALL_VALUE}
                      minWidth={
                        key === 'strand' ? 380 : key === 'instruction_family' ? 240 : 160
                      }
                      onChange={(value) => {
                        const next = { ...filters };
                        if (value === ALL_VALUE) delete next[key];
                        else next[key] = value;
                        if (!filtersEqual(next, filters)) setQuery({ filters: next });
                      }}
                    />
                  );
                })}
              </Box>
            ) : null}

            {loading && !bank ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} sx={{ color: ip.navy }} />
              </Box>
            ) : !bank || bank.questions.length === 0 ? (
              <Typography variant="body2" sx={{ color: ip.subtext, py: 2 }}>
                No items in this exam level for the current filters.
              </Typography>
            ) : (
              <ItemBankVirtualList questions={bank.questions} loading={loading} />
            )}
          </PlatformAdminAnalyticsSection>
        </>
      )}
    </>
  );
}
