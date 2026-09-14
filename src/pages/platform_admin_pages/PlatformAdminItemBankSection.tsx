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
import { MathJaxContext } from 'better-react-mathjax';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { platformAdminSearchFieldSx } from './platformAdminPageStyles';
import {
  PlatformAdminAnalyticsSection,
  PlatformAdminFilterControl,
} from './platformAdminComponents';
import { PlatformAdminQuestionPerformanceCard } from './PlatformAdminExamQuestionCard';
import { createTtlMemoryCache } from './platformAdminMemoryCache';

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
  'approved',
];

const FILTER_LABELS: Record<OfficialItemBankFilterKey, string> = {
  strand: 'Strand',
  instruction_family: 'Topic / IF',
  band: 'Band',
  family: 'Family',
  subconstruct: 'Subconstruct',
  mechanic: 'Mechanic',
  approved: 'Approval',
};

const APPROVED_FILTER_LABELS: Record<string, string> = {
  all: 'All',
  yes: 'Approved',
  no: 'Not approved',
};

const LEVELS = [1, 2, 3];
const ALL_VALUE = 'all';
const ITEM_BANK_PAGE_SIZE = 40;

/** Survives route remounts (Question Reports ↔ Item Bank). */
const itemBankSessionCache = createTtlMemoryCache<OfficialExamItemBank>({
  maxEntries: 12,
  defaultTtlMs: 10 * 60 * 1000,
});
const examSummariesSessionCache = createTtlMemoryCache<OfficialExamSummaryRow[]>({
  maxEntries: 4,
  defaultTtlMs: 10 * 60 * 1000,
});
const EXAM_SUMMARIES_CACHE_KEY = 'official-exam-summaries';

type ItemBankKind = 'official' | 'practice';

function readBankKind(raw: string | undefined): ItemBankKind {
  if (raw === 'practice') return 'practice';
  return 'official';
}

function itemBankCacheKey(
  bankKind: ItemBankKind,
  examId: string,
  level: number,
  filters: OfficialItemBankFilters
): string {
  const filterPart = FILTER_KEYS.map((key) => `${key}=${filters[key] || ''}`).join('&');
  return `${bankKind}|${examId}|${level}|${filterPart}`;
}

function bankMatchesRequest(
  bank: OfficialExamItemBank | null,
  examId: string,
  level: number,
  filters: OfficialItemBankFilters
): boolean {
  if (!bank || bank.exam_id !== examId || bank.level !== level) return false;
  return filtersEqual(bank.filters || {}, filters);
}

