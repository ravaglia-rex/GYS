import React from 'react';
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import type { VerbalPassageGroup, VerbalPassageGroupQuestion } from '../../db/assessmentCollection';
import { ExamMarkdown } from './ExamMarkdown';
import { QuestionProblemReport, type QuestionReportFrame } from './QuestionProblemReport';
import { resolveLearnerExamOptions } from './resolveLearnerExamOptions';

export type VerbalPassageGroupView = VerbalPassageGroup;

/**
 * Official Verbal multi-item passage: shared passage once, then each question
 * with its own A–D picker (Item Bank–style, answerable).
 */
export const VerbalPassageGroupBody: React.FC<{
  group: VerbalPassageGroupView;
  selections: Record<string, number | null>;
  onSelect: (itemId: string, optionIndex: number) => void;
  theme?: 'blue' | 'purple';
  selectionLocked?: boolean;
  questionNumberStart: number;
  totalQuestions: number;
  hideQuestionTotal?: boolean;
  /** Skip selectors for queue indices already past (resume mid-group). */
  answerableFromIndex?: number;
  questionReport?: QuestionReportFrame | null;
  footer?: React.ReactNode;
}> = ({
  group,
  selections,
  onSelect,
  theme = 'blue',
  selectionLocked = false,
  questionNumberStart,
  totalQuestions,
  hideQuestionTotal = false,
  answerableFromIndex = 0,
  questionReport = null,
  footer,
}) => {
  const primary = theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = '#e2e8f0';

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="caption"
        sx={{
          color: '#64748b',
          fontWeight: 700,
          letterSpacing: 1,
          display: 'block',
          mb: 1.5,
          textTransform: 'uppercase',
          fontSize: '0.68rem',
        }}
      >
        {hideQuestionTotal
          ? `Questions ${questionNumberStart}–${questionNumberStart + group.group_size - 1}`
          : `Questions ${questionNumberStart}–${questionNumberStart + group.group_size - 1} of ${totalQuestions}`}
      </Typography>

      <Box
        sx={{
          border: `1px solid ${borderMuted}`,
          borderRadius: 2,
          p: { xs: 1.75, sm: 2.25 },
          bgcolor: '#fff',
          mb: 1,
        }}
      >
        <Box sx={{ mb: 2.5 }}>
          <ExamMarkdown>{group.passage_markdown}</ExamMarkdown>
        </Box>

        {group.questions.map((q, qi) => {
          const queueIndex =
            typeof q.queue_index === 'number' ? q.queue_index : group.group_start_index + qi;
          const alreadyPast = queueIndex < answerableFromIndex;
          const resolved = resolveLearnerExamOptions({
            markdown: q.body_markdown ?? q.prompt ?? '',
            bankOptions: q.options && q.options.length >= 2 ? q.options : q.option_ids,
            displayMode: q.display_mode ?? 'text_options',
          });
          const optionTexts =
            resolved.optionTexts.length >= 2 ? resolved.optionTexts : q.options || [];
          const selected = selections[q.id] ?? null;
          const qNum = questionNumberStart + qi;
          const locked = selectionLocked || alreadyPast;

          return (
            <Box
              key={q.id}
              sx={{
                pt: qi === 0 ? 0 : 2,
                mt: qi === 0 ? 0 : 2,
                borderTop: qi === 0 ? 'none' : `1px solid ${borderMuted}`,
                opacity: alreadyPast ? 0.55 : 1,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  fontSize: '0.8rem',
                  mb: 1,
                  letterSpacing: 0.4,
                }}
              >
                Q{qNum}
                {alreadyPast ? ' · answered' : ''}
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <ExamMarkdown>{resolved.stemMarkdown || q.body_markdown || q.prompt || ''}</ExamMarkdown>
              </Box>
              {!alreadyPast && (
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={selected !== null ? String(selected) : ''}
                    onChange={(e) => {
                      if (locked) return;
                      onSelect(q.id, parseInt(e.target.value, 10));
                    }}
                  >
                    {optionTexts.map((label, idx) => {
                      const isSelected = selected === idx;
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <FormControlLabel
                          key={`${q.id}-${letter}`}
                          value={String(idx)}
                          control={<Radio sx={{ display: 'none' }} />}
                          onClick={() => {
                            if (locked) return;
                            onSelect(q.id, idx);
                          }}
                          aria-label={`Question ${qNum} option ${letter}`}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  bgcolor: isSelected ? primary : '#f1f5f9',
                                  border: `2px solid ${isSelected ? primary : borderMuted}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: isSelected ? '#fff' : '#64748b',
                                  }}
                                >
                                  {letter}
                                </Typography>
                              </Box>
                              <Typography
                                sx={{
                                  m: 0,
                                  color: isSelected ? '#0f172a' : '#475569',
                                  fontSize: '0.92rem',
                                  fontWeight: isSelected ? 700 : 500,
                                  lineHeight: 1.45,
                                }}
                              >
                                {label}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            m: 0,
                            mb: 1.25,
                            p: '14px 16px',
                            borderRadius: 2,
                            border: `2px solid ${isSelected ? primary : borderMuted}`,
                            bgcolor: isSelected ? primarySoft : '#fff',
                            cursor: locked ? 'default' : 'pointer',
                            alignItems: 'center',
                            transition: 'all 0.15s',
                            '&:hover': locked ? {} : { borderColor: `${primary}99` },
                          }}
                        />
                      );
                    })}
                  </RadioGroup>
                </FormControl>
              )}
              {questionReport && !alreadyPast ? (
                <QuestionProblemReport frame={questionReport} itemId={q.id} accent={primary} />
              ) : null}
            </Box>
          );
        })}
      </Box>
      {footer}
    </Box>
  );
};

export function answerablePassageGroupQuestions(
  group: VerbalPassageGroupView,
  fromIndex: number
): VerbalPassageGroupQuestion[] {
  return group.questions.filter((q, qi) => {
    const queueIndex =
      typeof q.queue_index === 'number' ? q.queue_index : group.group_start_index + qi;
    return queueIndex >= fromIndex;
  });
}

export function allPassageGroupAnswered(
  group: VerbalPassageGroupView | null | undefined,
  selections: Record<string, number | null>,
  fromIndex = 0
): boolean {
  if (!group?.questions?.length) return false;
  return answerablePassageGroupQuestions(group, fromIndex).every(
    (q) => typeof selections[q.id] === 'number'
  );
}
