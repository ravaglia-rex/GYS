import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { ArOptionFigure, ArOptionFigureSlice, useArOptionFigureMeta } from '../../components/assessment/ArOptionFigure';
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
import { MathJaxContext } from 'better-react-mathjax';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminAccuracyChip, PlatformAdminChip } from './platformAdminComponents';

function stripOptionLetterPrefix(option: string): string {
  return String(option ?? '').replace(/^[A-D][.)]\s+/i, '').trim();
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
  return (
    <>
      <Box sx={{ mb: 1.25 }}>
        <ExamRichPrompt
          prompt={stemMarkdown}
          emptyLabel={emptyLabel}
          maxFigureWidth={EXAM_FIGURE_MAX_WIDTH_PX}
          maxFigureHeight={EXAM_FIGURE_MAX_HEIGHT_PX}
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
}: {
  text: string;
  renderMath?: boolean;
}) {
  const cleaned = cleanLearnerFacingExamMarkup(text);
  if (looksLikeExamMarkdown(cleaned)) {
    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ExamMarkdown compact renderMath={renderMath}>
          {cleaned}
        </ExamMarkdown>
      </Box>
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
        borderRadius: 1,
        border: '1px solid',
        borderColor: isCorrect ? '#86efac' : picked ? '#fca5a5' : '#e2e8f0',
        bgcolor: isCorrect ? '#f0fdf4' : picked ? '#fef2f2' : '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {typeof pickPct === 'number' ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: `${Math.min(100, pickPct)}%`,
            bgcolor: isCorrect ? 'rgba(22, 163, 74, 0.12)' : 'rgba(16, 64, 139, 0.08)',
            pointerEvents: 'none',
          }}
        />
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
      <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>{children}</Box>
      {caption ? (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 12,
            pt: 0.15,
            color: isCorrect ? '#166534' : picked ? '#991b1b' : '#334155',
            whiteSpace: 'nowrap',
            position: 'relative',
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
  });
  const optionFigure = resolved.optionFigure;
  const optionCount = optionRows.length || resolved.optionTexts.length || 4;
  const { layout, slices, stemSlice, includesStemContent, naturalWidth, naturalHeight } =
    useArOptionFigureMeta(optionFigure?.src, optionCount);
  const showFigureSlices = Boolean(resolved.pickOnFigure);
  const rows =
    optionRows.length > 0
      ? optionRows
      : resolved.optionTexts.map((text, i) => ({
          letter: String.fromCharCode(65 + i),
          text,
        }));
  return (
    <>
      <AdminExamQuestionStem
        q={q}
        emptyLabel={emptyLabel}
        hideOptionFigure={showFigureSlices}
        hideEmbeddedChoices
        renderMath={renderMath}
      />
      {showFigureSlices && includesStemContent && optionFigure && stemSlice ? (
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
          />
        </Box>
      ) : null}
      {rows.length > 0 ? (
        <Box
          sx={
            showFigureSlices
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
                  />
                ) : optionText ? (
                  <AdminExamOptionText text={optionText} renderMath={renderMath} />
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
}: {
  question: OfficialQuestionStatRow;
  index: number;
  renderMath?: boolean;
}) {
  const taxonomy = [question.strand, question.instruction_family, question.band]
    .filter(Boolean)
    .join(' · ');
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
        <PlatformAdminChip
          label={question.times_seen > 0 ? `${question.times_seen} saw` : 'unserved'}
          tone="neutral"
        />
        <PlatformAdminAccuracyChip pct={question.accuracy_pct} />
        <PlatformAdminChip
          label={question.avg_time_sec != null ? `${question.avg_time_sec}s avg` : '- time'}
          tone="info"
        />
      </Box>
      <Typography sx={{ color: '#475569', fontSize: 12, mb: 0.75 }}>
        {question.item_id}
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
