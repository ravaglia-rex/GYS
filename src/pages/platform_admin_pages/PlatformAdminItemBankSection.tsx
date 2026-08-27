import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getPlatformAdminOfficialExamItemBank,
  getPlatformAdminOfficialExamSummaries,
  getPlatformAdminPracticeExamItemBank,
  type OfficialExamItemBank,
  type OfficialExamSummaryRow,
  type OfficialItemBankFilterKey,
  type OfficialItemBankFilters,
  type OfficialQuestionStatRow,
} from '../../db/platformAdminAnalytics';
import { loadPracticeGoldParentsReviewBank } from '../../data/practiceGoldParentsReviewBank';
import { MathJaxContext } from 'better-react-mathjax';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { platformAdminSearchFieldSx } from './platformAdminPageStyles';
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
  'has_images',
  'is_new',
];

const FILTER_LABELS: Record<OfficialItemBankFilterKey, string> = {
  strand: 'Strand',
  instruction_family: 'Topic / IF',
  band: 'Band',
  family: 'Family',
  subconstruct: 'Subconstruct',
  mechanic: 'Mechanic',
  has_images: 'Images',
  is_new: 'New',
};

const IMAGE_FILTER_LABELS: Record<string, string> = {
  all: 'All',
  yes: 'With images',
  no: 'Without images',
};

const NEW_FILTER_LABELS: Record<string, string> = {
  all: 'All',
  yes: 'Latest upload only',
};

const LEVELS = [1, 2, 3];
const ALL_VALUE = 'all';
const ITEM_BANK_PAGE_SIZE = 40;

type ItemBankKind = 'official' | 'practice' | 'review';

function readBankKind(raw: string | undefined): ItemBankKind {
  if (raw === 'practice') return 'practice';
  if (raw === 'review') return 'review';
  return 'official';
}

