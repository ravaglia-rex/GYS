import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ArOptionFigure, ArOptionFigureSlice, useArOptionFigureMeta } from '../../components/assessment/ArOptionFigure';
import {
  AR_FIGURE_DISPLAY_SIZES,
  normalizeArFigureDisplaySize,
  arFigureSizeMultiplier,
  scaleExamFigureCaps,
  isArTextOptionGrid2x2,
  looksLikeArAsciiGridOptionTexts,
  type ArFigureDisplaySize,
} from '../../components/assessment/arFigureDisplaySize';
import { resolveLearnerExamOptions } from '../../components/assessment/resolveLearnerExamOptions';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionStimulus';
import { cleanLearnerFacingExamMarkup } from '../../components/assessment/cleanLearnerFacingExamMarkup';
import { isPlaceholderOptionText } from '../../components/assessment/arOptionFigureModel';
import {
  ExamMarkdown,
  ExamRichPrompt,
  EXAM_FIGURE_MAX_HEIGHT_PX,
  EXAM_FIGURE_MAX_WIDTH_PX,
  looksLikeExamMarkdown,
  shouldRenderStructuredStimulus,
} from '../../components/assessment/ExamMarkdown';
import { ExamMathText } from '../../components/assessment/ExamMathText';
import type { ExamQuestion } from '../../db/assessmentCollection';
import type {
  OfficialAttemptQuestionRow,
  OfficialQuestionStatRow,
} from '../../db/platformAdminAnalytics';
import {
  approvePlatformAdminOfficialExamBankItem,
  unapprovePlatformAdminOfficialExamBankItem,
  updatePlatformAdminOfficialExamBankItem,
} from '../../db/platformAdminAnalytics';
import { MathJaxContext } from 'better-react-mathjax';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminAccuracyChip, PlatformAdminChip } from './platformAdminComponents';
import {
  platformAdminDialogFieldLabelSx,
  platformAdminDialogPaperSx,
  platformAdminDialogSelectSx,
  platformAdminDialogTextFieldSx,
  platformAdminFilterGroupSx,
  platformAdminSelectMenuPaperSx,
} from './platformAdminStyleTokens';
const AR_EDIT_BANDS = ['L0-S', 'L1-E', 'L1-C', 'L1-S', 'L2-E', 'L2-C', 'L2-S'] as const;
const AR_EDIT_STRANDS = [
  { id: 'pattern', label: 'Pattern & Structure Induction' },
  { id: 'rule', label: 'Rule & Transformation Application' },
  { id: 'relational', label: 'Relational & Constraint Deduction' },
  { id: 'flexible', label: 'Flexible Model Evaluation' },
] as const;
const AR_EDIT_IFS = [
  'IF-01',
  'IF-02',
  'IF-03',
  'IF-04',
  'IF-05',
  'IF-06',
  'IF-07',
  'IF-08',
  'IF-09',
  'IF-10',
] as const;
const AR_EDIT_MODES = [
  'abstract_figural',
  'code_table',
  'relational_schematic',
  'short_context',
  'spatial_2d',
  'spatial_3d',
] as const;
const AR_EDIT_SIZE_LABELS: Record<ArFigureDisplaySize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function stripOptionLetterPrefix(option: string): string {
  return String(option ?? '').replace(/^[A-D][.)]\s+/i, '').trim();
}

function apiErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const msg = String(
      (e as { response?: { data?: { error?: string } } }).response?.data?.error || ''
    ).trim();
    if (msg) return msg;
  }
  return fallback;
}

export function toAdminStimulusExamQuestion(q: {
  item_id: string;
  prompt?: string;
  prompt_preview?: string;
  options?: Array<{ text: string }>;
  stimulus?: unknown;
  stimulus_type?: string | null;
  assets?: Array<{ path?: string; alt?: string }>;
  option_figure?: { src: string; alt?: string } | null;
}): ExamQuestion {
  return {
    id: q.item_id,
    prompt: q.prompt || q.prompt_preview || '',
    options: (q.options || []).map((o) => o.text),
    stimulus: q.stimulus,
    stimulus_type: q.stimulus_type ?? undefined,
  };
}

