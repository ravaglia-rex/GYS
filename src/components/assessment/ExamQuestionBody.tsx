import React, { useRef, useState, useCallback } from 'react';
import { Box, Typography, FormControl, FormControlLabel, RadioGroup, Radio, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { resolvePracticeItemId } from '../practice/practiceModeConfig';
import { ExamMathBlock, ExamMathText } from './ExamMathText';
import { QuestionProblemReport, type QuestionReportFrame } from './QuestionProblemReport';
import { inferQuestionInteraction } from './inferQuestionInteraction';
import { AnalyticalReasoningQuestionBody } from './AnalyticalReasoningQuestionBody';
import {
  ExamQuestionStimulus as HumanFriendlyStimulus,
  InstructionLine,
  QuestionPromptBlock,
  shouldSuppressInstructionAsDuplicateRule,
  stripEmbeddedOptionLetterPrefix,
  visualChoicesFromQuestion,
  type VisualChoiceMatrix,
} from './ExamQuestionStimulus';

export { inferQuestionInteraction } from './inferQuestionInteraction';
export { ExamQuestionStimulus } from './ExamQuestionStimulus';

const LIKERT_LEFT = 'Strongly disagree';
const LIKERT_MID = 'Neutral';
const LIKERT_RIGHT = 'Strongly agree';

interface OptionPickerProps {
  options: string[];
  selectedOption: number | null;
  onSelect: (i: number) => void;
  primaryColor: string;
  primarySoft: string;
  borderMuted: string;
  mathWrap?: boolean;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
}

function OptionPicker({
  options,
  selectedOption,
  onSelect,
  primaryColor,
  primarySoft,
  borderMuted,
  mathWrap,
  selectionLocked = false,
  answerFeedback = null,
}: OptionPickerProps) {
  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={selectedOption !== null ? String(selectedOption) : ''}
        onChange={(e) => {
          if (selectionLocked) return;
          onSelect(parseInt(e.target.value, 10));
        }}
      >
        {options.map((rawOption, idx) => {
          const option = stripEmbeddedOptionLetterPrefix(rawOption);
          const fb = answerFeedback;
          let rowBorder = selectedOption === idx ? primaryColor : borderMuted;
          let rowBg = selectedOption === idx ? primarySoft : '#fff';
          let letterBg = selectedOption === idx ? primaryColor : '#f1f5f9';
          let letterBorder = selectedOption === idx ? primaryColor : borderMuted;
          let letterFg = selectedOption === idx ? '#fff' : '#64748b';
          let labelStrong = selectedOption === idx;
          if (fb) {
            if (idx === fb.correctIndex) {
              rowBorder = '#059669';
              rowBg = 'rgba(5, 150, 105, 0.1)';
              letterBg = '#059669';
              letterBorder = '#059669';
              letterFg = '#fff';
              labelStrong = true;
            } else if (idx === fb.selectedIndex && idx !== fb.correctIndex) {
              rowBorder = '#dc2626';
              rowBg = 'rgba(220, 38, 38, 0.07)';
              letterBg = '#dc2626';
              letterBorder = '#dc2626';
              letterFg = '#fff';
              labelStrong = true;
            } else {
              rowBorder = borderMuted;
              rowBg = '#fff';
              letterBg = '#f1f5f9';
              letterBorder = borderMuted;
              letterFg = '#64748b';
              labelStrong = false;
            }
          }
          return (
            <FormControlLabel
              key={idx}
              value={String(idx)}
              control={<Radio sx={{ display: 'none' }} />}
              onClick={() => {
                if (selectionLocked) return;
                onSelect(idx);
              }}
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
                      {String.fromCharCode(65 + idx)}
                    </Typography>
                  </Box>
                  {mathWrap ? (
                    <ExamMathText
                      inline
                      sx={{
                        color: labelStrong ? '#0f172a' : '#475569',
                        fontSize: '0.92rem',
                        fontWeight: labelStrong ? 700 : 500,
                      }}
                    >
                      {option}
                    </ExamMathText>
                  ) : (
                    <Typography
                      sx={{
                        color: labelStrong ? '#0f172a' : '#475569',
                        fontSize: '0.92rem',
                        fontWeight: labelStrong ? 700 : 500,
                        lineHeight: 1.45,
                      }}
                    >
                      {option}
                    </Typography>
                  )}
                </Box>
              }
              sx={{
                m: 0,
                mb: 1.25,
                p: '14px 16px',
                borderRadius: 2,
                border: `2px solid ${rowBorder}`,
                bgcolor: rowBg,
                cursor: selectionLocked ? 'default' : 'pointer',
                alignItems: 'center',
                transition: 'all 0.15s',
                '&:hover': selectionLocked ? {} : { borderColor: `${primaryColor}99` },
              }}
            />
          );
        })}
      </RadioGroup>
    </FormControl>
  );
}

