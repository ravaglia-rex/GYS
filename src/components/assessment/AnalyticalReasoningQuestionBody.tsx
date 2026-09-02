import React from 'react';
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { ArOptionFigureSlice, useArOptionFigureMeta } from './ArOptionFigure';
import { optionFigurePickerGridSx } from './arOptionFigureModel';
import { ExamMarkdown, EXAM_FIGURE_MAX_HEIGHT_PX, EXAM_FIGURE_MAX_WIDTH_PX } from './ExamMarkdown';
import { scaleExamFigureCaps, isArTextOptionGrid2x2, looksLikeArAsciiGridOptionTexts, arFigureSizeMultiplier } from './arFigureDisplaySize';
import { resolveLearnerExamOptions } from './resolveLearnerExamOptions';

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
}) => {
  const primary = theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = '#e2e8f0';
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
  const textOptionsAsGrid2x2 =
    isArTextOptionGrid2x2(question.option_layout) ||
    looksLikeArAsciiGridOptionTexts(optionIds);
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
      <Box sx={{ mb: 2.5 }}>
        <ExamMarkdown
          maxFigureWidth={stemCaps.maxWidth}
          maxFigureHeight={stemCaps.maxHeight}
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
              const rowBorder = selected ? primary : borderMuted;
              const rowBg = selected ? primarySoft : '#fff';
              const letterBg = selected ? primary : '#f1f5f9';
              const letterBorder = selected ? primary : borderMuted;
              const letterFg = selected ? '#fff' : '#64748b';
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
                    borderColor: selected ? primary : borderMuted,
                    bgcolor: selected ? primarySoft : '#fff',
                    cursor: selectionLocked ? 'default' : 'pointer',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: selected ? primary : '#334155',
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
              sx={
                textOptionsAsGrid2x2
                  ? {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      alignItems: 'stretch',
                      gap: 1.25,
                      mb: footer ? 1.5 : 0,
                    }
                  : undefined
              }
            >
              {optionIds.map((label, idx) => {
                const selected = selectedOption === idx;
                const rowBorder = selected ? primary : borderMuted;
                const rowBg = selected ? primarySoft : '#fff';
                const letterBg = selected ? primary : '#f1f5f9';
                const letterBorder = selected ? primary : borderMuted;
                const letterFg = selected ? '#fff' : '#64748b';
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
                          <Typography
                            component={String(label).includes('\n') ? 'pre' : 'span'}
                            sx={{
                              m: 0,
                              color: selected ? '#0f172a' : '#475569',
                              fontSize: `${0.92 * optionTextScale}rem`,
                              fontWeight: selected ? 700 : 500,
                              lineHeight: String(label).includes('\n') ? 1.35 : 1.45,
                              fontFamily: String(label).includes('\n')
                                ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                                : 'inherit',
                              whiteSpace: String(label).includes('\n') ? 'pre' : 'normal',
                            }}
                          >
                            {label}
                          </Typography>
                        ) : null}
                      </Box>
                    }
                    sx={{
                      m: 0,
                      mb: textOptionsAsGrid2x2 ? 0 : 1.25,
                      p: '14px 16px',
                      borderRadius: 2,
                      border: `2px solid ${rowBorder}`,
                      bgcolor: rowBg,
                      cursor: selectionLocked ? 'default' : 'pointer',
                      alignItems: 'center',
                      height: textOptionsAsGrid2x2 ? '100%' : undefined,
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