function ItemBankVirtualList({
  questions,
  loading,
  renderMath = false,
  examId = null,
  level = null,
  canApprove = false,
  canEditContent = false,
  bankKind = 'official',
  onApprovalChange,
  onItemUpdated,
  onItemDeleted,
}: {
  questions: OfficialQuestionStatRow[];
  loading: boolean;
  renderMath?: boolean;
  examId?: string | null;
  level?: number | null;
  canApprove?: boolean;
  /** Content edit dialog (AR taxonomy schema). Separate from approve/delete. */
  canEditContent?: boolean;
  bankKind?: ItemBankKind;
  onApprovalChange?: (itemId: string, deliveryAuthorized: boolean) => void;
  onItemUpdated?: (itemId: string, next: OfficialQuestionStatRow) => void;
  onItemDeleted?: (itemId: string) => void;
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
          examId={examId}
          level={level}
          canApprove={canApprove}
          canEditContent={canEditContent}
          bankKind={bankKind}
          onApproved={(itemId, deliveryAuthorized) =>
            onApprovalChange?.(itemId, deliveryAuthorized)
          }
          onItemUpdated={onItemUpdated}
          onItemDeleted={onItemDeleted}
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

  const bankKind = readBankKind(bankParam);
  const examId = searchParams.get('exam') || '';
  const levelRaw = Number(searchParams.get('level'));
  const level = Number.isFinite(levelRaw) && levelRaw > 0 ? Math.floor(levelRaw) : 1;
  const taxonomyParamKey = FILTER_KEYS.map((key) => `${key}:${searchParams.get(key) || ''}`).join('|');
  const filters = useMemo(() => readFilters(searchParams), [taxonomyParamKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const itemIdQuery = searchParams.get('item_id') || '';
  const bankCacheKey = useMemo(
    () => (examId ? itemBankCacheKey(bankKind, examId, level, filters) : ''),
    [bankKind, examId, level, filters]
  );

  const [summaries, setSummaries] = useState<OfficialExamSummaryRow[]>(
    () => examSummariesSessionCache.get(EXAM_SUMMARIES_CACHE_KEY) ?? []
  );
  const [bank, setBank] = useState<OfficialExamItemBank | null>(() => {
    const kind = readBankKind(bankParam);
    const exam = searchParams.get('exam') || '';
    if (!exam) return null;
    const lvlRaw = Number(searchParams.get('level'));
    const lvl = Number.isFinite(lvlRaw) && lvlRaw > 0 ? Math.floor(lvlRaw) : 1;
    return itemBankSessionCache.get(itemBankCacheKey(kind, exam, lvl, readFilters(searchParams)));
  });
  const [loading, setLoading] = useState(() => {
    const exam = searchParams.get('exam') || '';
    if (!exam) return false;
    const kind = readBankKind(bankParam);
    const lvlRaw = Number(searchParams.get('level'));
    const lvl = Number.isFinite(lvlRaw) && lvlRaw > 0 ? Math.floor(lvlRaw) : 1;
    return !itemBankSessionCache.get(itemBankCacheKey(kind, exam, lvl, readFilters(searchParams)));
  });
  const [summariesLoading, setSummariesLoading] = useState(
    () => !examSummariesSessionCache.get(EXAM_SUMMARIES_CACHE_KEY)
  );
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);
  const appliedRefreshRef = useRef(0);
  const bankCacheKeyRef = useRef(bankCacheKey);
  bankCacheKeyRef.current = bankCacheKey;

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
    if (bankParam === 'review') {
      navigate(`/platform-admin/item-bank/practice?${searchParams.toString()}`, { replace: true });
      return;
    }
    if (bankParam && bankParam !== 'official' && bankParam !== 'practice') {
      navigate(`/platform-admin/item-bank/official?${searchParams.toString()}`, { replace: true });
    }
  }, [bankParam, navigate, searchParams]);

  // Drop legacy `is_new` URL param (removed filter; Approval is enough).
  useEffect(() => {
    if (!searchParams.has('is_new')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('is_new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    const refresh = refreshNonce > appliedRefreshRef.current;
    if (!refresh) {
      const cached = examSummariesSessionCache.get(EXAM_SUMMARIES_CACHE_KEY);
      if (cached) {
        setSummaries(cached);
        setSummariesLoading(false);
        if (!examId && cached[0]?.exam_id) {
          setQuery({ exam: cached[0].exam_id, level, filters });
        }
        return () => {
          cancelled = true;
        };
      }
    }
    setSummariesLoading(true);
    void getPlatformAdminOfficialExamSummaries({ refresh })
      .then((data) => {
        if (cancelled) return;
        examSummariesSessionCache.set(EXAM_SUMMARIES_CACHE_KEY, data.exams);
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
    if (first) setQuery({ exam: first, level, filters });
  }, [examId, summaries, level, filters, setQuery]);

  useEffect(() => {
    if (!examId || !bankCacheKey) {
      setBank(null);
      return;
    }
    const req = ++reqRef.current;
    const refresh = refreshNonce > appliedRefreshRef.current;
    appliedRefreshRef.current = refreshNonce;

    if (!refresh) {
      const cached = itemBankSessionCache.get(bankCacheKey);
      if (cached) {
        setBank(cached);
        setLoading(false);
        setError(null);
        onLoadingChange?.(false);
        return;
      }
    } else {
      itemBankSessionCache.delete(bankCacheKey);
    }

    setError(null);
    // Keep current questions visible when they already match this request.
    setBank((prev) => {
      if (bankMatchesRequest(prev, examId, level, filters)) return prev;
      return null;
    });
    setLoading(true);
    onLoadingChange?.(true);

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
        itemBankSessionCache.set(bankCacheKey, data);
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
  }, [bankKind, examId, level, filters, bankCacheKey, refreshNonce, onLoadingChange]);

  // Write-through so Approve / edit / delete survive remount.
  useEffect(() => {
    if (!bank || !bankCacheKeyRef.current) return;
    if (bank.exam_id !== examId || bank.level !== level) return;
    itemBankSessionCache.set(bankCacheKeyRef.current, bank);
  }, [bank, examId, level]);

  const selectedExam = summaries.find((e) => e.exam_id === examId) ?? null;
  const facets = bank?.facets;
  // Always show the same filter controls for every exam / bank. Empty facets
  // still render as "All …" so Verbal/Math match Analytical chrome.
  const visibleFilterKeys = FILTER_KEYS;
  const row1FilterKeys = visibleFilterKeys.filter((key) => key === 'strand');
  const row2FilterKeys = visibleFilterKeys.filter((key) => key !== 'strand');
  // Approved / other taxonomy filters are applied by the API.
  // Only item-id search is client-side so we do not double-filter and empty
  // stale Redis payloads that already match `approved=`.
  const questions = useMemo(() => {
    const rows = bank?.questions || [];
    if (!itemIdQuery.trim()) return rows;
    return rows.filter((q) => itemIdMatchesQuery(q.item_id, itemIdQuery));
  }, [bank, itemIdQuery]);

  const renderFilter = (key: OfficialItemBankFilterKey) => {
    const options = facets?.[key] || [];
    const labels: Record<string, string> =
      key === 'approved'
        ? { [ALL_VALUE]: APPROVED_FILTER_LABELS.all }
        : { [ALL_VALUE]: `All ${FILTER_LABELS[key].toLowerCase()}` };
    if (key === 'approved') {
      const counts = Object.fromEntries(options.map((row) => [row.key, row.count]));
      for (const approvedKey of ['yes', 'no'] as const) {
        const count = counts[approvedKey];
        labels[approvedKey] =
          count != null
            ? `${APPROVED_FILTER_LABELS[approvedKey]} (${count})`
            : APPROVED_FILTER_LABELS[approvedKey];
      }
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
        minWidth={key === 'strand' ? 380 : key === 'instruction_family' ? 240 : 160}
        onChange={(value) => {
          const next = { ...filters };
          if (value === ALL_VALUE) delete next[key];
          else next[key] = value;
          if (!filtersEqual(next, filters)) setQuery({ filters: next });
        }}
      />
    );
  };

  const handleApprovalChange = useCallback(
    (itemId: string, deliveryAuthorized: boolean) => {
      setBank((prev) => {
        if (!prev) return prev;
        // Facet counts are for the unfiltered level; keep using the previous
        // totals so Approve/Unapprove only nudges yes/no by ±1.
        const prevApproved =
          prev.facets?.approved?.find((row) => row.key === 'yes')?.count ??
          prev.questions.filter((q) => q.delivery_authorized === true).length;
        const prevNotApproved =
          prev.facets?.approved?.find((row) => row.key === 'no')?.count ??
          Math.max(0, (prev.total_items || prev.questions.length) - prevApproved);
        const wasAuthorized =
          prev.questions.find((q) => q.item_id === itemId)?.delivery_authorized === true;
        let approvedCount = prevApproved;
        let notApprovedCount = prevNotApproved;
        if (wasAuthorized !== deliveryAuthorized) {
          approvedCount = Math.max(0, prevApproved + (deliveryAuthorized ? 1 : -1));
          notApprovedCount = Math.max(0, prevNotApproved + (deliveryAuthorized ? -1 : 1));
        }

        let questions = prev.questions.map((q) =>
          q.item_id === itemId ? { ...q, delivery_authorized: deliveryAuthorized } : q
        );
        // Stay consistent with the active Approval filter without a refetch.
        if (filters.approved === 'yes' && !deliveryAuthorized) {
          questions = questions.filter((q) => q.item_id !== itemId);
        } else if (filters.approved === 'no' && deliveryAuthorized) {
          questions = questions.filter((q) => q.item_id !== itemId);
        }

        return {
          ...prev,
          questions,
          total_items: questions.length,
          served_items: questions.filter((q) => q.times_seen > 0).length,
          facets: {
            ...prev.facets,
            approved: [
              { key: 'yes', label: 'Approved', count: approvedCount },
              { key: 'no', label: 'Not approved', count: notApprovedCount },
            ],
          },
        };
      });
    },
    [filters.approved]
  );

  const handleItemUpdated = useCallback((itemId: string, next: OfficialQuestionStatRow) => {
    setBank((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) => (q.item_id === itemId ? { ...q, ...next } : q)),
      };
    });
  }, []);

  const handleItemDeleted = useCallback((itemId: string) => {
    setBank((prev) => {
      if (!prev) return prev;
      const removed = prev.questions.find((q) => q.item_id === itemId);
      const questions = prev.questions.filter((q) => q.item_id !== itemId);
      const wasAuthorized = removed?.delivery_authorized === true;
      const prevApproved =
        prev.facets?.approved?.find((row) => row.key === 'yes')?.count ??
        prev.questions.filter((q) => q.delivery_authorized === true).length;
      const prevNotApproved =
        prev.facets?.approved?.find((row) => row.key === 'no')?.count ??
        Math.max(0, (prev.total_items || prev.questions.length) - prevApproved);
      const approvedCount = wasAuthorized ? Math.max(0, prevApproved - 1) : prevApproved;
      const notApprovedCount = wasAuthorized ? prevNotApproved : Math.max(0, prevNotApproved - 1);
      return {
        ...prev,
        questions,
        total_items: questions.length,
        served_items: questions.filter((q) => q.times_seen > 0).length,
        facets: prev.facets?.approved
          ? {
              ...prev.facets,
              approved: [
                { key: 'yes', label: 'Approved', count: approvedCount },
                { key: 'no', label: 'Not approved', count: notApprovedCount },
              ],
            }
          : prev.facets,
      };
    });
  }, []);

  useEffect(() => {
    if (bankKind !== 'practice') return;
    if (level !== 1) setQuery({ level: 1 });
  }, [bankKind, level, setQuery]);

  const emptyCopy =
    bankKind === 'practice'
      ? 'No practice items for this exam for the current filters.'
      : 'No items in this exam level for the current filters.';

  const canApprove = Boolean(examId);
  const canEditContent = Boolean(examId);

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
            sx={{
              ...examPickerTabsSx,
              display: bankKind === 'practice' ? 'none' : undefined,
            }}
          >
            {LEVELS.map((lvl) => (
              <Tab key={lvl} value={lvl} label={`Level ${lvl}`} />
            ))}
          </Tabs>

          <PlatformAdminAnalyticsSection
            title={
              selectedExam
                ? `${shortOfficialExamLabel(selectedExam.label)}${
                    bankKind === 'practice' ? ' · Practice' : ` · Level ${level} · Official`
                  }`
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
                  ).toLocaleString()} served. Same filters and Approve / Edit / Delete on every exam.${
                    bankKind === 'official' ? ' Unserved items stay visible.' : ''
                  }${
                    bankKind === 'practice'
                      ? ' Approve items before students can draw them in practice.'
                      : ''
                  }${
                    bank.latest_upload_at
                      ? ` Latest upload: ${new Date(bank.latest_upload_at).toLocaleString()}.`
                      : ''
                  }`
                : bankKind === 'practice'
                  ? 'Browse the practice pool with options and the correct answer.'
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
                  placeholder={
                    bankKind === 'practice'
                      ? 'Search item ID'
                      : 'Search item ID (AR-L1-T5-05-P1:v1)'
                  }
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
                <ItemBankVirtualList
                  questions={questions}
                  loading={loading}
                  renderMath
                  examId={examId}
                  level={level}
                  canApprove={canApprove}
                  canEditContent={canEditContent}
                  bankKind={bankKind}
                  onApprovalChange={handleApprovalChange}
                  onItemUpdated={handleItemUpdated}
                  onItemDeleted={handleItemDeleted}
                />
              </MathJaxContext>
            ) : (
              <ItemBankVirtualList
                questions={questions}
                loading={loading}
                examId={examId}
                level={level}
                canApprove={canApprove}
                canEditContent={canEditContent}
                bankKind={bankKind}
                onApprovalChange={handleApprovalChange}
                onItemUpdated={handleItemUpdated}
                onItemDeleted={handleItemDeleted}
              />
            )}
          </PlatformAdminAnalyticsSection>
        </>
      )}
    </>
  );
}