interface VisualOptionPickerProps {
  choices: VisualChoiceMatrix[];
  selectedOption: number | null;
  onSelect: (i: number) => void;
  primaryColor: string;
  primarySoft: string;
  borderMuted: string;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
}

function VisualOptionPicker({
  choices,
  selectedOption,
  onSelect,
  primaryColor,
  primarySoft,
  borderMuted,
  selectionLocked = false,
  answerFeedback = null,
}: VisualOptionPickerProps) {
  const maxChoiceColumns = Math.max(1, ...choices.flatMap((choice) => choice.map((row) => row.length)));
  const stackChoices = maxChoiceColumns > 6;

  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={selectedOption !== null ? String(selectedOption) : ''}
        onChange={(e) => {
          if (selectionLocked) return;
          onSelect(parseInt(e.target.value, 10));
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: stackChoices ? '1fr' : { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {choices.map((choice, idx) => {
            const fb = answerFeedback;
            let rowBorder = selectedOption === idx ? primaryColor : borderMuted;
            let rowBg = selectedOption === idx ? primarySoft : '#fff';
            let letterBg = selectedOption === idx ? primaryColor : '#f1f5f9';
            let letterBorder = selectedOption === idx ? primaryColor : borderMuted;
            let letterFg = selectedOption === idx ? '#fff' : '#64748b';
            if (fb) {
              if (idx === fb.correctIndex) {
                rowBorder = '#059669';
                rowBg = 'rgba(5, 150, 105, 0.1)';
                letterBg = '#059669';
                letterBorder = '#059669';
                letterFg = '#fff';
              } else if (idx === fb.selectedIndex && idx !== fb.correctIndex) {
                rowBorder = '#dc2626';
                rowBg = 'rgba(220, 38, 38, 0.07)';
                letterBg = '#dc2626';
                letterBorder = '#dc2626';
                letterFg = '#fff';
              } else {
                rowBorder = borderMuted;
                rowBg = '#fff';
                letterBg = '#f1f5f9';
                letterBorder = borderMuted;
                letterFg = '#64748b';
              }
            }
            const cols = Math.max(1, ...choice.map((row) => row.length));
            return (
              <FormControlLabel
                key={idx}
                value={String(idx)}
                control={<Radio sx={{ display: 'none' }} />}
                onClick={() => {
                  if (selectionLocked) return;
                  onSelect(idx);
                }}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', minWidth: 0 }}>
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
                        {String.fromCharCode(65 + idx)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols}, 1.45rem)`,
                        gap: 0.6,
                        justifyContent: 'start',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: '#fff',
                        border: `1px solid ${borderMuted}`,
                        maxWidth: '100%',
                        overflowX: 'auto',
                      }}
                      aria-label={`Option ${String.fromCharCode(65 + idx)} visual pattern`}
                    >
                      {choice.flatMap((row, rowIdx) => {
                        const padded = [...row];
                        while (padded.length < cols) padded.push('');
                        return padded.map((cell, colIdx) => (
                          <Typography
                            key={`${rowIdx}-${colIdx}`}
                            sx={{
                              color: cell ? '#0f172a' : 'transparent',
                              fontSize: '1.45rem',
                              fontWeight: 800,
                              lineHeight: 1,
                              textAlign: 'center',
                              minHeight: '1.45rem',
                            }}
                          >
                            {cell || ' '}
                          </Typography>
                        ));
                      })}
                    </Box>
                  </Box>
                }
                sx={{
                  m: 0,
                  p: '14px 16px',
                  width: '100%',
                  minWidth: 0,
                  borderRadius: 2,
                  border: `2px solid ${rowBorder}`,
                  bgcolor: rowBg,
                  cursor: selectionLocked ? 'default' : 'pointer',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                  '&:hover': selectionLocked ? {} : { borderColor: `${primaryColor}99` },
                  '& .MuiFormControlLabel-label': { width: '100%', minWidth: 0 },
                }}
              />
            );
          })}
        </Box>
      </RadioGroup>
    </FormControl>
  );
}

const ListeningMcqInner: React.FC<{
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  primary: string;
  primarySoft: string;
  borderMuted: string;
  renderMath?: boolean;
  footer?: React.ReactNode;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
  hideQuestionTotal?: boolean;
}> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  primary,
  primarySoft,
  borderMuted,
  renderMath,
  footer,
  selectionLocked = false,
  answerFeedback = null,
  hideQuestionTotal = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };
  return (
    <Box sx={{ width: '100%' }}>
      <audio ref={audioRef} src={question.audio_url!} onEnded={() => setPlaying(false)} />
      <Typography
        variant="caption"
        sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}
      >
        {hideQuestionTotal ? `Question ${questionNumber}` : `Question ${questionNumber} of ${totalQuestions}`}
      </Typography>
      <QuestionPromptBlock
        question={question}
        renderMath={renderMath}
        mathSx={{ mb: 2, fontWeight: 400, color: '#334155', fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6 }}
        typographySx={{ fontWeight: 400, color: '#334155', mb: 2, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6, whiteSpace: 'pre-line' }}
      />
      {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
        <InstructionLine text={question.instruction} />
      )}
      <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
      <Button
        startIcon={playing ? <StopIcon /> : <PlayArrowIcon />}
        variant="outlined"
        onClick={toggle}
        sx={{ mb: 3, borderColor: primary, color: primary, fontWeight: 700 }}
      >
        {playing ? 'Stop audio' : 'Play audio'}
      </Button>
      <OptionPicker
        options={question.options}
        selectedOption={selectedOption}
        onSelect={onSelectOption}
        primaryColor={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        mathWrap={renderMath}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
      />
      {footer}
    </Box>
  );
};

const SpokenResponseInner: React.FC<{
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  primary: string;
  primarySoft: string;
  borderMuted: string;
  renderMath?: boolean;
  footer?: React.ReactNode;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
  hideQuestionTotal?: boolean;
}> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  primary,
  primarySoft,
  borderMuted,
  renderMath,
  footer,
  selectionLocked = false,
  answerFeedback = null,
  hideQuestionTotal = false,
}) => {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const startRec = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = () => {
        const b = new Blob(chunks.current, { type: 'audio/webm' });
        setBlobUrl((u) => {
          if (u) URL.revokeObjectURL(u);
          return URL.createObjectURL(b);
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRec(mr);
      setRecording(true);
    } catch {
      // mic denied
    }
  }, []);

  const stopRec = useCallback(() => {
    if (rec && recording) {
      rec.stop();
      setRecording(false);
      setRec(null);
    }
  }, [rec, recording]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
        {hideQuestionTotal ? `Question ${questionNumber}` : `Question ${questionNumber} of ${totalQuestions}`}
      </Typography>
      <QuestionPromptBlock
        question={question}
        renderMath={renderMath}
        mathSx={{ mb: 2, fontWeight: 400, color: '#334155', fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6 }}
        typographySx={{ fontWeight: 400, color: '#334155', mb: 2, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6, whiteSpace: 'pre-line' }}
      />
      {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
        <InstructionLine text={question.instruction} />
      )}
      <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
      <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2, border: `1px solid ${borderMuted}` }}>
        <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 1.5 }}>
          Record your spoken response (practice). Select the option that best matches your response for scoring.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {!recording ? (
            <Button startIcon={<FiberManualRecordIcon />} variant="contained" color="error" size="small" onClick={startRec}>
              Record
            </Button>
          ) : (
            <Button startIcon={<StopIcon />} variant="outlined" color="error" size="small" onClick={stopRec}>
              Stop
            </Button>
          )}
          {blobUrl && <audio controls src={blobUrl} style={{ maxWidth: '100%', height: 36 }} />}
        </Box>
      </Box>
      <OptionPicker
        options={question.options}
        selectedOption={selectedOption}
        onSelect={onSelectOption}
        primaryColor={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        mathWrap={renderMath}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
      />
      {footer}
    </Box>
  );
};

interface ExamQuestionBodyProps {
  assessmentId: string;
  question: ExamQuestion | null;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  theme: 'blue' | 'purple';
  /** When true, prompt/options/passage use MathJax (requires MathJaxContext ancestor). */
  renderMath?: boolean;
  /** Enables “Report a problem” for signed-in official or practice sessions */
  questionReport?: QuestionReportFrame | null;
  /** Practice immediate feedback: lock choice after “check answer”. */
  selectionLocked?: boolean;
  /** Practice immediate feedback: highlight correct vs selected incorrect option. */
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
  /** Adaptive exams: omit "of N" because length can change mid-attempt. */
  hideQuestionTotal?: boolean;
}

const ExamQuestionBodyInner: React.FC<ExamQuestionBodyProps> = ({
  assessmentId,
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  theme,
  renderMath = false,
  questionReport = null,
  selectionLocked = false,
  answerFeedback = null,
  hideQuestionTotal = false,
}) => {
  const primary = theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = '#e2e8f0';
  const questionCaption = hideQuestionTotal
    ? `Question ${questionNumber}`
    : `Question ${questionNumber} of ${totalQuestions}`;

  if (!question) return null;

  const reportItemIdEarly = resolvePracticeItemId(question);
  const problemReportBlockEarly =
    questionReport && reportItemIdEarly ? (
      <QuestionProblemReport frame={questionReport} itemId={reportItemIdEarly} accent={primary} />
    ) : null;

  if (question.format === 'markdown' || (typeof question.body_markdown === 'string' && question.body_markdown.trim())) {
    return (
      <AnalyticalReasoningQuestionBody
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
        theme={theme}
        footer={problemReportBlockEarly}
        selectionLocked={selectionLocked}
        hideQuestionTotal={hideQuestionTotal}
      />
    );
  }

  const mode = inferQuestionInteraction(assessmentId, question);
  const opts = (question.options ?? []).map(stripEmbeddedOptionLetterPrefix);
  const visualChoices = visualChoicesFromQuestion({
    ...question,
    options: opts,
  });

  const reportItemId = resolvePracticeItemId(question);
  const problemReportBlock =
    questionReport && reportItemId ? (
      <QuestionProblemReport frame={questionReport} itemId={reportItemId} accent={primary} />
    ) : null;

  if (mode === 'likert' && opts.length >= 5) {
    const scale = [0, 1, 2, 3, 4];
    return (
      <Box sx={{ width: '100%' }}>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}
        >
          {questionCaption}
        </Typography>
        <QuestionPromptBlock
          question={question}
          renderMath={renderMath}
          mathSx={{ lineHeight: 1.6, mb: 3, fontWeight: 400, color: '#334155', fontSize: { xs: '0.95rem', sm: '1rem' } }}
          typographySx={{ fontWeight: 400, color: '#334155', lineHeight: 1.6, mb: 3, fontSize: { xs: '0.95rem', sm: '1rem' }, whiteSpace: 'pre-line' }}
        />
        {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
          <InstructionLine text={question.instruction} />
        )}
        <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.75, mb: 1, flexWrap: 'nowrap' }}>
          {scale.map((i) => (
            <Button
              key={i}
              onClick={() => onSelectOption(i)}
              variant={selectedOption === i ? 'contained' : 'outlined'}
              sx={{
                minWidth: 0,
                flex: 1,
                py: 1.25,
                fontWeight: 800,
                borderRadius: 2,
                borderColor: selectedOption === i ? primary : borderMuted,
                bgcolor: selectedOption === i ? primary : '#fff',
                color: selectedOption === i ? '#fff' : '#64748b',
                '&:hover': { borderColor: primary, bgcolor: selectedOption === i ? primary : primarySoft },
              }}
            >
              {i + 1}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.25, mb: 3 }}>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', maxWidth: '28%' }}>{LIKERT_LEFT}</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' }}>{LIKERT_MID}</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'right', maxWidth: '28%' }}>{LIKERT_RIGHT}</Typography>
        </Box>
        <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 2 }}>
          <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.55 }}>
            There are no right or wrong answers. Be honest - this helps us understand you better.
          </Typography>
        </Box>
        {problemReportBlock}
      </Box>
    );
  }

  if (mode === 'listening_mcq' && question.audio_url) {
    return (
      <ListeningMcqInner
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
        primary={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        renderMath={renderMath}
        footer={problemReportBlock}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
        hideQuestionTotal={hideQuestionTotal}
      />
    );
  }

  if (mode === 'spoken_response') {
    return (
      <SpokenResponseInner
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
        primary={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        renderMath={renderMath}
        footer={problemReportBlock}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
        hideQuestionTotal={hideQuestionTotal}
      />
    );
  }

  if (mode === 'passage_mcq' && question.passage) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
          {questionCaption}
        </Typography>
        <Box sx={{ borderLeft: `4px solid ${primary}`, bgcolor: primarySoft, borderRadius: 2, p: 2, mb: 2.5 }}>
          {renderMath ? (
            <ExamMathBlock>{question.passage}</ExamMathBlock>
          ) : (
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.65 }}>
              {question.passage}
            </Typography>
          )}
        </Box>
        <QuestionPromptBlock
          question={question}
          renderMath={renderMath}
          mathSx={{ fontWeight: 400, color: '#334155', mb: 2, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' } }}
          typographySx={{ fontWeight: 400, color: '#334155', mb: 2, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' }, whiteSpace: 'pre-line' }}
        />
        {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
          <InstructionLine text={question.instruction} />
        )}
        <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
        <OptionPicker
          options={opts}
          selectedOption={selectedOption}
          onSelect={onSelectOption}
          primaryColor={primary}
          primarySoft={primarySoft}
          borderMuted={borderMuted}
          mathWrap={renderMath}
          selectionLocked={selectionLocked}
          answerFeedback={answerFeedback}
        />
        {problemReportBlock}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
        {questionCaption}
      </Typography>
      <QuestionPromptBlock
        question={question}
        renderMath={renderMath}
        mathSx={{ fontWeight: 400, color: '#334155', mb: 2.5, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' } }}
        typographySx={{ fontWeight: 400, color: '#334155', mb: 2.5, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' }, whiteSpace: 'pre-line' }}
      />
      {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
        <InstructionLine text={question.instruction} />
      )}
      {!visualChoices && <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />}
      {question.image_url && (
        <Box
          sx={{
            mb: 2.5,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${borderMuted}`,
            bgcolor: '#f8fafc',
            display: 'grid',
            placeItems: 'center',
            minHeight: 200,
          }}
        >
          <img src={question.image_url} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
        </Box>
      )}
      {visualChoices ? (
        <VisualOptionPicker
          choices={visualChoices}
          selectedOption={selectedOption}
          onSelect={onSelectOption}
          primaryColor={primary}
          primarySoft={primarySoft}
          borderMuted={borderMuted}
          selectionLocked={selectionLocked}
          answerFeedback={answerFeedback}
        />
      ) : (
        <OptionPicker
          options={opts}
          selectedOption={selectedOption}
          onSelect={onSelectOption}
          primaryColor={primary}
          primarySoft={primarySoft}
          borderMuted={borderMuted}
          mathWrap={renderMath}
          selectionLocked={selectionLocked}
          answerFeedback={answerFeedback}
        />
      )}
      {problemReportBlock}
    </Box>
  );
};

export const ExamQuestionBody = React.memo(ExamQuestionBodyInner);
