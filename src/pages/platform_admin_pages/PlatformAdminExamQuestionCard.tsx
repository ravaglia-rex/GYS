import { Box, Typography } from '@mui/material';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionBody';
import {
  ExamMarkdown,
  ExamRichPrompt,
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
  maxHeight,
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
  maxHeight?: number;
}) {
  return (
    <>
      <Box
        sx={{
          mb: 1.25,
          ...(maxHeight ? { maxHeight, overflow: 'auto', pr: 0.5 } : {}),
        }}
      >
        <ExamRichPrompt
          prompt={q.prompt || q.prompt_preview || ''}
          stimulus={q.stimulus}
          stimulusType={q.stimulus_type}
          emptyLabel={emptyLabel}
        />
      </Box>
      {shouldRenderStructuredStimulus(q.stimulus, q.stimulus_type) ? (
        <Box sx={{ mb: 1.25 }}>
          <ExamQuestionStimulus
            q={toAdminStimulusExamQuestion(q)}
            border="#cbd5e1"
            variant="light"
          />
        </Box>
      ) : null}
    </>
  );
}

export function AdminExamOptionText({ text }: { text: string }) {
  if (looksLikeExamMarkdown(text)) {
    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ExamMarkdown compact>{text}</ExamMarkdown>
      </Box>
    );
  }
  return (
    <Typography sx={{ fontSize: 13, color: ip.heading, flex: 1 }}>{text}</Typography>
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
      <AdminExamQuestionStem q={question} emptyLabel="(no prompt)" maxHeight={420} />
      {question.options.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {question.options.map((opt) => (
            <Box
              key={`${question.item_id}-${opt.letter}`}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
                px: 1.25,
                py: 0.85,
                borderRadius: 1,
                border: '1px solid',
                borderColor: opt.is_correct ? '#86efac' : '#e2e8f0',
                bgcolor: opt.is_correct ? '#f0fdf4' : '#f8fafc',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: `${Math.min(100, opt.pick_pct)}%`,
                  bgcolor: opt.is_correct
                    ? 'rgba(22, 163, 74, 0.12)'
                    : 'rgba(16, 64, 139, 0.08)',
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
                {opt.letter}.
              </Typography>
              <AdminExamOptionText text={opt.text || '(empty / image option)'} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: opt.is_correct ? '#166534' : '#334155',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                }}
              >
                {opt.pick_pct}%
                {opt.pick_count > 0 ? ` · ${opt.pick_count}` : ''}
                {opt.is_correct ? ' · correct' : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography sx={{ color: '#64748b', fontSize: 13 }}>
          (No option text on this item - often image-only.)
        </Typography>
      )}
    </Box>
  );
}
