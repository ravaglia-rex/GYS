import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Star as StarIcon,
  Psychology as BrainIcon,
  Timer as TimerIcon,
  TrackChanges as TargetIcon,
} from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import BlockIcon from '@mui/icons-material/Block';
import BoltIcon from '@mui/icons-material/Bolt';
import BarChartIcon from '@mui/icons-material/BarChart';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MicIcon from '@mui/icons-material/Mic';
import * as Sentry from '@sentry/react';
import { auth } from '../../firebase/firebase';
import { getStudent } from '../../db/studentCollection';
import { getAssessmentConfig, AssessmentType } from '../../db/assessmentCollection';
import {
  computeGate,
  normalizeMembershipLevel,
  defaultAssessmentProgress,
  ASSESSMENT_NAMES,
  MEMBERSHIP_LEVEL_LABELS,
} from '../../utils/assessmentGating';
import { canAttemptTier } from '../../utils/tierProgression';
import {
  getAssessmentFlowDefinition,
  BeforeBeginIconKey,
} from '../../config/assessmentFlowUI';
import { mergeStatGridWithTier } from '../../components/assessment/mergeStatGridWithTier';

const EXAM_TOTAL = 7;

function BeforeBeginIcon({ k }: { k: BeforeBeginIconKey }) {
  const sx = { fontSize: '1.1rem', color: '#b45309', opacity: 0.95 };
  switch (k) {
    case 'clock':
      return <AccessTimeIcon sx={sx} />;
    case 'phone':
      return <SmartphoneIcon sx={sx} />;
    case 'block':
      return <BlockIcon sx={sx} />;
    case 'bolt':
      return <BoltIcon sx={sx} />;
    case 'chart':
      return <BarChartIcon sx={sx} />;
    case 'headphones':
      return <HeadphonesIcon sx={sx} />;
    case 'mic':
      return <MicIcon sx={sx} />;
    default:
      return <AccessTimeIcon sx={sx} />;
  }
}

