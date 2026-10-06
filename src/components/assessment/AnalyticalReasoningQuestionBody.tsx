import React from 'react';
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { ArOptionFigureSlice, useArOptionFigureMeta } from './ArOptionFigure';
import { optionFigurePickerGridSx } from './arOptionFigureModel';
import { ExamMarkdown, EXAM_FIGURE_MAX_HEIGHT_PX, EXAM_FIGURE_MAX_WIDTH_PX } from './ExamMarkdown';
import { ExamMathText } from './ExamMathText';
import { scaleExamFigureCaps, resolveArTextOptionLayout, arTextOptionLayoutContainerSx, arFigureSizeMultiplier } from './arFigureDisplaySize';
import { resolveLearnerExamOptions } from './resolveLearnerExamOptions';

type AnswerFeedback = { correctIndex: number; selectedIndex: number } | null;

function choiceColors(
  idx: number,
  selected: boolean,
  primary: string,
  primarySoft: string,
  borderMuted: string,
  feedback: AnswerFeedback,
  surface: 'light' | 'dark' = 'light'
) {
  const idleBg = surface === 'dark' ? 'transparent' : '#fff';
  const idleLetterBg = surface === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9';
  const idleLetterFg = surface === 'dark' ? 'rgba(255,255,255,0.7)' : '#64748b';
  const quietLabel = surface === 'dark' ? 'rgba(255,255,255,0.9)' : '#475569';
  const strongLabel = surface === 'dark' ? '#fff' : '#0f172a';
  const pack = (
    rowBorder: string,
    rowBg: string,
    letterBg: string,
    letterBorder: string,
    letterFg: string,
    labelStrong: boolean
  ) => ({
    rowBorder,
    rowBg,
    letterBg,
    letterBorder,
    letterFg,
    labelStrong,
    labelColor: labelStrong ? strongLabel : quietLabel,
  });
  if (feedback) {
    if (idx === feedback.correctIndex) {
      return pack('#059669', 'rgba(5, 150, 105, 0.16)', '#059669', '#059669', '#fff', true);
    }
    if (idx === feedback.selectedIndex && idx !== feedback.correctIndex) {
      return pack('#dc2626', 'rgba(220, 38, 38, 0.14)', '#dc2626', '#dc2626', '#fff', true);
    }
    return pack(borderMuted, idleBg, idleLetterBg, borderMuted, idleLetterFg, false);
  }
  if (selected) {
    return pack(primary, primarySoft, primary, primary, '#fff', true);
  }
  return pack(borderMuted, idleBg, idleLetterBg, borderMuted, idleLetterFg, false);
}

