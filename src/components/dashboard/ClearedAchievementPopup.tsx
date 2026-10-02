import React, { useMemo, useState } from 'react';
import { Box, Button, Dialog, Typography } from '@mui/material';
import { useStudentAssessments } from '../../query/hooks';
import { auth } from '../../firebase/firebase';
import type { AttemptRecord } from '../../db/assessmentCollection';
import { areExamScoresVisible } from '../../constants/constants';
import { assessmentDisplayName, isLevelBasedAssessment } from '../../utils/assessmentGating';
import { canonicalAssessmentId } from '../../utils/assessmentIdCompat';
import { timestampToMillis } from '../../utils/examAttemptCooldown';

function ackStorageKey(uid: string): string {
  return `argus.cleared-achievement-ack:${uid}`;
}

function clearanceKey(attempt: AttemptRecord): string {
  if (attempt.attempt_id) return attempt.attempt_id;
  const ms = timestampToMillis(attempt.completed_at) ?? timestampToMillis(attempt.started_at) ?? 0;
  return `${canonicalAssessmentId(attempt.assessment_id)}:${attempt.proficiency_tier ?? 'exam'}:${ms}`;
}

function latestClearedAttempt(attempts: AttemptRecord[]): AttemptRecord | null {
  let latest: AttemptRecord | null = null;
  let latestMs = -1;
  for (const attempt of attempts) {
    if (attempt.status !== 'completed') continue;
    if (!areExamScoresVisible(attempt.assessment_id) || attempt.score_release_held === true) continue;
    const ms = timestampToMillis(attempt.completed_at) ?? timestampToMillis(attempt.started_at) ?? 0;
    if (ms < latestMs) continue;
    latest = attempt;
    latestMs = ms;
  }
  if (!latest || latest.passed !== true) return null;
  return latest;
}

function clearanceLabel(attempt: AttemptRecord): string {
  const id = canonicalAssessmentId(attempt.assessment_id);
  const name = assessmentDisplayName(id);
  const level =
    isLevelBasedAssessment(id) &&
    typeof attempt.proficiency_tier === 'number' &&
    attempt.proficiency_tier > 0
      ? ` Level ${attempt.proficiency_tier}`
      : '';
  return `${name}${level}`;
}

function readAck(uid: string): string {
  try {
    return window.localStorage.getItem(ackStorageKey(uid)) ?? '';
  } catch {
    return '';
  }
}

function writeAck(uid: string, key: string): void {
  try {
    window.localStorage.setItem(ackStorageKey(uid), key);
  } catch {
    /* ignore private-mode storage failures */
  }
}

const ClearedAchievementPopup: React.FC = () => {
  const uid = auth.currentUser?.uid ?? '';
  const { data } = useStudentAssessments(uid, Boolean(uid));
  const latest = useMemo(
    () => latestClearedAttempt(data?.attempts ?? []),
    [data?.attempts]
  );
  const key = latest ? clearanceKey(latest) : '';
  const [dismissedKey, setDismissedKey] = useState('');
  const open = Boolean(uid && latest && key && readAck(uid) !== key && dismissedKey !== key);

  const acknowledge = () => {
    if (!uid || !key) return;
    writeAck(uid, key);
    setDismissedKey(key);
  };

  if (!latest || !open) return null;

  return (
    <Dialog
      open
      disableEscapeKeyDown
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
      }}
      aria-labelledby="cleared-achievement-title"
      PaperProps={{
        sx: {
          mx: 2,
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          overflow: 'hidden',
          textAlign: 'center',
          color: '#fffbeb',
          background:
            'radial-gradient(circle at 50% 0%, rgba(253, 224, 71, 0.45), transparent 46%), linear-gradient(180deg, #78350f 0%, #1c1917 72%)',
          border: '1px solid rgba(251, 191, 36, 0.75)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          animation: 'achievementPop 0.45s ease-out',
          '@keyframes achievementPop': {
            '0%': { transform: 'scale(0.82)', opacity: 0 },
            '70%': { transform: 'scale(1.04)', opacity: 1 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        },
      }}
    >
      <Box sx={{ px: 3, pt: 3.5, pb: 2.5 }}>
        <Box aria-hidden sx={{ position: 'relative', width: 124, height: 124, mx: 'auto', mb: 0.5 }}>
          <Box
            sx={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              background:
                'conic-gradient(from 0deg, transparent 0%, rgba(254, 243, 199, 0.95) 12%, transparent 28%, transparent 62%, rgba(251, 191, 36, 0.9) 76%, transparent 92%)',
              filter: 'blur(7px)',
              animation: 'glowSweep 3.4s linear infinite',
              '@keyframes glowSweep': {
                to: { transform: 'rotate(360deg)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 14,
              borderRadius: '50%',
              boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.45)',
              animation: 'glowPulse 2.2s ease-in-out infinite',
              '@keyframes glowPulse': {
                '0%, 100%': { boxShadow: '0 0 18px 4px rgba(251, 191, 36, 0.25)' },
                '50%': { boxShadow: '0 0 32px 12px rgba(253, 224, 71, 0.55)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(160deg, #fef3c7 0%, #fbbf24 48%, #d97706 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
              fontSize: '2.8rem',
              lineHeight: 1,
            }}
          >
            👑
          </Box>
        </Box>
        <Typography
          sx={{
            color: '#fcd34d',
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: 1.6,
            textTransform: 'uppercase',
          }}
        >
          Achievement
        </Typography>
        <Typography
          id="cleared-achievement-title"
          sx={{ color: '#fffbeb', fontWeight: 900, fontSize: '1.45rem', lineHeight: 1.25, mt: 0.75 }}
        >
          You cleared {clearanceLabel(latest)}!
        </Typography>
        <Typography sx={{ color: '#fde68a', fontSize: '0.98rem', fontWeight: 700, mt: 1 }}>
          Nice work! You earned this. Be proud of it.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={acknowledge}
          sx={{
            mt: 2.5,
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 900,
            fontSize: '1rem',
            color: '#451a03',
            background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
            boxShadow: 'none',
            '&:hover': { background: 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 100%)', boxShadow: 'none' },
          }}
        >
          OK
        </Button>
      </Box>
    </Dialog>
  );
};

export default ClearedAchievementPopup;
