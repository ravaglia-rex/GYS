import React, { useRef, useState, useCallback } from 'react';
import { Box, Typography, FormControl, FormControlLabel, RadioGroup, Radio, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { ExamQuestion, QuestionInteractionType } from '../../db/assessmentCollection';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { ExamMathBlock, ExamMathText } from './ExamMathText';

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

/** Fallback display for structured pattern-logic stimuli until a dedicated renderer exists. */
const StimulusBlock: React.FC<{ q: ExamQuestion; border: string }> = ({ q, border }) => {
  if (q.stimulus == null) return null;
  const text =
    typeof q.stimulus === 'string' ? q.stimulus : JSON.stringify(q.stimulus, null, 2);
  return (
    <Box
      sx={{
        mb: 2.5,
        p: 2,
        bgcolor: '#f8fafc',
        borderRadius: 2,
        border: `1px solid ${border}`,
        maxHeight: 320,
        overflow: 'auto',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>
        {q.stimulus_type ? `Stimulus (${q.stimulus_type})` : 'Stimulus'}
      </Typography>
      <Typography
        component="pre"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '0.78rem',
          m: 0,
          whiteSpace: 'pre-wrap',
          color: '#334155',
        }}
      >
        {text}
      </Typography>
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
}

function OptionPicker({
  options,
  selectedOption,
  onSelect,
  primaryColor,
  primarySoft,
  borderMuted,
  mathWrap,
}: OptionPickerProps) {
  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={selectedOption !== null ? String(selectedOption) : ''}
        onChange={(e) => onSelect(parseInt(e.target.value, 10))}
      >
        {options.map((option, idx) => (
          <FormControlLabel
            key={idx}
            value={String(idx)}
            control={<Radio sx={{ display: 'none' }} />}
            onClick={() => onSelect(idx)}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: selectedOption === idx ? primaryColor : '#f1f5f9',
                    border: `2px solid ${selectedOption === idx ? primaryColor : borderMuted}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: selectedOption === idx ? '#fff' : '#64748b' }}>
                    {String.fromCharCode(65 + idx)}
                  </Typography>
                </Box>
                {mathWrap ? (
                  <ExamMathText
                    inline
                    sx={{
                      color: selectedOption === idx ? '#0f172a' : '#475569',
                      fontSize: '0.92rem',
                      fontWeight: selectedOption === idx ? 700 : 500,
                    }}
                  >
                    {option}
                  </ExamMathText>
                ) : (
                  <Typography
                    sx={{
                      color: selectedOption === idx ? '#0f172a' : '#475569',
                      fontSize: '0.92rem',
                      fontWeight: selectedOption === idx ? 700 : 500,
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
              border: `2px solid ${selectedOption === idx ? primaryColor : borderMuted}`,
              bgcolor: selectedOption === idx ? primarySoft : '#fff',
              cursor: 'pointer',
              alignItems: 'center',
              transition: 'all 0.15s',
              '&:hover': { borderColor: `${primaryColor}99` },
            }}
          />
        ))}
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
      <StimulusBlock q={question} border={borderMuted} />
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
      />
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
      <StimulusBlock q={question} border={borderMuted} />
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
      />
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
}) => {
  const primary = theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = '#e2e8f0';

  if (!question) return null;

  const mode = inferQuestionInteraction(assessmentId, question);
  const opts = question.options ?? [];

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
        <StimulusBlock q={question} border={borderMuted} />
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
        <StimulusBlock q={question} border={borderMuted} />
        <OptionPicker
          options={opts}
          selectedOption={selectedOption}
          onSelect={onSelectOption}
          primaryColor={primary}
          primarySoft={primarySoft}
          borderMuted={borderMuted}
          mathWrap={renderMath}
        />
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
      <StimulusBlock q={question} border={borderMuted} />
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
      />
    </Box>
  );
};