export function AdminExamQuestionStem({
  q,
  emptyLabel,
  hideOptionFigure,
  renderMath = false,
}: {
  q: {
    item_id: string;
    prompt?: string;
    prompt_preview?: string;
    options?: Array<{ text: string }>;
    stimulus?: unknown;
    stimulus_type?: string | null;
    assets?: Array<{ path?: string; alt?: string }>;
    option_figure?: { src: string; alt?: string } | null;
    display_mode?: 'figure_tiles' | 'letter_buttons' | 'text_options' | null;
    stem_display_size?: 'small' | 'medium' | 'large' | 'normal' | null;
  };
  emptyLabel: string;
  hideOptionFigure?: boolean;
  hideEmbeddedChoices?: boolean;
  /** Requires MathJaxContext ancestor (Mathematical Reasoning). */
  renderMath?: boolean;
}) {
  const resolved = resolveLearnerExamOptions({
    markdown: q.prompt || q.prompt_preview || '',
    stimulus: q.stimulus,
    stimulusType: q.stimulus_type,
    bankOptions: (q.options || []).map((o) => o.text),
    assets: q.assets,
    optionFigure: q.option_figure,
    displayMode: q.display_mode,
  });
  const stemMarkdown = resolved.stemMarkdown;
  const optionFigure = resolved.optionFigure;
  // Some item-bank payloads include real option text, but `resolveLearnerExamOptions`
  // may fail to parse it from markdown/stimulus and can incorrectly mark `realText=false`.
  // In that case we still want to hide the option-image strip because the text
  // choices are available in `q.options[].text`.
  const hasRealOptionTextInBank = Boolean(
    (q.options || []).some((o, i) => {
      const cleaned = stripOptionLetterPrefix(cleanLearnerFacingExamMarkup(o.text));
      return Boolean(cleaned && !isPlaceholderOptionText(cleaned, i));
    })
  );
  const hasAnyRealOptionText = resolved.hasRealOptionText || hasRealOptionTextInBank;
  const stemCaps = scaleExamFigureCaps(
    EXAM_FIGURE_MAX_WIDTH_PX,
    EXAM_FIGURE_MAX_HEIGHT_PX,
    q.stem_display_size
  );
  return (
    <>
      <Box sx={{ mb: 1.25 }}>
        <ExamRichPrompt
          prompt={stemMarkdown}
          emptyLabel={emptyLabel}
          maxFigureWidth={stemCaps.maxWidth}
          maxFigureHeight={stemCaps.maxHeight}
          renderMath={renderMath}
        />
      </Box>
      {shouldRenderStructuredStimulus(q.stimulus, q.stimulus_type) ? (
        <Box sx={{ mb: 1.25 }}>
          <ExamQuestionStimulus
            q={toAdminStimulusExamQuestion(q)}
            border="#cbd5e1"
            variant="light"
            unboundedHeight
          />
        </Box>
      ) : null}
      {optionFigure && !hideOptionFigure && !hasAnyRealOptionText ? (
        <Box sx={{ mb: 1.25 }}>
          <ArOptionFigure figure={optionFigure} />
        </Box>
      ) : null}
    </>
  );
}