function ItemBankVirtualList({
  questions,
  loading,
  renderMath = false,
}: {
  questions: OfficialQuestionStatRow[];
  loading: boolean;
  renderMath?: boolean;
}) {
  const [visible, setVisible] = useState(ITEM_BANK_PAGE_SIZE);
  useEffect(() => {
    setVisible(ITEM_BANK_PAGE_SIZE);
  }, [questions]);
  const shown = questions.slice(0, visible);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={22} sx={{ color: ip.navy }} />
        </Box>
      ) : null}
      {shown.map((q, qi) => (
        <PlatformAdminQuestionPerformanceCard
          key={q.item_id}
          question={q}
          index={qi}
          renderMath={renderMath}
        />
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

function itemIdMatchesQuery(itemId: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return itemId.toLowerCase().includes(q);
}

export function PlatformAdminItemBankSection({
  refreshNonce = 0,
  onLoadingChange,
}: {
  refreshNonce?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const navigate = useNavigate();
  const { bank: bankParam } = useParams<{ bank?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [summaries, setSummaries] = useState<OfficialExamSummaryRow[]>([]);
  const [bank, setBank] = useState<OfficialExamItemBank | null>(null);
  const [loading, setLoading] = useState(false);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);
  const appliedRefreshRef = useRef(0);

  const bankKind = readBankKind(bankParam);
  const examId = searchParams.get('exam') || '';
  const levelRaw = Number(searchParams.get('level'));
  const level = Number.isFinite(levelRaw) && levelRaw > 0 ? Math.floor(levelRaw) : 1;
  const taxonomyParamKey = FILTER_KEYS.map((key) => `${key}:${searchParams.get(key) || ''}`).join('|');
  const filters = useMemo(() => readFilters(searchParams), [taxonomyParamKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const itemIdQuery = searchParams.get('item_id') || '';

  const setQuery = useCallback(
    (patch: {
      exam?: string;
      level?: number;
      filters?: OfficialItemBankFilters;
      itemIdQuery?: string;
    }) => {
      const next = new URLSearchParams();
      const nextExam = patch.exam ?? examId;
      const nextLevel = patch.level ?? level;
      const nextFilters = patch.filters ?? filters;
      const nextItemId = patch.itemIdQuery !== undefined ? patch.itemIdQuery : itemIdQuery;
      if (nextExam) next.set('exam', nextExam);
      next.set('level', String(nextLevel));
      for (const key of FILTER_KEYS) {
        const value = nextFilters[key];
        if (value) next.set(key, value);
      }
      const trimmedItemId = nextItemId.trim();
      if (trimmedItemId) next.set('item_id', trimmedItemId);
      setSearchParams(next, { replace: true });
    },
    [examId, filters, itemIdQuery, level, setSearchParams]
  );

  useEffect(() => {
    if (bankParam && bankParam !== 'official' && bankParam !== 'practice' && bankParam !== 'review') {
      navigate(`/platform-admin/item-bank/official?${searchParams.toString()}`, { replace: true });
    }
  }, [bankParam, navigate, searchParams]);

  useEffect(() => {
    let cancelled = false;
    if (bankKind === 'review') {
      // Fixed Analytical L0 packet — no exam-summary fetch needed.
      setSummaries([
        {
          exam_id: 'analytical_reasoning',
          label: 'Analytical Reasoning',
          completed_attempts: 0,
          unique_students: 0,
          avg_score_pct: 0,
          avg_score_points: 0,
          avg_questions_answered: 0,
          passed_attempts: 0,
          pass_rate_pct: 0,
        },
      ]);
      setSummariesLoading(false);
      if (!examId) {
        setQuery({ exam: 'analytical_reasoning', level: level || 1, filters });
      }
      return;
    }
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
  }, [refreshNonce, bankKind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sidebar switches can land without ?exam=; seed from summaries once available.
  useEffect(() => {
    if (examId || summaries.length === 0) return;
    const first = summaries[0]?.exam_id;
    if (first) setQuery({ exam: first, level: bankKind === 'review' ? 1 : level, filters });
  }, [examId, summaries, level, filters, setQuery, bankKind]);

  useEffect(() => {
    if (!examId) {
      setBank(null);
      return;
    }
    const req = ++reqRef.current;
    setLoading(true);
    setBank(null);
    setError(null);
    onLoadingChange?.(true);
    const refresh = refreshNonce > appliedRefreshRef.current;
    appliedRefreshRef.current = refreshNonce;

    if (bankKind === 'review') {
      try {
        const data = loadPracticeGoldParentsReviewBank({ level, filters });
        if (req !== reqRef.current) return;
        setBank(data);
      } catch (e: unknown) {
        if (req !== reqRef.current) return;
        const err = e as { message?: string };
        setError(err?.message || 'Failed to load review packet');
        setBank(null);
      } finally {
        if (req === reqRef.current) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      }
      return;
    }

    const load =
      bankKind === 'practice'
        ? getPlatformAdminPracticeExamItemBank
        : getPlatformAdminOfficialExamItemBank;
    void load(examId, {
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
        setError(
          err?.response?.data?.error ||
            err?.message ||
            (bankKind === 'practice'
              ? 'Failed to load practice item bank'
              : 'Failed to load item bank')
        );
        setBank(null);
      })
      .finally(() => {
        if (req !== reqRef.current) return;
        setLoading(false);
        onLoadingChange?.(false);
      });
  }, [bankKind, examId, level, filters, refreshNonce, onLoadingChange]);

  const selectedExam = summaries.find((e) => e.exam_id === examId) ?? null;
  const facets = bank?.facets;
  const visibleFilterKeys = FILTER_KEYS.filter((key) => {
    if (filters[key]) return true;
    if (key === 'has_images' || key === 'is_new') return Boolean(bank);
    return (facets?.[key] || []).length > 0;
  });
  const row1FilterKeys = visibleFilterKeys.filter((key) => key === 'strand');
  const row2FilterKeys = visibleFilterKeys.filter((key) => key !== 'strand');
  const questions = useMemo(() => {
    const rows = bank?.questions || [];
    if (!itemIdQuery.trim()) return rows;
    return rows.filter((q) => itemIdMatchesQuery(q.item_id, itemIdQuery));
  }, [bank, itemIdQuery]);

  const renderFilter = (key: OfficialItemBankFilterKey) => {
    const options = facets?.[key] || [];
    const labels: Record<string, string> =
      key === 'has_images'
        ? { [ALL_VALUE]: IMAGE_FILTER_LABELS.all }
        : key === 'is_new'
          ? { [ALL_VALUE]: NEW_FILTER_LABELS.all }
          : { [ALL_VALUE]: `All ${FILTER_LABELS[key].toLowerCase()}` };
    if (key === 'has_images') {
      const counts = Object.fromEntries(options.map((row) => [row.key, row.count]));
      for (const imageKey of ['yes', 'no'] as const) {
        const count = counts[imageKey];
        labels[imageKey] =
          count != null
            ? `${IMAGE_FILTER_LABELS[imageKey]} (${count})`
            : IMAGE_FILTER_LABELS[imageKey];
      }
    } else if (key === 'is_new') {
      const counts = Object.fromEntries(options.map((row) => [row.key, row.count]));
      const count = counts.yes;
      labels.yes =
        count != null ? `${NEW_FILTER_LABELS.yes} (${count})` : NEW_FILTER_LABELS.yes;
    } else {
      for (const row of options) {
        labels[row.key] = `${row.label} (${row.count})`;
      }
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
        fullWidth
        minWidth={key === 'strand' ? 380 : key === 'instruction_family' ? 240 : key === 'is_new' ? 220 : 160}
        onChange={(value) => {
          const next = { ...filters };
          if (value === ALL_VALUE) delete next[key];
          else next[key] = value;
          if (!filtersEqual(next, filters)) setQuery({ filters: next });
        }}
      />
    );
  };

  const emptyCopy =
    bankKind === 'review'
      ? 'No review-draft items for this level/filters. The gold parents packet is Level 1 only.'
      : bankKind === 'practice'
        ? 'No practice items in this exam level for the current filters.'
        : 'No items in this exam level for the current filters.';

  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {bankKind === 'review' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Admin-only review of PRACTICE_GOLD_PARENTS_STUDENT.md — not in live practice_bank.
          Figure SVGs were not bundled; stems include screen-reader text instead. No answer key.
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
            onChange={(_e, value: string) => setQuery({ exam: value, filters: {}, itemIdQuery: '' })}
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
                ? `${shortOfficialExamLabel(selectedExam.label)} · Level ${level} · ${
                    bankKind === 'review'
                      ? 'Review drafts'
                      : bankKind === 'practice'
                        ? 'Practice'
                        : 'Official'
                  }`
                : bankKind === 'review'
                  ? 'Review drafts'
                  : bankKind === 'practice'
                    ? 'Practice bank'
                    : 'Official bank'
            }
            subtitle={
              bank
                ? `${(itemIdQuery.trim() ? questions.length : bank.total_items).toLocaleString()} items · ${(
                    itemIdQuery.trim()
                      ? questions.filter((q) => q.times_seen > 0).length
                      : bank.served_items
                  ).toLocaleString()} served. Search by item ID or combine filters.${
                    bankKind === 'official' ? ' Unserved items stay visible.' : ''
                  }${
                    bankKind === 'review'
                      ? ' Keyless review packet — not authorized for practice or scored delivery.'
                      : ''
                  }${
                    bank.latest_upload_at
                      ? ` Latest upload: ${new Date(bank.latest_upload_at).toLocaleString()}.`
                      : ''
                  }`
                : bankKind === 'review'
                  ? 'Browse the gold practice parent review packet with stems and options.'
                  : bankKind === 'practice'
                    ? 'Browse every practice-bank item with options and the correct answer.'
                    : 'Browse every official bank item with options, the correct answer, and pick rates.'
            }
            accent="teal"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: row1FilterKeys.length > 0 ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
                  },
                  gap: 1.25,
                  alignItems: 'center',
                }}
              >
                <TextField
                  id="item-bank-item-id"
                  size="small"
                  placeholder="Search item ID (AR-L1-T5-05-P1:v1)"
                  value={itemIdQuery}
                  onChange={(e) => setQuery({ itemIdQuery: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: ip.subtext, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ 'aria-label': 'Search item bank by item ID' }}
                  sx={{
                    ...platformAdminSearchFieldSx,
                    width: '100%',
                    minWidth: 0,
                  }}
                />
                {row1FilterKeys.map(renderFilter)}
              </Box>
              {row2FilterKeys.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: `repeat(${row2FilterKeys.length}, minmax(0, 1fr))`,
                    },
                    gap: 1.25,
                    alignItems: 'center',
                  }}
                >
                  {row2FilterKeys.map(renderFilter)}
                </Box>
              ) : null}
            </Box>

            {loading && !bank ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} sx={{ color: ip.navy }} />
              </Box>
            ) : !bank || questions.length === 0 ? (
              <Typography variant="body2" sx={{ color: ip.subtext, py: 2 }}>
                {emptyCopy}
              </Typography>
            ) : examId === 'mathematical_reasoning' ? (
              <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
                <ItemBankVirtualList questions={questions} loading={loading} renderMath />
              </MathJaxContext>
            ) : (
              <ItemBankVirtualList questions={questions} loading={loading} />
            )}
          </PlatformAdminAnalyticsSection>
        </>
      )}
    </>
  );
}