const AssessmentDetailPage: React.FC = () => {
  const { assessmentId, tierNumber } = useParams<{ assessmentId: string; tierNumber: string }>();
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid ?? '';
  const tier = parseInt(tierNumber ?? '1', 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membershipLevel, setMembershipLevel] = useState(1);
  const [progressMap, setProgressMap] = useState<Record<string, typeof defaultAssessmentProgress>>({});
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [studentGrade, setStudentGrade] = useState(8);

  useEffect(() => {
    if (!uid || !assessmentId) return;
    (async () => {
      try {
        setLoading(true);
        const [student, config] = await Promise.all([getStudent(uid), getAssessmentConfig()]);
        setMembershipLevel(normalizeMembershipLevel(student?.membership_level));
        setStudentGrade(
          typeof student?.grade === 'number' && !Number.isNaN(student.grade) ? student.grade : 8
        );
        setProgressMap(student?.assessment_progress ?? {});
        setAssessmentTypes(config);
      } catch (e) {
        Sentry.captureException(e);
        setError('Could not load assessment details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [uid, assessmentId]);

  const assessment = useMemo(
    () => assessmentTypes.find((a) => a.id === assessmentId),
    [assessmentTypes, assessmentId]
  );
  const tierConfig = useMemo(
    () => assessment?.tiers.find((t) => t.tier_number === tier),
    [assessment, tier]
  );

  const flow = assessmentId ? getAssessmentFlowDefinition(assessmentId) : getAssessmentFlowDefinition('');
  const gate = assessmentId
    ? computeGate(assessmentId, membershipLevel, progressMap as any, studentGrade, assessmentTypes)
    : { locked: true, reason: 'membership' as const, requiredMembershipLevel: 3 };

  const progressForAssessment = assessmentId ? progressMap[assessmentId] ?? defaultAssessmentProgress : defaultAssessmentProgress;
  const maxTierCount = assessment?.tiers?.length ?? 1;
  const tierAttemptAllowed =
    !!assessment && canAttemptTier(progressForAssessment, tier, maxTierCount);

  const statGrid = useMemo(
    () => mergeStatGridWithTier(flow, tierConfig),
    [flow, tierConfig]
  );

  const primary =
    flow.theme === 'purple'
      ? { main: '#7b1fa2', dark: '#4a148c', light: '#f3e5f5', border: '#ce93d8' }
      : { main: '#1565c0', dark: '#0d47a1', light: '#e3f2fd', border: '#90caf9' };

  const examLabel = `Exam ${flow.examOrdinal} of ${EXAM_TOTAL}`;

  const goBack = () => navigate('/assessments/available');

  if (!assessmentId) {
    navigate('/assessments', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <CircularProgress sx={{ color: primary.main }} />
      </Box>
    );
  }

  if (error || !assessment) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', px: 2, py: 4, maxWidth: 560, mx: 'auto' }}>
        <Typography color="error">{error ?? 'Assessment not found.'}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  // ── 7F sequence lock ─────────────────────────────────────────────────────
  if (gate.locked && gate.reason === 'prerequisite') {
    const miss = gate.missingPrerequisite ?? '';
    const missName = ASSESSMENT_NAMES[miss] ?? miss;
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', pb: 10 }}>
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={goBack} aria-label="Back" size="small">
            <ArrowBackIcon sx={{ color: primary.main }} />
          </IconButton>
          <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>
            Assessment Detail
          </Typography>
          <Box sx={{ width: 40 }} />
        </Box>

        <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, pt: 5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>🔒</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#475569', mb: 1.5 }}>
            Assessment Locked
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.65, mb: 4 }}>
            Complete <strong>{missName}</strong> first so later exams build on your profile.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 4 }}>
            <Box sx={{ px: 2, py: 0.75, borderRadius: 10, bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 700, fontSize: '0.75rem' }}>
              {missName} - do this first
            </Box>
            <Typography sx={{ color: '#94a3b8' }}>→</Typography>
            <Box sx={{ px: 2, py: 0.75, borderRadius: 10, bgcolor: primary.light, color: primary.dark, fontWeight: 600, fontSize: '0.75rem' }}>
              Then this assessment
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            disabled
            startIcon={<LockIcon />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              bgcolor: '#64748b',
              fontWeight: 700,
              '&.Mui-disabled': { bgcolor: '#94a3b8', color: '#fff' },
            }}
          >
            Locked - complete prerequisite first
          </Button>
        </Box>
      </Box>
    );
  }

  // ── 7G membership lock (level gate) ─────────────────────────────────────
  if (gate.locked && gate.reason === 'membership') {
    const need = gate.requiredMembershipLevel ?? 3;
    const isComprehensiveCapstone = assessmentId === 'comprehensive_personality';
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', pb: 10 }}>
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={goBack} aria-label="Back" size="small">
            <ArrowBackIcon sx={{ color: '#64748b' }} />
          </IconButton>
          <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>
            Assessment Detail
          </Typography>
          <Box sx={{ width: 40 }} />
        </Box>

        <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, pt: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3, opacity: 0.85 }}>
            {isComprehensiveCapstone && (
              <Typography sx={{ display: 'inline-block', px: 1.5, py: 0.4, borderRadius: 10, bgcolor: '#e0e0e0', color: '#616161', fontSize: '0.65rem', fontWeight: 800, letterSpacing: 0.6, mb: 2 }}>
                LEVEL 3 EXCLUSIVE
              </Typography>
            )}
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#78909c' }}>
              {assessment.name}
            </Typography>
            <Typography sx={{ color: '#90a4ae', fontSize: '0.85rem', mt: 0.5 }}>
              Requires Level {need} ({MEMBERSHIP_LEVEL_LABELS[need]})
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <StarIcon sx={{ fontSize: 48, color: '#ffc107', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#37474f', mb: 1 }}>
              Level {need} members only
            </Typography>
            <Typography sx={{ color: '#607d8b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              This assessment is included with a higher membership tier. Upgrade to unlock the full sequence and premium instruments.
            </Typography>
          </Box>

          {isComprehensiveCapstone && (
            <Box sx={{ bgcolor: '#f3e5f5', borderRadius: 2, p: 2, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: '#6a1b9a', mb: 1, fontSize: '0.9rem' }}>
                What you get with Level 3
              </Typography>
              {[
                '30-dimension personality assessment',
                'College matching & fit analysis',
                'Counselor sessions (per plan)',
                'Comprehensive guidance reporting',
                'Everything in Level 2 (reasoning triad) plus English, AI, and comprehensive personality (Exams 4–6)',
              ].map((t) => (
                <Typography key={t} sx={{ fontSize: '0.82rem', color: '#4a148c', pl: 1, mb: 0.5, '&:before': { content: '"✓ "', fontWeight: 800 } }}>
                  {t}
                </Typography>
              ))}
            </Box>
          )}

          <Box sx={{ bgcolor: '#fff8e1', border: '1px solid #ffe082', borderRadius: 2, p: 2, mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#e65100', fontWeight: 600, textAlign: 'center' }}>
              Upgrade pricing appears at checkout - compare plans on the billing page.
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/payments#membership-upgrade')}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 700,
              bgcolor: isComprehensiveCapstone ? '#7b1fa2' : primary.main,
              '&:hover': { bgcolor: isComprehensiveCapstone ? '#6a1b9a' : primary.dark },
            }}
          >
            Upgrade membership →
          </Button>
          <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', color: '#90a4ae', mt: 1.5 }}>
            Individual family purchase only.
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Tier sequence (e.g. must clear tier 1 before tier 2) ────────────────
  if (!gate.locked && !tierAttemptAllowed) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', pb: 10 }}>
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={goBack} aria-label="Back" size="small">
            <ArrowBackIcon sx={{ color: primary.main }} />
          </IconButton>
          <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>
            Assessment Detail
          </Typography>
          <Box sx={{ width: 40 }} />
        </Box>
        <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, pt: 5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>🔒</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#475569', mb: 1.5 }}>
            Tier {tier} not available yet
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.65, mb: 3 }}>
            Complete the previous tier at your grade’s required score to unlock this one. You can still retake an earlier tier from the assessments list.
          </Typography>
          <Button fullWidth variant="contained" onClick={goBack} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>
            Back to assessments
          </Button>
        </Box>
      </Box>
    );
  }

  // ── 7A / 7E active pre-assessment ─────────────────────────────────────────
  const heroIcon = flow.theme === 'purple' ? '🧠' : flow.examOrdinal === 1 ? '🧩' : '📋';

  const contentMaxWidth = { xs: 'min(100%, 520px)', md: 920, lg: 1040 };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: { xs: 14, md: 16 } }}>
      <Box
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          px: { xs: 2, md: 3 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton onClick={goBack} aria-label="Back" size="small">
          <ArrowBackIcon sx={{ color: primary.main }} />
        </IconButton>
        <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#334155', fontSize: { xs: '0.95rem', md: '1rem' } }}>
          Assessment Detail
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      <Box sx={{ maxWidth: contentMaxWidth, mx: 'auto', px: { xs: 2, md: 4, lg: 5 }, pt: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            borderRadius: 3,
            background: flow.theme === 'purple' ? 'linear-gradient(180deg, #f3e5f5 0%, #fce4ec 100%)' : `linear-gradient(180deg, ${primary.light} 0%, #fff 85%)`,
            pt: { xs: 3, md: 3.5 },
            pb: { xs: 2, md: 3 },
            px: { xs: 2, md: 4 },
            mb: { xs: 2, md: 3 },
            textAlign: { xs: 'center', md: 'left' },
            display: { md: 'flex' },
            flexDirection: { md: 'row' },
            alignItems: { md: 'center' },
            gap: { md: 3 },
          }}
        >
          <Box sx={{ flexShrink: 0, textAlign: { xs: 'center', md: 'left' } }}>
            {flow.levelExclusiveBadge && (
              <Typography
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.35,
                  borderRadius: 10,
                  bgcolor: '#7b1fa2',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  mb: 1.5,
                }}
              >
                <StarIcon sx={{ fontSize: '0.85rem !important' }} /> {flow.levelExclusiveBadge}
              </Typography>
            )}
            <Typography sx={{ fontSize: { xs: '2.75rem', md: '3.25rem' }, lineHeight: 1, mb: { xs: 1, md: 0 } }}>{heroIcon}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: primary.dark,
                mb: 0.5,
                fontSize: { xs: '1.25rem', md: '1.75rem' },
              }}
            >
              {flow.examTitleShort}
            </Typography>
            <Typography sx={{ color: primary.main, fontSize: { xs: '0.88rem', md: '1rem' }, fontWeight: 500 }}>
              {examLabel} • {flow.heroSubtitle}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, minmax(0, 1fr))' },
            gap: { xs: 1.25, md: 1.5 },
            mb: { xs: 2.5, md: 3 },
          }}
        >
          {statGrid.map((cell) => (
            <Box
              key={cell.label}
              sx={{
                bgcolor: '#fff',
                borderRadius: 2,
                p: { xs: 1.75, md: 2 },
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', mb: 0.5 }}>
                {cell.label}
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>{cell.value}</Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            gap: { xs: 0, md: 3 },
            alignItems: 'start',
            mb: { xs: 2, md: 0 },
          }}
        >
          <Typography
            sx={{
              color: '#334155',
              fontSize: { xs: '0.9rem', md: '1rem' },
              lineHeight: 1.7,
              mb: { xs: 2.5, md: 0 },
            }}
          >
            {flow.bodyDescription}
          </Typography>

          <Box
            sx={{
              bgcolor: flow.theme === 'purple' ? '#f3e5f5' : '#ede7f6',
              borderRadius: 2,
              p: { xs: 2, md: 2.5 },
              mb: { xs: 2, md: 0 },
              height: 'fit-content',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: flow.theme === 'purple' ? '#4a148c' : '#4527a0', mb: 1, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
              {flow.measuresTitle}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.2, color: '#37474f', fontSize: { xs: '0.88rem', md: '0.92rem' }, lineHeight: 1.7 }}>
              {flow.measuresBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </Box>
          </Box>
        </Box>

        {flow.comprehensiveExtra && (
          <Box
            sx={{
              bgcolor: '#fff',
              borderRadius: 2,
              p: { xs: 2, md: 3 },
              mb: { xs: 2, md: 3 },
              mt: { md: 3 },
              border: `1px solid ${primary.border}`,
            }}
          >
            <Typography sx={{ fontWeight: 800, color: primary.dark, mb: 1.5, fontSize: { xs: '0.9rem', md: '1rem' } }}>
              {flow.comprehensiveExtra.howDifferentTitle}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: { md: 2 },
              }}
            >
              {flow.comprehensiveExtra.howDifferentItems.map((row) => (
                <Box key={row.text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: { xs: 1.25, md: 0 } }}>
                  {row.icon === 'brain' && <BrainIcon sx={{ color: '#7b1fa2', fontSize: '1.25rem', mt: 0.1 }} />}
                  {row.icon === 'timer' && <TimerIcon sx={{ color: '#7b1fa2', fontSize: '1.25rem', mt: 0.1 }} />}
                  {row.icon === 'target' && <TargetIcon sx={{ color: '#7b1fa2', fontSize: '1.25rem', mt: 0.1 }} />}
                  <Typography sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' }, color: '#424242', lineHeight: 1.5 }}>{row.text}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: '#9e9e9e', mt: 1 }}>{flow.comprehensiveExtra.footerNote}</Typography>
          </Box>
        )}

        <Box
          sx={{
            bgcolor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 2,
            p: { xs: 2, md: 3 },
            mb: 3,
            mt: { md: flow.comprehensiveExtra ? 0 : 3 },
          }}
        >
          <Typography sx={{ fontWeight: 800, color: '#b45309', mb: 1.25, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
            Before You Begin
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              columnGap: 3,
              rowGap: 0,
            }}
          >
            {flow.beforeBegin.map((row) => (
              <Box key={row.text} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: 1.25 }}>
                <BeforeBeginIcon k={row.icon} />
                <Typography sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' }, color: '#78350f', lineHeight: 1.55, flex: 1 }}>{row.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#fff',
          borderTop: '1px solid #e2e8f0',
          py: { xs: 2, md: 2.25 },
          boxShadow: '0 -4px 24px rgba(15, 23, 42, 0.06)',
        }}
      >
        <Box sx={{ maxWidth: contentMaxWidth, mx: 'auto', px: { xs: 2, md: 4, lg: 5 } }}>
          <Button
            fullWidth
            variant="contained"
            disabled={!tierAttemptAllowed}
            onClick={() =>
              tierAttemptAllowed && navigate(`/assessments/${assessmentId}/tier/${tier}/take`)
            }
            sx={{
              py: { xs: 1.5, md: 1.65 },
              borderRadius: 2,
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.05rem' },
              bgcolor: flow.theme === 'purple' ? '#7b1fa2' : primary.main,
              '&:hover': { bgcolor: flow.theme === 'purple' ? '#6a1b9a' : primary.dark },
              textTransform: 'none',
            }}
          >
            {flow.isComprehensivePersonality ? 'Begin comprehensive assessment →' : 'Begin assessment →'}
          </Button>
          {flow.detailFooterFinePrint && (
            <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', mt: 1.25 }}>
              {flow.detailFooterFinePrint}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AssessmentDetailPage;
