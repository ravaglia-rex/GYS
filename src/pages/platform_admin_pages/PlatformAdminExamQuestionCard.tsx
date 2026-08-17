import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { ArOptionFigure, ArOptionFigureSlice, useArOptionFigureMeta } from '../../components/assessment/ArOptionFigure';
import { resolveLearnerExamOptions } from '../../components/assessment/resolveLearnerExamOptions';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionStimulus';
import { cleanLearnerFacingExamMarkup } from '../../components/assessment/cleanLearnerFacingExamMarkup';
import {
  ExamMarkdown,
  ExamRichPrompt,
  EXAM_FIGURE_MAX_HEIGHT_PX,
  EXAM_FIGURE_MAX_WIDTH_PX,
  looksLikeExamMarkdown,
  shouldRenderStructuredStimulus,
} from '../../components/assessment/ExamMarkdown';
import type { ExamQuestion } from '../../db/assessmentCollection';
import type { OfficialQuestionStatRow } from '../../db/platformAdminAnalytics';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminAccuracyChip, PlatformAdminChip } from './platformAdminComponents';

export function toAdminStimulusExamQuestion(q: {
  item_id: string;
  prompt?: string;
  prompt_preview?: string;
  options?: Array<{ text: string }>;
  stimulus?: unknown;
  stimulus_type?: string | null;
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
}: {
  q: {
    item_id: string;
    prompt?: string;
    prompt_preview?: string;
    options?: Array<{ text: string }>;
    stimulus?: unknown;
    stimulus_type?: string | null;
  };
  emptyLabel: string;
  hideOptionFigure?: boolean;
  hideEmbeddedChoices?: boolean;
}) {
  const resolved = resolveLearnerExamOptions({
    markdown: q.prompt || q.prompt_preview || '',
    stimulus: q.stimulus,
    stimulusType: q.stimulus_type,
    bankOptions: (q.options || []).map((o) => o.text),
  });
  const stemMarkdown = resolved.stemMarkdown;
  const optionFigure = resolved.optionFigure;
  return (
    <>
      <Box sx={{ mb: 1.25 }}>
        <ExamRichPrompt
          prompt={stemMarkdown}
          emptyLabel={emptyLabel}
          maxFigureWidth={EXAM_FIGURE_MAX_WIDTH_PX}
          maxFigureHeight={EXAM_FIGURE_MAX_HEIGHT_PX}
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
      {optionFigure && !hideOptionFigure ? (
        <Box sx={{ mb: 1.25 }}>
          <ArOptionFigure figure={optionFigure} />
        </Box>
      ) : null}
    </>
  );
}

export function AdminExamOptionText({ text }: { text: string }) {
  const cleaned = cleanLearnerFacingExamMarkup(text);
  if (looksLikeExamMarkdown(cleaned)) {
    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ExamMarkdown compact>{cleaned}</ExamMarkdown>
      </Box>
    );
  }
  return (
    <Typography sx={{ fontSize: '0.95rem', color: ip.heading, lineHeight: 1.45, flex: 1 }}>
      {cleaned}
    </Typography>
  );
}

function AdminExamOptionRow({
  letter,
  isCorrect,
  pickPct,
  pickCount,
  children,
}: {
  letter: string;
  isCorrect: boolean;
  pickPct: number;
  pickCount: number;
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
        borderColor: isCorrect ? '#86efac' : '#e2e8f0',
        bgcolor: isCorrect ? '#f0fdf4' : '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          width: `${Math.min(100, pickPct)}%`,
          bgcolor: isCorrect ? 'rgba(22, 163, 74, 0.12)' : 'rgba(16, 64, 139, 0.08)',
          pointerEvents: 'none',
        }}
      />
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
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 12,
          pt: 0.15,
          color: isCorrect ? '#166534' : '#334155',
          whiteSpace: 'nowrap',
          position: 'relative',
        }}
      >
        {pickPct}%
        {pickCount > 0 ? ` · ${pickCount}` : ''}
        {isCorrect ? ' · correct' : ''}
      </Typography>
    </Box>
  );
}

export function PlatformAdminQuestionPerformanceCard({
  question,
  index,
}: {
  question: OfficialQuestionStatRow;
  index: number;
}) {
  const taxonomy = [question.strand, question.instruction_family, question.band]
    .filter(Boolean)
    .join(' · ');
  const rawPrompt = question.prompt || question.prompt_preview || '';
  const resolved = resolveLearnerExamOptions({
    markdown: rawPrompt,
    stimulus: question.stimulus,
    stimulusType: question.stimulus_type,
    bankOptions: question.options.map((o) => o.text),
  });
  const optionFigure = resolved.optionFigure;
  const { layout, slices, stemSlice, includesStemContent, naturalWidth, naturalHeight } =
    useArOptionFigureMeta(
      optionFigure?.src,
      question.options.length || resolved.optionTexts.length || 4
    );
  const showFigureSlices = Boolean(resolved.pickOnFigure);
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
      <AdminExamQuestionStem
        q={question}
        emptyLabel="(no prompt)"
        hideOptionFigure={showFigureSlices}
        hideEmbeddedChoices
      />
      {showFigureSlices && includesStemContent && optionFigure && stemSlice ? (
        <Box sx={{ mb: 1.25 }}>
          <ArOptionFigureSlice
            figure={optionFigure}
            index={0}
            optionCount={question.options.length}
            layout={layout}
            slice={stemSlice}
            naturalWidth={naturalWidth}
            naturalHeight={naturalHeight}
            fit="exam"
          />
        </Box>
      ) : null}
      {question.options.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
          {question.options.map((opt, optIdx) => {
            const optionText = resolved.optionTexts[optIdx] || '';
            return (
            <AdminExamOptionRow
              key={`${question.item_id}-${opt.letter}`}
              letter={opt.letter}
              isCorrect={opt.is_correct}
              pickPct={opt.pick_pct}
              pickCount={opt.pick_count}
            >
              {showFigureSlices && optionFigure ? (
                <ArOptionFigureSlice
                  figure={optionFigure}
                  index={optIdx}
                  optionCount={question.options.length}
                  layout={layout}
                  slice={slices?.[optIdx]}
                  naturalWidth={naturalWidth}
                  naturalHeight={naturalHeight}
                  fit={includesStemContent ? 'crop' : 'option'}
                />
              ) : optionText ? (
                <AdminExamOptionText text={optionText} />
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
    </Box>
  );
}
