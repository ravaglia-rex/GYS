import React, { useRef, useState, useCallback } from 'react';
import { Box, Typography, FormControl, FormControlLabel, RadioGroup, Radio, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { ExamQuestion, QuestionInteractionType } from '../../db/assessmentCollection';
import { resolvePracticeItemId } from '../practice/practiceModeConfig';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { ExamMathBlock, ExamMathText } from './ExamMathText';
import { QuestionProblemReport, type QuestionReportFrame } from './QuestionProblemReport';

const LIKERT_LEFT = 'Strongly disagree';
const LIKERT_MID = 'Neutral';
const LIKERT_RIGHT = 'Strongly agree';

export function inferQuestionInteraction(
  assessmentId: string,
  q: ExamQuestion | null
): QuestionInteractionType {
  if (!q) return 'visual_mcq';
  if (q.question_type) return q.question_type;
  if (q.audio_url) return 'listening_mcq';
  if (q.passage && q.passage.trim()) return 'passage_mcq';
  const flow = getAssessmentFlowDefinition(assessmentId);
  const pid = assessmentId === 'comprehensive_personality';
  if (pid && q.options?.length >= 5) return 'likert';
  if (flow.defaultQuestionInteraction === 'likert' && q.options?.length >= 5) return 'likert';
  if (flow.defaultQuestionInteraction === 'listening_mcq' && q.audio_url) return 'listening_mcq';
  if (flow.defaultQuestionInteraction === 'passage_mcq' && q.passage) return 'passage_mcq';
  return 'visual_mcq';
}

/** Secondary stem line (canonical `presentation.instruction`). */
const InstructionLine: React.FC<{ text: string }> = ({ text }) => (
  <Typography variant="body2" sx={{ color: '#475569', mb: 2, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
    {text}
  </Typography>
);

function humanizeFieldKey(key: string): string {
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatStimulusLeafValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) {
    return value.map((x) => (typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x))).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function normalizeStemCompare(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Item banks often repeat `question` / `setup` inside `stimulus` for authoring pipelines while the same
 * text is already shown as {@link ExamQuestion.prompt} above this block — skip those duplicates.
 */
function stimulusFieldDuplicatesPrompt(fieldKey: string, value: unknown, prompt: string | undefined): boolean {
  const stemTrim = (prompt ?? '').trim();
  /* Short task line (e.g. "Which box is green?") is almost never substring of the long stem — hide whenever we already show a stem. */
  if (fieldKey === 'question' && stemTrim.length > 0) {
    return true;
  }
  if (!['setup'].includes(fieldKey) || typeof value !== 'string') return false;
  const stem = normalizeStemCompare(prompt ?? '');
  const vs = normalizeStemCompare(value);
  if (!stem || !vs) return false;
  return vs === stem || stem.includes(vs) || vs.includes(stem);
}

/** Turn constraints string (often "a., b., c.") or array into separate lines for display. */
function splitConstraintLines(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw !== 'string') return [];
  const s = raw.trim();
  if (!s) return [];
  const byPeriodComma = s
    .split(/\.\s*,\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (byPeriodComma.length > 1) {
    return byPeriodComma.map((t) => (/\.$/.test(t) ? t : `${t}.`));
  }
  if (s.includes(';')) return s.split(/\s*;\s*/).map((t) => t.trim()).filter(Boolean);
  if (s.includes('\n')) return s.split(/\n+/).map((t) => t.trim()).filter(Boolean);
  return [s];
}

type BlankSlot =
  | { kind: 'none' }
  | { kind: 'start'; caption: string }
  | { kind: 'end'; caption: string }
  | { kind: 'beforeIndex'; zeroBased: number; caption: string }
  | { kind: 'unknown'; caption: string };

/** Where the missing term sits — item banks often use `end`; show plain language + a "?" tile. */
function blankSlotFromStimulus(raw: unknown): BlankSlot {
  if (raw === null || raw === undefined) return { kind: 'none' };
  const s = String(raw).trim().toLowerCase();
  if (s === 'end' || s === 'last' || s === 'after_last') {
    return {
      kind: 'end',
      caption: 'Choose the shape that comes next — right after the last symbol in the row.',
    };
  }
  if (s === 'start' || s === 'first' || s === 'before_first') {
    return {
      kind: 'start',
      caption: 'Choose the shape that belongs at the beginning, before the first symbol.',
    };
  }
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && n >= 1) {
    return {
      kind: 'beforeIndex',
      zeroBased: n - 1,
      caption: `Choose the shape that belongs at position ${n} in the sequence (counting from the left).`,
    };
  }
  return { kind: 'unknown', caption: `Missing item placement: ${String(raw)}.` };
}

function interleaveBlankSlot(syms: unknown[], blank: BlankSlot): Array<{ kind: 'sym'; v: string } | { kind: 'blank' }> {
  const out: Array<{ kind: 'sym'; v: string } | { kind: 'blank' }> = [];
  const list = syms.map((x) => String(x));
  if (blank.kind === 'none' || blank.kind === 'unknown') {
    for (const v of list) out.push({ kind: 'sym', v });
    return out;
  }
  if (blank.kind === 'start') {
    out.push({ kind: 'blank' });
    for (const v of list) out.push({ kind: 'sym', v });
    return out;
  }
  if (blank.kind === 'end') {
    for (const v of list) out.push({ kind: 'sym', v });
    out.push({ kind: 'blank' });
    return out;
  }
  const z = blank.zeroBased;
  for (let i = 0; i < list.length; i++) {
    if (i === z) out.push({ kind: 'blank' });
    out.push({ kind: 'sym', v: list[i] });
  }
  if (z === list.length) out.push({ kind: 'blank' });
  return out;
}

/** Pattern-logic and generic structured stimuli — readable layout instead of raw JSON. */
const HumanFriendlyStimulus: React.FC<{ q: ExamQuestion; border: string }> = ({ q, border }) => {
  const stimulus = q.stimulus;
  const stimulusType = q.stimulus_type;

  if (stimulus == null) return null;

  if (typeof stimulus === 'string') {
    const text = stimulus.trim();
    if (!text) return null;
    return (
      <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${border}` }}>
        <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#334155', fontSize: '0.95rem' }}>
          {text}
        </Typography>
      </Box>
    );
  }

  if (typeof stimulus !== 'object' || Array.isArray(stimulus)) return null;

  const obj = stimulus as Record<string, unknown>;
  const seqCandidate = obj.input_sequence ?? obj.sequence;
  const seq = Array.isArray(seqCandidate) ? seqCandidate : null;
  const rulesRaw = obj.rules;
  const hasSeq = seq !== null && seq.length > 0;
  const rulesArr = Array.isArray(rulesRaw) ? rulesRaw : [];
  const hasRules = rulesArr.some((r) => String(r ?? '').trim());
  const blankMeta = hasSeq ? blankSlotFromStimulus(obj.blank_position) : ({ kind: 'none' } as BlankSlot);
  const interleaved = hasSeq && seq ? interleaveBlankSlot(seq, blankMeta) : [];
  const blankHelp = 'caption' in blankMeta ? blankMeta.caption : null;

  if (hasSeq || hasRules) {
    const symTileSx = {
      fontSize: '1.65rem',
      lineHeight: 1,
      minWidth: 44,
      textAlign: 'center' as const,
      px: 1.25,
      py: 1,
      color: '#0f172a',
      bgcolor: '#fff',
      borderRadius: 1.5,
      border: `1px solid ${border}`,
      boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
    };

    return (
      <Box sx={{ mb: 2.5, p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${border}` }}>
        {hasSeq && (
          <Box sx={{ mb: hasRules ? 2.25 : 0 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1.25, letterSpacing: 0.02 }}
            >
              Sequence
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
              {interleaved.map((cell, i) =>
                cell.kind === 'blank' ? (
                  <Box
                    key={`blank-${i}`}
                    sx={{
                      ...symTileSx,
                      borderStyle: 'dashed',
                      bgcolor: '#f1f5f9',
                      color: '#64748b',
                      fontWeight: 800,
                      fontSize: '1.35rem',
                    }}
                    aria-label="Missing item"
                  >
                    ?
                  </Box>
                ) : (
                  <Box key={`sym-${i}`} sx={symTileSx}>
                    {cell.v}
                  </Box>
                )
              )}
            </Box>
            {blankHelp && (
              <Typography variant="body2" sx={{ mt: 1.35, color: '#475569', lineHeight: 1.55, maxWidth: 520 }}>
                {blankHelp}
              </Typography>
            )}
          </Box>
        )}
        {hasRules && (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1, letterSpacing: 0.02 }}
            >
              {stimulusType === 'symbol_sequence' || stimulusType === 'transformation'
                ? 'Apply these rules'
                : 'Rules to apply'}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25, color: '#334155', '& li': { mb: 0.5 } }}>
              {rulesArr.map((r, i) => (
                <Typography component="li" key={i} sx={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
                  {String(r ?? '')
                    .replace(/^Rule:\s*/i, '')
                    .trim()}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  const entries = Object.entries(obj).filter(
    ([key, value]) =>
      key !== '__proto__' && !stimulusFieldDuplicatesPrompt(key, value, q.prompt)
  );
  if (entries.length === 0) return null;

  return (
    <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${border}`, maxHeight: 320, overflow: 'auto' }}>
      {entries.map(([key, value]) =>
        key === 'constraints' ? (
          <Box key={key} sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1, letterSpacing: 0.02 }}
            >
              Constraints
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25, color: '#334155', '& li': { mb: 0.65 } }}>
              {splitConstraintLines(value).map((line, i) => (
                <Typography component="li" key={i} sx={{ fontSize: '0.92rem', lineHeight: 1.55 }}>
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : (
          <Typography key={key} sx={{ fontSize: '0.9rem', color: '#334155', mb: 0.85, lineHeight: 1.45 }}>
            <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>
              {humanizeFieldKey(key)}:{' '}
            </Box>
            {formatStimulusLeafValue(value)}
          </Typography>
        )
      )}
    </Box>
  );
};

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
        {options.map((option, idx) => {
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
        Question {questionNumber} of {totalQuestions}
      </Typography>
      {renderMath ? (
        <Box sx={{ mb: 2, fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          <ExamMathText inline={false}>{question.prompt}</ExamMathText>
        </Box>
      ) : (
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          {question.prompt}
        </Typography>
      )}
      {question.instruction && <InstructionLine text={question.instruction} />}
      <HumanFriendlyStimulus q={question} border={borderMuted} />
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
        Question {questionNumber} of {totalQuestions}
      </Typography>
      {renderMath ? (
        <Box sx={{ mb: 2, fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          <ExamMathText inline={false}>{question.prompt}</ExamMathText>
        </Box>
      ) : (
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          {question.prompt}
        </Typography>
      )}
      {question.instruction && <InstructionLine text={question.instruction} />}
      <HumanFriendlyStimulus q={question} border={borderMuted} />
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
}

export const ExamQuestionBody: React.FC<ExamQuestionBodyProps> = ({
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
}) => {
  const primary = theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = '#e2e8f0';

  if (!question) return null;

  const mode = inferQuestionInteraction(assessmentId, question);
  const opts = question.options ?? [];

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
          Question {questionNumber} of {totalQuestions}
        </Typography>
        {renderMath ? (
          <Box sx={{ lineHeight: 1.5, mb: 3, fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
            <ExamMathText inline={false}>{question.prompt}</ExamMathText>
          </Box>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.5, mb: 3, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
            {question.prompt}
          </Typography>
        )}
        {question.instruction && <InstructionLine text={question.instruction} />}
        <HumanFriendlyStimulus q={question} border={borderMuted} />
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
      />
    );
  }

  if (mode === 'passage_mcq' && question.passage) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
          Question {questionNumber} of {totalQuestions}
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
        {renderMath ? (
          <Box sx={{ fontWeight: 800, color: '#0f172a', mb: 2, lineHeight: 1.5 }}>
            <ExamMathText inline={false}>{question.prompt}</ExamMathText>
          </Box>
        ) : (
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, lineHeight: 1.5 }}>
            {question.prompt}
          </Typography>
        )}
        {question.instruction && <InstructionLine text={question.instruction} />}
        <HumanFriendlyStimulus q={question} border={borderMuted} />
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
        Question {questionNumber} of {totalQuestions}
      </Typography>
      {renderMath ? (
        <Box sx={{ fontWeight: 700, color: '#0f172a', mb: 2.5, lineHeight: 1.5, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          <ExamMathText inline={false}>{question.prompt}</ExamMathText>
        </Box>
      ) : (
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2.5, lineHeight: 1.5, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          {question.prompt}
        </Typography>
      )}
      {question.instruction && <InstructionLine text={question.instruction} />}
      <HumanFriendlyStimulus q={question} border={borderMuted} />
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
};