export function AdminExamOptionText({
  text,
  renderMath = false,
  optionDisplaySize = null,
}: {
  text: string;
  renderMath?: boolean;
  optionDisplaySize?: 'small' | 'medium' | 'large' | 'normal' | null;
}) {
  const cleaned = cleanLearnerFacingExamMarkup(text);
  const multiline = cleaned.includes('\n');
  const textScale = arFigureSizeMultiplier(optionDisplaySize);
  if (looksLikeExamMarkdown(cleaned) && !multiline) {
    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ExamMarkdown compact renderMath={renderMath}>
          {cleaned}
        </ExamMarkdown>
      </Box>
    );
  }
  if (multiline) {
    return (
      <Typography
        component="pre"
        sx={{
          m: 0,
          flex: 1,
          minWidth: 0,
          fontSize: `${0.92 * textScale}rem`,
          color: ip.heading,
          lineHeight: 1.35,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          whiteSpace: 'pre',
          overflowX: 'auto',
        }}
      >
        {cleaned}
      </Typography>
    );
  }
  if (renderMath) {
    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ExamMathText inline={false} sx={{ fontSize: '0.95rem', color: ip.heading, lineHeight: 1.45 }}>
          {cleaned}
        </ExamMathText>
      </Box>
    );
  }
  return (
    <Typography sx={{ fontSize: '0.95rem', color: ip.heading, lineHeight: 1.45, flex: 1 }}>
      {cleaned}
    </Typography>
  );
}

export type AdminExamQuestionView = {
  item_id: string;
  prompt?: string;
  prompt_preview?: string;
  options?: Array<{ letter?: string; text: string }>;
  stimulus?: unknown;
  stimulus_type?: string | null;
  assets?: Array<{ path?: string; alt?: string }>;
  option_figure?: { src: string; alt?: string } | null;
  display_mode?: 'figure_tiles' | 'letter_buttons' | 'text_options' | null;
  stem_display_size?: 'small' | 'medium' | 'large' | 'normal' | null;
  option_display_size?: 'small' | 'medium' | 'large' | 'normal' | null;
  option_layout?: string | null;
  option_crops?: {
    layout: 'row' | 'stack' | 'grid';
    naturalWidth: number;
    naturalHeight: number;
    slices: Array<{ xPct: number; yPct: number; wPct: number; hPct: number; kind: 'grid' | 'wide' }>;
    stemSlice: { xPct: number; yPct: number; wPct: number; hPct: number; kind: 'grid' | 'wide' } | null;
  } | null;
};

export type AdminExamOptionStatus = {
  isCorrect: boolean;
  picked?: boolean;
  caption?: string;
  pickPct?: number;
};