interface AnalyticalReasoningQuestionBodyProps {
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  theme: 'blue' | 'purple';
  footer?: React.ReactNode;
  selectionLocked?: boolean;
  /** When true (adaptive exams), omit "of N" because length can change mid-attempt. */
  hideQuestionTotal?: boolean;
  /** Question of the Day already names the item; skip the "Question N" line. */
  hideQuestionCaption?: boolean;
  /** Requires MathJaxContext ancestor (Mathematical Reasoning). */
  renderMath?: boolean;
  answerFeedback?: AnswerFeedback;
  surface?: 'light' | 'dark';
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const AnalyticalReasoningQuestionBody: React.FC<AnalyticalReasoningQuestionBodyProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  theme,
  footer,
  selectionLocked = false,
  hideQuestionTotal = false,
  hideQuestionCaption = false,
  renderMath = false,
  answerFeedback = null,
  surface = 'light',
}) => {
  const primary = surface === 'dark' ? '#a855f7' : theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = surface === 'dark'
    ? 'rgba(168, 85, 247, 0.16)'
    : theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = surface === 'dark' ? 'rgba(255,255,255,0.18)' : '#e2e8f0';
  const markdown = question.body_markdown ?? question.prompt ?? '';
  const resolved = resolveLearnerExamOptions({
    markdown,
    stimulus: question.stimulus,
    stimulusType: question.stimulus_type,
    bankOptions:
      question.options && question.options.length >= 2
        ? question.options
        : question.option_ids,
    assets: question.assets,
    optionFigure: question.option_figure,
    displayMode: question.display_mode,
  });
  const optionIds =
    resolved.optionTexts.length >= 2 ? resolved.optionTexts : [...OPTION_LETTERS];
  const optionFigure = resolved.optionFigure;
  const stemMarkdown = resolved.stemMarkdown;
  // Bank display_mode only — no heuristic fallback when mode is missing.
  const mode = resolved.displayMode;
  const showFigureOptions = mode === 'figure_tiles' ? Boolean(optionFigure) : false;
  const showLetterButtons =
    mode === 'letter_buttons' ? !resolved.hasRealOptionText : false;
  const textOptionLayout = resolveArTextOptionLayout(question.option_layout, optionIds);
  const textOptionsAsGrid = textOptionLayout === '2x2' || textOptionLayout === '4x1';
  const textOptionsGridSx = arTextOptionLayoutContainerSx(textOptionLayout, {
    gap: 1.25,
    mb: footer ? 1.5 : 0,
  });
  const { layout, slices, stemSlice, includesStemContent, naturalWidth, naturalHeight } =
    useArOptionFigureMeta(optionFigure?.src, optionIds.length, question.option_crops);
  const optionDisplaySize = question.option_display_size ?? null;
  const stemDisplaySize = question.stem_display_size ?? null;
  const stemCaps = scaleExamFigureCaps(
    EXAM_FIGURE_MAX_WIDTH_PX,
    EXAM_FIGURE_MAX_HEIGHT_PX,
    stemDisplaySize
  );
  const optionTextScale = arFigureSizeMultiplier(optionDisplaySize);
  const stemHasFigureMarkup = /!\[[^\]]*]\(|<img\b/i.test(stemMarkdown);
  const showStemCrop =
    Boolean(optionFigure && stemSlice) && (showFigureOptions || !stemHasFigureMarkup);

  return (
    <Box sx={{ width: '100%' }}>
      {!hideQuestionCaption && (
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
          {hideQuestionTotal ? `Question ${questionNumber}` : `Question ${questionNumber} of ${totalQuestions}`}
        </Typography>
      )}
      <Box sx={{ mb: 2.5 }}>
        <ExamMarkdown
          maxFigureWidth={stemCaps.maxWidth}
          maxFigureHeight={stemCaps.maxHeight}
          renderMath={renderMath}
          tone={surface === 'dark' ? 'dark' : 'light'}
        >
          {stemMarkdown}
        </ExamMarkdown>
        {showStemCrop && includesStemContent && optionFigure && stemSlice ? (
          <Box sx={{ mt: 1.5, maxWidth: '100%', minWidth: 0 }}>
            <ArOptionFigureSlice
              figure={optionFigure}
              index={0}
              optionCount={optionIds.length}
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
      </Box>
      {optionFigure && showFigureOptions ? (
        <>
          <Box
            sx={{
              ...optionFigurePickerGridSx(layout),
              gap: 1.25,
              mb: footer ? 1.5 : 0,
            }}
          >
            {optionIds.map((_, idx) => {
              const selected = selectedOption === idx;
              const colors = choiceColors(idx, selected, primary, primarySoft, borderMuted, answerFeedback, surface);
              const { rowBorder, rowBg, letterBg, letterBorder, letterFg } = colors;
              const letter = String.fromCharCode(65 + idx);

              return (
                <Box
                  key={`figure-opt-${letter}`}
                  component="button"
                  type="button"
                  aria-label={`Option ${letter}`}
                  aria-pressed={selected}
                  disabled={selectionLocked}
                  onClick={() => {
                    if (selectionLocked) return;
                    onSelectOption(idx);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: '14px 16px',
                    borderRadius: 2,
                    border: `2px solid ${rowBorder}`,
                    bgcolor: rowBg,
                    cursor: selectionLocked ? 'default' : 'pointer',
                    minWidth: 0,
                    transition: 'all 0.15s',
                    '&:hover': selectionLocked ? {} : { borderColor: `${primary}99` },
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: letterBg,
                      border: `2px solid ${letterBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: letterFg }}>
                      {letter}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
                    <ArOptionFigureSlice
                      figure={optionFigure}
                      index={idx}
                      optionCount={optionIds.length}
                      layout={layout}
                      slice={slices?.[idx]}
                      naturalWidth={naturalWidth}
                      naturalHeight={naturalHeight}
                      fit={includesStemContent ? 'crop' : 'option'}
                      optionDisplaySize={optionDisplaySize}
                      stemDisplaySize={stemDisplaySize}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
          {footer}
        </>
      ) : showLetterButtons ? (
        <>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: footer ? 1.5 : 0 }}>
            {optionIds.map((label, idx) => {
              const selected = selectedOption === idx;
              const colors = choiceColors(idx, selected, primary, primarySoft, borderMuted, answerFeedback, surface);
              const letter = String.fromCharCode(65 + idx);
              return (
                <Box
                  key={`${label}-${idx}`}
                  component="button"
                  type="button"
                  aria-label={`Option ${letter}`}
                  aria-pressed={selected}
                  disabled={selectionLocked}
                  onClick={() => {
                    if (selectionLocked) return;
                    onSelectOption(idx);
                  }}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: colors.rowBorder,
                    bgcolor: colors.rowBg,
                    cursor: selectionLocked ? 'default' : 'pointer',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: colors.labelColor,
                  }}
                >
                  {letter}
                </Box>
              );
            })}
          </Box>
          {footer}
        </>
      ) : (
        <>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedOption !== null ? String(selectedOption) : ''}
              onChange={(e) => {
                if (selectionLocked) return;
                onSelectOption(parseInt(e.target.value, 10));
              }}
              sx={textOptionsGridSx}
            >
              {optionIds.map((label, idx) => {
                const selected = selectedOption === idx;
                const colors = choiceColors(idx, selected, primary, primarySoft, borderMuted, answerFeedback, surface);
                const { rowBorder, rowBg, letterBg, letterBorder, letterFg, labelStrong, labelColor } = colors;
                const letter = String.fromCharCode(65 + idx);
                const showText = !isSameAsLetter(label, letter);
                return (
                  <FormControlLabel
                    key={`${label}-${idx}`}
                    value={String(idx)}
                    control={<Radio sx={{ display: 'none' }} />}
                    onClick={() => {
                      if (selectionLocked) return;
                      onSelectOption(idx);
                    }}
                    aria-label={`Option ${letter}`}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: letterBg,
                            border: `2px solid ${letterBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: letterFg }}>
                            {letter}
                          </Typography>
                        </Box>
                        {showText ? (
                          renderMath ? (
                            <ExamMathText
                              inline
                              sx={{
                                color: labelColor,
                                fontSize: `${0.92 * optionTextScale}rem`,
                                fontWeight: labelStrong ? 700 : 500,
                                lineHeight: String(label).includes('\n') ? 1.35 : 1.45,
                                whiteSpace: String(label).includes('\n') ? 'pre' : 'normal',
                              }}
                            >
                              {label}
                            </ExamMathText>
                          ) : (
                            <Typography
                              component={String(label).includes('\n') ? 'pre' : 'span'}
                              sx={{
                                m: 0,
                                color: labelColor,
                                fontSize: `${0.92 * optionTextScale}rem`,
                                fontWeight: labelStrong ? 700 : 500,
                                lineHeight: String(label).includes('\n') ? 1.35 : 1.45,
                                fontFamily: String(label).includes('\n')
                                  ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                                  : 'inherit',
                                whiteSpace: String(label).includes('\n') ? 'pre' : 'normal',
                              }}
                            >
                              {label}
                            </Typography>
                          )
                        ) : null}
                      </Box>
                    }
                    sx={{
                      m: 0,
                      mb: textOptionsAsGrid ? 0 : 1.25,
                      p: '14px 16px',
                      borderRadius: 2,
                      border: `2px solid ${rowBorder}`,
                      bgcolor: rowBg,
                      cursor: selectionLocked ? 'default' : 'pointer',
                      alignItems: 'center',
                      height: textOptionsAsGrid ? '100%' : undefined,
                      transition: 'all 0.15s',
                      '&:hover': selectionLocked ? {} : { borderColor: `${primary}99` },
                    }}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
          {footer}
        </>
      )}
    </Box>
  );
};

function isSameAsLetter(label: string, letter: string): boolean {
  return String(label ?? '').trim().replace(/\.$/, '').toUpperCase() === letter;
}
