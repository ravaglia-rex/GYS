import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
} from '@mui/material';
import { CheckCircle as CheckIcon, NavigateNext as NextIcon, Replay as ReplayIcon } from '@mui/icons-material';
import { PREVIEW_ASSESSMENT_QUESTIONS } from '../../../data/schoolPreviewMock';

const SchoolPreviewAssessmentPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const total = PREVIEW_ASSESSMENT_QUESTIONS.length;
  const q = PREVIEW_ASSESSMENT_QUESTIONS[step];
  const progress = ((step + (done ? 1 : 0)) / total) * 100;

  const score = () => {
    let correct = 0;
    PREVIEW_ASSESSMENT_QUESTIONS.forEach(item => {
      if (choices[item.id] === item.correctIndex) correct += 1;
    });
    return correct;
  };

  const handleNext = () => {
    if (step < total - 1) setStep(s => s + 1);
    else setDone(true);
  };

  const reset = () => {
    setStep(0);
    setChoices({});
    setDone(false);
  };

  if (done) {
    const s = score();
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', pb: 6 }}>
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', textAlign: 'center' }}>
          <CardContent sx={{ p: '32px !important' }}>
            <CheckIcon sx={{ fontSize: 56, color: '#10b981', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 1 }}>
              Sample complete
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
              You scored {s} out of {total}. In the live assessment, timing, proctoring, and full item banks apply.
            </Typography>
            <Button
              variant="contained"
              startIcon={<ReplayIcon />}
              onClick={reset}
              sx={{ bgcolor: '#3b82f6', fontWeight: 700, '&:hover': { bgcolor: '#2563eb' } }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const selected = choices[q.id];
  const canContinue = typeof selected === 'number';

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', pb: 6 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
          Question {step + 1} of {total}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 1, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' } }} />
      </Box>

      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: '28px !important' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 3, lineHeight: 1.4 }}>
            {q.prompt}
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selected ?? ''}
              onChange={(_, v) => setChoices(c => ({ ...c, [q.id]: Number(v) }))}
            >
              {q.options.map((opt, idx) => (
                <FormControlLabel
                  key={idx}
                  value={idx}
                  control={<Radio sx={{ color: '#64748b', '&.Mui-checked': { color: '#3b82f6' } }} />}
                  label={<Typography sx={{ color: '#e2e8f0', fontSize: '0.95rem' }}>{opt}</Typography>}
                  sx={{
                    mb: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    border: '1px solid #334155',
                    bgcolor: selected === idx ? 'rgba(59,130,246,0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              endIcon={<NextIcon />}
              disabled={!canContinue}
              onClick={handleNext}
              sx={{ bgcolor: '#10b981', fontWeight: 700, '&:hover': { bgcolor: '#059669' }, '&.Mui-disabled': { bgcolor: '#334155', color: '#64748b' } }}
            >
              {step === total - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SchoolPreviewAssessmentPage;