function AdminExamOptionRow({
  letter,
  isCorrect,
  picked,
  caption,
  pickPct,
  children,
}: {
  letter: string;
  isCorrect: boolean;
  picked?: boolean;
  caption?: string;
  pickPct?: number;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.75,
        alignItems: 'flex-start',
        px: 1,
        py: 0.45,
        // Keep room for the absolute pick/correct caption so figure crops are not covered.
        pr: caption ? '5.75rem' : 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: isCorrect ? '#86efac' : picked ? '#fca5a5' : '#e2e8f0',
        bgcolor: isCorrect ? '#f0fdf4' : picked ? '#fef2f2' : '#f8fafc',
        position: 'relative',
      }}
    >
      {typeof pickPct === 'number' ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${Math.min(100, pickPct)}%`,
              bgcolor: isCorrect ? 'rgba(22, 163, 74, 0.12)' : 'rgba(16, 64, 139, 0.08)',
            }}
          />
        </Box>
      ) : null}
      <Typography
        sx={{
          fontWeight: 800,
          color: ip.heading,
          minWidth: 18,
          fontSize: 13,
          position: 'relative',
        }}
      >
        {letter}.
      </Typography>
      {/* Shrink-wrap the figure; flex:1 made option rows stretch and left huge gaps. */}
      <Box sx={{ minWidth: 0, maxWidth: '100%', position: 'relative' }}>{children}</Box>
      {caption ? (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 12,
            color: isCorrect ? '#166534' : picked ? '#991b1b' : '#334155',
            whiteSpace: 'nowrap',
            position: 'absolute',
            top: 6,
            right: 8,
            zIndex: 1,
          }}
        >
          {caption}
        </Typography>
      ) : null}
    </Box>
  );
}

/** Stem + options as the exam / item bank show them (figure slices or text). */
export function AdminExamQuestionBody({
  q,
  emptyLabel,
  optionStatus,
  renderMath = false,
}: {
  q: AdminExamQuestionView;
  emptyLabel: string;
  optionStatus?: (optIdx: number) => AdminExamOptionStatus;
  renderMath?: boolean;
}) {
  const optionRows = Array.isArray(q.options) ? q.options : [];
  const resolved = resolveLearnerExamOptions({
    markdown: q.prompt || q.prompt_preview || '',
    stimulus: q.stimulus,
    stimulusType: q.stimulus_type,
    bankOptions: optionRows.map((o) => o.text),
    assets: q.assets,
    optionFigure: q.option_figure,
    displayMode: q.display_mode,
  });
  const optionFigure = resolved.optionFigure;
  const optionCount = optionRows.length || resolved.optionTexts.length || 4;
  const { layout, slices, stemSlice, includesStemContent, naturalWidth, naturalHeight } =
    useArOptionFigureMeta(optionFigure?.src, optionCount, q.option_crops, true);
  const showFigureSlices = q.display_mode === 'figure_tiles' && Boolean(optionFigure);
  const optionDisplaySize = q.option_display_size ?? null;
  const stemDisplaySize = q.stem_display_size ?? null;
  // Combined stem+options SVGs: after stripping the option figure from markdown,
  // the stem can be empty even in text_options mode. Show the authored stem crop.
  const stemHasFigureMarkup = /!\[[^\]]*]\(|<img\b/i.test(resolved.stemMarkdown);
  const showStemCrop =
    Boolean(optionFigure && stemSlice) && (showFigureSlices || !stemHasFigureMarkup);
  const rows =
    optionRows.length > 0
      ? optionRows
      : resolved.optionTexts.map((text, i) => ({
          letter: String.fromCharCode(65 + i),
          text,
        }));
  const textOptionsAsGrid2x2 =
    isArTextOptionGrid2x2(q.option_layout) ||
    looksLikeArAsciiGridOptionTexts(
      rows.map((r, i) => resolved.optionTexts[i] || r.text || '')
    );
  return (
    <>
      <AdminExamQuestionStem
        q={q}
        emptyLabel={emptyLabel}
        hideOptionFigure={showFigureSlices}
        hideEmbeddedChoices
        renderMath={renderMath}
      />
      {showStemCrop && includesStemContent && optionFigure && stemSlice ? (
        <Box sx={{ mb: 1.25 }}>
          <ArOptionFigureSlice
            figure={optionFigure}
            index={0}
            optionCount={optionCount}
            layout={layout}
            slice={stemSlice}
            naturalWidth={naturalWidth}
            naturalHeight={naturalHeight}
            fit="stem"
            optionDisplaySize={optionDisplaySize}
            stemDisplaySize={stemDisplaySize}
          />
        </Box>
      ) : null}
      {rows.length > 0 ? (
        <Box
          sx={
            showFigureSlices || textOptionsAsGrid2x2
              ? {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  alignItems: 'start',
                  gap: 0.75,
                }
              : { display: 'flex', flexDirection: 'column', gap: 0.4 }
          }
        >
          {rows.map((opt, optIdx) => {
            const optionText = resolved.optionTexts[optIdx] || opt.text || '';
            const letter = opt.letter || String.fromCharCode(65 + optIdx);
            const status = optionStatus?.(optIdx) ?? { isCorrect: false };
            return (
              <AdminExamOptionRow
                key={`${q.item_id}-${letter}`}
                letter={letter}
                isCorrect={status.isCorrect}
                picked={status.picked}
                caption={status.caption}
                pickPct={status.pickPct}
              >
                {showFigureSlices && optionFigure ? (
                  <ArOptionFigureSlice
                    figure={optionFigure}
                    index={optIdx}
                    optionCount={optionCount}
                    layout={layout}
                    slice={slices?.[optIdx]}
                    naturalWidth={naturalWidth}
                    naturalHeight={naturalHeight}
                    fit={includesStemContent ? 'crop' : 'option'}
                    optionDisplaySize={optionDisplaySize}
                    stemDisplaySize={stemDisplaySize}
                  />
                ) : optionText ? (
                  <AdminExamOptionText
                    text={optionText}
                    renderMath={renderMath}
                    optionDisplaySize={optionDisplaySize}
                  />
                ) : null}
              </AdminExamOptionRow>
            );
          })}
        </Box>
      ) : (
        <Typography sx={{ color: '#64748b', fontSize: 13 }}>
          (No option text on this item - often image-only.)
        </Typography>
      )}
    </>
  );
}

export function PlatformAdminQuestionPerformanceCard({
  question,
  index,
  renderMath = false,
  examId = null,
  level = null,
  canApprove = false,
  onApproved,
  onItemUpdated,
}: {
  question: OfficialQuestionStatRow;
  index: number;
  renderMath?: boolean;
  examId?: string | null;
  level?: number | null;
  /** Official Analytical Reasoning item bank only. */
  canApprove?: boolean;
  onApproved?: (itemId: string, deliveryAuthorized: boolean) => void;
  onItemUpdated?: (itemId: string, next: OfficialQuestionStatRow) => void;
}) {
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [localAuthorized, setLocalAuthorized] = useState<boolean | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [optionTexts, setOptionTexts] = useState<string[]>(['', '', '', '']);
  const [correctLetter, setCorrectLetter] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [band, setBand] = useState('');
  const [instructionFamily, setInstructionFamily] = useState('');
  const [strand, setStrand] = useState('');
  const [representationMode, setRepresentationMode] = useState('');
  const [stemDisplaySize, setStemDisplaySize] = useState<ArFigureDisplaySize>('medium');
  const [optionDisplaySize, setOptionDisplaySize] = useState<ArFigureDisplaySize>('medium');

  useEffect(() => {
    setLocalAuthorized(null);
  }, [question.item_id, question.delivery_authorized]);

  const authorized =
    localAuthorized != null ? localAuthorized : question.delivery_authorized === true;
  const canEdit = Boolean(canApprove && examId && level && question.item_id);
  const taxonomy = [question.strand, question.instruction_family, question.band]
    .filter(Boolean)
    .join(' · ');

  const openEdit = () => {
    if (!canEdit) return;
    if (authorized) {
      setEditError('Unapprove this item before editing. Approved bank items are locked.');
      setEditOpen(true);
      return;
    }
    setEditError(null);
    setBodyMarkdown(question.prompt || '');
    const texts = OPTION_LETTERS.map((_, i) => question.options[i]?.text || '');
    setOptionTexts(texts);
    const correctIdx =
      typeof question.correct_index === 'number' && question.correct_index >= 0
        ? question.correct_index
        : 0;
    setCorrectLetter(OPTION_LETTERS[Math.min(correctIdx, 3)] || 'A');
    setBand(question.band || '');
    setInstructionFamily(question.instruction_family || '');
    setStrand(question.strand || '');
    setRepresentationMode('');
    setStemDisplaySize(normalizeArFigureDisplaySize(question.stem_display_size));
    setOptionDisplaySize(normalizeArFigureDisplaySize(question.option_display_size));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!canEdit || !examId || !level || authorized || saving) return;
    setSaving(true);
    setEditError(null);
    try {
      const patch: Parameters<typeof updatePlatformAdminOfficialExamBankItem>[0]['patch'] = {
        body_markdown: bodyMarkdown,
        option_texts: optionTexts,
        correct_option_id: correctLetter,
        stem_display_size: stemDisplaySize,
        option_display_size: optionDisplaySize,
      };
      if (band) patch.band = band;
      if (instructionFamily) patch.instruction_family_id = instructionFamily;
      if (strand) patch.primary_strand_id = strand;
      if (representationMode) patch.representation_mode = representationMode;
      const result = await updatePlatformAdminOfficialExamBankItem({
        examId,
        level,
        itemId: question.item_id,
        patch,
      });
      onItemUpdated?.(question.item_id, result.question);
      setEditOpen(false);
    } catch (e) {
      setEditError(apiErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalToggle = async () => {
    if (!canApprove || !examId || !level || !question.item_id || approving) return;
    setApproving(true);
    setApproveError(null);
    try {
      if (authorized) {
        await unapprovePlatformAdminOfficialExamBankItem({
          examId,
          level,
          itemId: question.item_id,
        });
        setLocalAuthorized(false);
        onApproved?.(question.item_id, false);
      } else {
        await approvePlatformAdminOfficialExamBankItem({
          examId,
          level,
          itemId: question.item_id,
        });
        setLocalAuthorized(true);
        onApproved?.(question.item_id, true);
      }
    } catch (e) {
      setApproveError(apiErrorMessage(e, authorized ? 'Unapprove failed' : 'Approve failed'));
    } finally {
      setApproving(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: 15 }}>
          Q{index + 1}
        </Typography>
        {canApprove ? (
          <PlatformAdminChip
            label={authorized ? 'Approved · servable' : 'Not approved'}
            tone={authorized ? 'success' : 'warning'}
          />
        ) : null}
        <PlatformAdminChip
          label={question.times_seen > 0 ? `${question.times_seen} saw` : 'unserved'}
          tone="neutral"
        />
        <PlatformAdminAccuracyChip pct={question.accuracy_pct} />
        <PlatformAdminChip
          label={question.avg_time_sec != null ? `${question.avg_time_sec}s avg` : '- time'}
          tone="info"
        />
        {canApprove ? (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              disabled={!canEdit}
              onClick={openEdit}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: ip.navy,
                color: ip.navy,
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={approving}
              onClick={() => void handleApprovalToggle()}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: authorized ? '#b91c1c' : ip.navy,
                '&:hover': { bgcolor: authorized ? '#991b1b' : ip.navy },
              }}
            >
              {approving ? (
                <CircularProgress size={16} sx={{ color: '#fff' }} />
              ) : authorized ? (
                'Unapprove'
              ) : (
                'Approve'
              )}
            </Button>
          </Box>
        ) : null}
      </Box>
      {approveError ? (
        <Typography sx={{ color: '#b91c1c', fontSize: 12, mb: 0.75 }}>{approveError}</Typography>
      ) : null}
      <Typography sx={{ color: '#475569', fontSize: 12, mb: 0.75 }}>
        {question.item_id}
        {question.version ? ` · ${question.version}` : ''}
        {taxonomy ? ` · ${taxonomy}` : ''}
      </Typography>
      <AdminExamQuestionBody
        q={question}
        emptyLabel="(no prompt)"
        renderMath={renderMath}
        optionStatus={(optIdx) => {
          const opt = question.options[optIdx];
          const pickPct = opt?.pick_pct ?? 0;
          const pickCount = opt?.pick_count ?? 0;
          return {
            isCorrect: Boolean(opt?.is_correct),
            pickPct,
            caption: `${pickPct}%${pickCount > 0 ? ` · ${pickCount}` : ''}${
              opt?.is_correct ? ' · correct' : ''
            }`,
          };
        }}
      />

      <Dialog
        open={editOpen}
        onClose={() => (saving ? null : setEditOpen(false))}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            ...platformAdminDialogPaperSx,
            maxWidth: 760,
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading, px: 3, pt: 2.5, pb: 1, flexShrink: 0 }}>
          Edit item · {question.item_id}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            px: 3,
            py: 2.5,
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {authorized ? (
            <Typography sx={{ color: '#92400e', fontSize: 14, mb: 1.5 }}>
              Unapprove this item before editing. Approved bank items stay locked so live
              content cannot be rewritten silently.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography sx={platformAdminDialogFieldLabelSx} component="label">
                    Stem figure size
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={stemDisplaySize}
                    onChange={(_e, next) => {
                      if (next) setStemDisplaySize(next as ArFigureDisplaySize);
                    }}
                    sx={platformAdminFilterGroupSx}
                  >
                    {AR_FIGURE_DISPLAY_SIZES.map((size) => (
                      <ToggleButton key={size} value={size}>
                        {AR_EDIT_SIZE_LABELS[size]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
                <Box>
                  <Typography sx={platformAdminDialogFieldLabelSx} component="label">
                    Option figure size
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={optionDisplaySize}
                    onChange={(_e, next) => {
                      if (next) setOptionDisplaySize(next as ArFigureDisplaySize);
                    }}
                    sx={platformAdminFilterGroupSx}
                  >
                    {AR_FIGURE_DISPLAY_SIZES.map((size) => (
                      <ToggleButton key={size} value={size}>
                        {AR_EDIT_SIZE_LABELS[size]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              </Box>
              <Typography sx={{ color: '#64748b', fontSize: 12, mt: -0.5 }}>
                Controls figure scale in the learner exam (Small 0.75× · Medium 1× · Large
                1.75×).
              </Typography>
              <TextField
                label="Prompt / body markdown"
                value={bodyMarkdown}
                onChange={(e) => setBodyMarkdown(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                sx={platformAdminDialogTextFieldSx}
              />
              {OPTION_LETTERS.map((letter, i) => (
                <TextField
                  key={letter}
                  label={`Option ${letter}`}
                  value={optionTexts[i] || ''}
                  onChange={(e) => {
                    const next = [...optionTexts];
                    next[i] = e.target.value;
                    setOptionTexts(next);
                  }}
                  fullWidth
                  sx={platformAdminDialogTextFieldSx}
                />
              ))}
              <Box>
                <Typography
                  sx={platformAdminDialogFieldLabelSx}
                  component="label"
                  htmlFor={`correct-${question.item_id}`}
                >
                  Correct answer
                </Typography>
                <Select
                  id={`correct-${question.item_id}`}
                  fullWidth
                  size="small"
                  value={correctLetter}
                  onChange={(e) =>
                    setCorrectLetter(e.target.value as 'A' | 'B' | 'C' | 'D')
                  }
                  MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                  sx={platformAdminDialogSelectSx}
                >
                  {OPTION_LETTERS.map((letter) => (
                    <MenuItem key={letter} value={letter}>
                      {letter}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography
                    sx={platformAdminDialogFieldLabelSx}
                    component="label"
                    htmlFor={`band-${question.item_id}`}
                  >
                    Band
                  </Typography>
                  <Select
                    id={`band-${question.item_id}`}
                    fullWidth
                    size="small"
                    value={band}
                    displayEmpty
                    onChange={(e) => setBand(e.target.value)}
                    MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                    sx={platformAdminDialogSelectSx}
                  >
                    <MenuItem value="">
                      <em>Unset</em>
                    </MenuItem>
                    {AR_EDIT_BANDS.map((b) => (
                      <MenuItem key={b} value={b}>
                        {b}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Typography
                    sx={platformAdminDialogFieldLabelSx}
                    component="label"
                    htmlFor={`if-${question.item_id}`}
                  >
                    Instruction family
                  </Typography>
                  <Select
                    id={`if-${question.item_id}`}
                    fullWidth
                    size="small"
                    value={instructionFamily}
                    displayEmpty
                    onChange={(e) => setInstructionFamily(e.target.value)}
                    MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                    sx={platformAdminDialogSelectSx}
                  >
                    <MenuItem value="">
                      <em>Unset</em>
                    </MenuItem>
                    {AR_EDIT_IFS.map((id) => (
                      <MenuItem key={id} value={id}>
                        {id}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Typography
                    sx={platformAdminDialogFieldLabelSx}
                    component="label"
                    htmlFor={`strand-${question.item_id}`}
                  >
                    Strand
                  </Typography>
                  <Select
                    id={`strand-${question.item_id}`}
                    fullWidth
                    size="small"
                    value={strand}
                    displayEmpty
                    onChange={(e) => setStrand(e.target.value)}
                    MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                    sx={platformAdminDialogSelectSx}
                  >
                    <MenuItem value="">
                      <em>Unset</em>
                    </MenuItem>
                    {AR_EDIT_STRANDS.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.id} · {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Typography
                    sx={platformAdminDialogFieldLabelSx}
                    component="label"
                    htmlFor={`mode-${question.item_id}`}
                  >
                    Representation
                  </Typography>
                  <Select
                    id={`mode-${question.item_id}`}
                    fullWidth
                    size="small"
                    value={representationMode}
                    displayEmpty
                    onChange={(e) => setRepresentationMode(e.target.value)}
                    MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                    sx={platformAdminDialogSelectSx}
                  >
                    <MenuItem value="">
                      <em>Leave unchanged</em>
                    </MenuItem>
                    {AR_EDIT_MODES.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>
              <Typography sx={{ color: '#64748b', fontSize: 12 }}>
                Saves directly to the official item bank. Assets / SVG paths are not edited
                here.
              </Typography>
            </Box>
          )}
          {editError ? (
            <Typography sx={{ color: '#b91c1c', fontSize: 13, mt: 1.5 }}>{editError}</Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0 }}>
          <Button
            onClick={() => setEditOpen(false)}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          {!authorized ? (
            <Button
              variant="contained"
              disabled={saving}
              onClick={() => void handleSaveEdit()}
              sx={{ textTransform: 'none', fontWeight: 700, bgcolor: ip.navy }}
            >
              {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Save to database'}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function PlatformAdminAttemptPaper({
  questions,
  attemptId,
  examId,
}: {
  questions: OfficialAttemptQuestionRow[];
  attemptId: string;
  examId: string | null;
}) {
  const renderMath = examId === 'mathematical_reasoning';
  const paper = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {questions.map((q) => (
        <PlatformAdminAttemptQuestionCard
          key={`${attemptId}-${q.index}-${q.item_id}`}
          question={q}
          renderMath={renderMath}
        />
      ))}
    </Box>
  );
  if (renderMath) {
    return (
      <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
        {paper}
      </MathJaxContext>
    );
  }
  return paper;
}

export function PlatformAdminAttemptQuestionCard({
  question,
  renderMath = false,
}: {
  question: OfficialAttemptQuestionRow;
  renderMath?: boolean;
}) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        p: 1.75,
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontWeight: 800, color: ip.heading }}>Q{question.index}</Typography>
        <PlatformAdminChip
          label={
            question.is_correct == null ? 'ungraded' : question.is_correct ? 'correct' : 'incorrect'
          }
          tone={question.is_correct == null ? 'neutral' : question.is_correct ? 'success' : 'error'}
        />
        {question.time_spent_sec != null ? (
          <PlatformAdminChip label={`${question.time_spent_sec}s`} tone="info" />
        ) : null}
        {question.strand_label || question.strand ? (
          <PlatformAdminChip label={question.strand_label || question.strand || ''} tone="info" />
        ) : null}
        {question.instruction_family ? (
          <PlatformAdminChip
            label={
              question.instruction_family_label
                ? `${question.instruction_family} · ${question.instruction_family_label}`
                : question.instruction_family
            }
            tone="neutral"
          />
        ) : null}
        {question.band ? <PlatformAdminChip label={question.band} tone="warning" /> : null}
      </Box>
      <Typography sx={{ color: '#475569', fontSize: 12, mb: 0.5 }}>{question.item_id}</Typography>
      <AdminExamQuestionBody
        q={question}
        emptyLabel="(no prompt - bank item missing)"
        renderMath={renderMath}
        optionStatus={(optIdx) => {
          const picked = question.selected_index === optIdx;
          const isCorrect = question.correct_index === optIdx;
          return {
            isCorrect,
            picked,
            caption:
              isCorrect && picked
                ? 'correct · picked'
                : isCorrect
                  ? 'correct'
                  : picked
                    ? 'picked'
                    : '',
          };
        }}
      />
      {question.options.length === 0 ? (
        <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mt: 0.75 }}>
          Picked {question.selected_letter} · key {question.correct_letter ?? '-'}
        </Typography>
      ) : null}
    </Box>
  );
}
