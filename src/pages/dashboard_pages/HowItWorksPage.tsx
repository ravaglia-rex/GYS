import React from 'react';
import {
  Avatar,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import * as Sentry from '@sentry/react';
import {
  AutoAwesome as AutoAwesomeIcon,
  EmojiEvents as EmojiEventsIcon,
  ErrorOutline as ErrorOutlineIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  MilitaryTech as MilitaryTechIcon,
  MonetizationOn as MonetizationOnIcon,
  Quiz as QuizIcon,
  QueryStats as QueryStatsIcon,
  RocketLaunch as RocketLaunchIcon,
  School as SchoolIcon,
  Storefront as StorefrontIcon,
  Timeline as TimelineIcon,
  WbTwilight as WbTwilightIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ASSESSMENT_NAMES, ASSESSMENT_ORDER, isLevelBasedAssessment, LEVEL_CLEAR_THRESHOLD_LABEL, MEMBERSHIP_LEVEL_LABELS } from '../../utils/assessmentGating';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';

const glassPanelSx = {
  borderRadius: 3,
  bgcolor: 'rgba(30, 41, 59, 0.62)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 18px 50px rgba(0, 0, 0, 0.24)',
};

const tableCellSx = {
  color: 'rgba(255, 255, 255, 0.78)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  fontSize: '0.9rem',
  verticalAlign: 'top',
  textAlign: 'justify',
};

const tableHeaderSx = {
  ...tableCellSx,
  color: 'white',
  fontWeight: 800,
  bgcolor: 'rgba(15, 23, 42, 0.8)',
};

const justifiedTextSx = {
  textAlign: 'justify',
} as const;

type SectionCardProps = {
  id?: string;
  icon: React.ReactElement;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

const SectionCard: React.FC<SectionCardProps> = ({ id, icon, title, subtitle, children, sx }) => (
  <Paper id={id} data-tutorial-id={id} sx={{ ...glassPanelSx, p: { xs: 2.25, md: 3 }, ...sx }}>
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 2, minWidth: 0 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2, m: 0 }}>
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography sx={{ display: { xs: 'block', sm: 'none' }, color: 'rgba(255, 255, 255, 0.68)', mt: 1.5, lineHeight: 1.6, ...justifiedTextSx }}>
          {subtitle}
        </Typography>
      )}

      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: subtitle ? 'flex-start' : 'center',
          gap: 2,
          minWidth: 0,
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2, m: 0 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.68)', mt: 0.75, lineHeight: 1.6, ...justifiedTextSx }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
    {children}
  </Paper>
);

type MiniCardProps = {
  icon: React.ReactElement;
  title: string;
  body: string;
  color: string;
};

const MiniCard: React.FC<MiniCardProps> = ({ icon, title, body, color }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: 'rgba(15, 23, 42, 0.56)',
      border: `1px solid ${color}55`,
      minHeight: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Avatar sx={{ width: 34, height: 34, bgcolor: `${color}22`, color }}>{icon}</Avatar>
      <Typography sx={{ color: 'white', fontWeight: 800 }}>{title}</Typography>
    </Box>
    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.55, ...justifiedTextSx }}>
      {body}
    </Typography>
  </Box>
);

const membershipRows = [
  {
    level: 1,
    exams: ['Pattern and Logic'],
  },
  {
    level: 2,
    exams: ['Pattern and Logic', 'Verbal Reasoning', 'Mathematical Reasoning'],
  },
  {
    level: 3,
    exams: ['Pattern and Logic', 'Verbal Reasoning', 'Mathematical Reasoning', 'Personality and Interest', 'AI Proficiency'],
  },
  {
    level: 4,
    exams: [
      'Pattern and Logic',
      'Verbal Reasoning',
      'Mathematical Reasoning',
      'Personality and Interest',
      'AI Proficiency',
      'English Proficiency',
      'Career Discovery',
    ],
  },
];

const packageRoadmapColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const percentileRows = [
  { percentile: 'No core results yet', badge: 'Explorer', meaning: 'You are still getting started.' },
  { percentile: '0-60th percentile', badge: 'Bronze', meaning: 'You are building steady skills.' },
  { percentile: '61st-80th percentile', badge: 'Silver', meaning: 'You are ahead of many students in your class.' },
  { percentile: '81st-90th percentile', badge: 'Gold', meaning: 'You are performing strongly.' },
  { percentile: '91st-97th percentile', badge: 'Platinum', meaning: 'You are near the top of your class group.' },
  { percentile: '98th-100th percentile', badge: 'Diamond', meaning: 'You are among the highest performers.' },
];

const achievementTierBadges = [
  { label: 'Explorer', symbol: '🧭', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.16)' },
  { label: 'Bronze', symbol: '🥉', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.16)' },
  { label: 'Silver', symbol: '🥈', color: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.14)' },
  { label: 'Gold', symbol: '🥇', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)' },
  { label: 'Platinum', symbol: '✦', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.16)' },
  { label: 'Diamond', symbol: '💎', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.16)' },
];

const examOrder = ASSESSMENT_ORDER.map((id) => ASSESSMENT_NAMES[id]);

const assessmentJourneyCards = [
  { id: 'symbolic_reasoning' },
  { id: 'verbal_reasoning' },
  { id: 'mathematical_reasoning' },
  { id: 'comprehensive_personality' },
  { id: 'ai_literacy' },
  { id: 'english_proficiency' },
  { id: 'career_interest_inventory', unlockBadge: 'Unlocks After Completing All Assessments' },
] as const;

const journeyArrowSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#38bdf8',
  fontWeight: 800,
  fontSize: { xs: '1.25rem', sm: '1.5rem' },
  flexShrink: 0,
  userSelect: 'none',
  lineHeight: 1,
} as const;

const AssessmentJourneyCardView: React.FC<{
  card: (typeof assessmentJourneyCards)[number];
  step: number;
}> = ({ card, step }) => {
  const name = ASSESSMENT_NAMES[card.id];
  const showLevels = isLevelBasedAssessment(card.id);
  const unlockBadge = 'unlockBadge' in card ? card.unlockBadge : undefined;

  return (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: 0,
        p: 1.75,
        borderRadius: 3,
        bgcolor: 'rgba(15, 23, 42, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.22)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignSelf: 'stretch',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Avatar
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            bgcolor: 'rgba(56, 189, 248, 0.16)',
            border: '2px solid #38bdf8',
            color: '#7dd3fc',
            fontWeight: 900,
            fontSize: '0.8rem',
          }}
        >
          {step}
        </Avatar>
        <Typography
          sx={{
            color: 'white',
            fontWeight: 900,
            lineHeight: 1.25,
            fontSize: '0.9rem',
            wordBreak: 'break-word',
          }}
        >
          {name}
        </Typography>
      </Box>

      {showLevels ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mt: 'auto' }}>
          {[1, 2, 3].map((level) => (
            <Box
              key={level}
              sx={{
                bgcolor: 'rgba(51, 65, 85, 0.92)',
                py: 0.65,
                px: 1,
                borderRadius: 1.5,
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.88)',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              Level {level}
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              width: '100%',
              bgcolor: 'rgba(15, 118, 110, 0.85)',
              py: 0.85,
              px: 1.25,
              borderRadius: 1.5,
              textAlign: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.72rem',
              lineHeight: 1.35,
            }}
          >
            {unlockBadge ?? 'Single Assessment'}
          </Box>
        </Box>
      )}
    </Box>
  );
};

const AssessmentJourneyPath: React.FC = () => {
  const topRow = assessmentJourneyCards.slice(0, 4);
  const bottomRow = assessmentJourneyCards.slice(4);

  return (
    <>
      {/* Mobile: vertical path */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1 }}>
        {assessmentJourneyCards.map((card, index) => (
          <React.Fragment key={card.id}>
            <AssessmentJourneyCardView card={card} step={index + 1} />
            {index < assessmentJourneyCards.length - 1 && (
              <Box sx={journeyArrowSx} aria-hidden>
                ↓
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Tablet / desktop: two rows with horizontal arrows only */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
          {topRow.map((card, index) => (
            <React.Fragment key={card.id}>
              <AssessmentJourneyCardView card={card} step={index + 1} />
              {index < topRow.length - 1 && (
                <Box sx={journeyArrowSx} aria-hidden>
                  ➜
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1, maxWidth: '75%', mx: 'auto', width: '100%' }}>
          {bottomRow.map((card, index) => (
            <React.Fragment key={card.id}>
              <AssessmentJourneyCardView card={card} step={topRow.length + index + 1} />
              {index < bottomRow.length - 1 && (
                <Box sx={journeyArrowSx} aria-hidden>
                  ➜
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </>
  );
};

const expectedLevelRows = [
  {
    grades: '6 and 7',
    expectedLevel: 'Level 1',
    meaning:
      'The Tier and national ranking are based only on Level 1 results. Higher levels are optional and do not affect the Tier.',
  },
  {
    grades: '8 and 9',
    expectedLevel: 'Level 2',
    meaning:
      'The Tier and national ranking are based only on Level 2 results. Other levels do not affect the Tier.',
  },
  {
    grades: '10, 11 and 12',
    expectedLevel: 'Level 3',
    meaning:
      'The Tier and national ranking are based only on Level 3 results. Lower levels must be completed first to unlock Level 3.',
  },
];

export const HowItWorksContent: React.FC = () => {
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', ...justifiedTextSx }}>
          <Box
            id="student-how-it-works-hero"
            data-tutorial-id="student-how-it-works-hero"
            sx={{
              ...glassPanelSx,
              p: { xs: 2.5, md: 4 },
              mb: 3,
              overflow: 'hidden',
              position: 'relative',
              background:
                'radial-gradient(circle at top left, rgba(139, 92, 246, 0.35), transparent 34%), radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.2), transparent 32%), rgba(30, 41, 59, 0.66)',
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 2, minWidth: 0 }}>
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    color: 'white',
                  }}
                >
                  <ErrorOutlineIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography
                  variant="h4"
                  sx={{
                    ...studentPageTitleSx,
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    lineHeight: 1.15,
                    minWidth: 0,
                  }}
                >
                 How GYS Works - Very Important
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ ...studentPageSubtitleSx, display: { xs: 'block', sm: 'none' }, mt: 2, lineHeight: 1.65, ...justifiedTextSx }}>
                Think of GYS like a learning adventure map! You take exams, complete levels, unlock the next challenge,
                and see how your skills grow compared with students in your class.
              </Typography>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'flex-start', gap: 2.5, minWidth: 0 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    color: 'white',
                  }}
                >
                  <ErrorOutlineIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      ...studentPageTitleSx,
                    }}
                  >
                    How GYS Works - Very Important
                  </Typography>
                  <Typography variant="h6" sx={{ ...studentPageSubtitleSx, lineHeight: 1.65, ...justifiedTextSx }}>
                    Think of GYS like a learning adventure map! You take exams, complete levels, unlock the next challenge,
                    and see how your skills grow compared with students in your class.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <SectionCard
            id="student-how-it-works-assessment-journey"
            icon={<RocketLaunchIcon />}
            title="Your Assessment Journey"
            subtitle="Follow the numbered path through each assessment."
            sx={{ mb: 3 }}
          >
            <AssessmentJourneyPath />
          </SectionCard>

          <SectionCard
            id="student-how-it-works-expected-level"
            icon={<SchoolIcon />}
            title="Which Level Matters for You?"
            sx={{ mb: 3 }}
          >
            <TableContainer
              component={Box}
              sx={{ borderRadius: 2, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderSx}>Student Class</TableCell>
                    <TableCell sx={tableHeaderSx}>Expected Level</TableCell>
                    <TableCell sx={tableHeaderSx}>Rule</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expectedLevelRows.map((row) => (
                    <TableRow key={row.grades}>
                      <TableCell sx={{ ...tableCellSx, color: 'white', fontWeight: 800 }}>{row.grades}</TableCell>
                      <TableCell sx={{ ...tableCellSx, color: 'white', fontWeight: 800 }}>{row.expectedLevel}</TableCell>
                      <TableCell sx={tableCellSx}>{row.meaning}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(15, 23, 42, 0.56)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.6, ...justifiedTextSx }}>
                <Box component="span" sx={{ color: 'white', fontWeight: 800 }}>
                  Remember:
                </Box>{' '}
                You can attempt higher levels for practice, but your National Tier is always calculated using your
                Expected Level.
              </Typography>
            </Box>
          </SectionCard>
        


          <Box
            sx={{
              ...glassPanelSx,
              display: 'grid',
              gridTemplateColumns: '1fr',
              alignItems: 'center',
              gap: 2,
              p: { xs: 2, md: 2.5 },
              mb: 3,
              borderColor: 'rgba(56, 189, 248, 0.32)',
              background:
                'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(139, 92, 246, 0.12)), rgba(15, 23, 42, 0.72)',
            }}
          >
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.05rem', mb: 0.5 }}>
                Exams and levels unlock separately
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.76)', lineHeight: 1.6, ...justifiedTextSx }}>
                Attempting an exam can unlock the next exam when your package allows it.
                <br />
                Additionally, scoring{' '}
                <Box component="span" sx={{ color: 'white', fontWeight: 900 }}>
                  {LEVEL_CLEAR_THRESHOLD_LABEL}
                </Box>{' '}
                or more on a level completes that level and unlocks the next level for the same exam.
              </Typography>
            </Box>
          </Box>


          <SectionCard
            id="student-how-it-works-national-badge"
            icon={<MilitaryTechIcon />}
            title="How Do You Earn Your National Badge?"
            subtitle="Complete all three Reasoning assessments at your Expected Level. Until then, your badge remains Explorer."
            sx={{ mb: 3 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 1, sm: 1.5 },
                color: '#38bdf8',
                fontWeight: 800,
                fontSize: { xs: '0.95rem', sm: '1.15rem' },
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              <Box component="span">🧩 {ASSESSMENT_NAMES.symbolic_reasoning}</Box>
              <Box component="span" aria-hidden>
                ➜
              </Box>
              <Box component="span">💬 {ASSESSMENT_NAMES.verbal_reasoning}</Box>
              <Box component="span" aria-hidden>
                ➜
              </Box>
              <Box component="span">➗ {ASSESSMENT_NAMES.mathematical_reasoning}</Box>
              <Box component="span" aria-hidden>
                ➜
              </Box>
              <Box component="span" sx={{ color: '#fbbf24' }}>
                🏆 National Achievement Badge
              </Box>
            </Box>
          </SectionCard>

          <SectionCard
            id="student-how-it-works-membership"
            icon={<TimelineIcon />}
            title="Exam Roadmap And Package Unlocks"
            subtitle="Follow the path from the first exam to the full program. Each package opens a bigger part of the roadmap."
          >
            <Box sx={{ position: 'relative', maxWidth: 980, mx: 'auto', py: { xs: 0.5, md: 1.5 }, overflow: 'hidden' }}>
              <Box
                component="svg"
                aria-hidden
                viewBox="0 0 120 620"
                preserveAspectRatio="none"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  position: 'absolute',
                  left: '50%',
                  top: 28,
                  bottom: 28,
                  width: 120,
                  transform: 'translateX(-50%)',
                  zIndex: 0,
                }}
              >
                <defs>
                  <linearGradient id="student-roadmap-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="35%" stopColor="#3b82f6" />
                    <stop offset="68%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path
                  d="M60 10 C15 92, 105 150, 60 230 C15 310, 105 370, 60 450 C25 520, 80 565, 60 610"
                  fill="none"
                  stroke="url(#student-roadmap-gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </Box>

              {membershipRows.map((row, packageIndex) => {
                const color = packageRoadmapColors[packageIndex] ?? '#8b5cf6';
                const previousExams = membershipRows[packageIndex - 1]?.exams ?? [];
                const newlyUnlocked = row.exams.filter((exam) => !previousExams.includes(exam));
                const unlockedText = newlyUnlocked
                  .map((exam) => `${examOrder.indexOf(exam) + 1}. ${exam}`)
                  .join(', ');
                const detailsOnLeft = packageIndex % 2 === 1;

                return (
                  <Box
                    key={row.level}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 112px minmax(0, 1fr)' },
                      gap: { xs: 1.5, md: 2.5 },
                      alignItems: 'center',
                      position: 'relative',
                      minHeight: { md: 136 },
                      pb: packageIndex === membershipRows.length - 1 ? 0 : { xs: 3, md: 2 },
                      scrollSnapAlign: 'start',
                      zIndex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        position: { md: 'sticky' },
                        top: { md: 24 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        gridColumn: { md: detailsOnLeft ? '3' : '1' },
                        gridRow: { md: 1 },
                        justifyContent: { md: detailsOnLeft ? 'flex-start' : 'flex-end' },
                        textAlign: 'justify',
                        zIndex: 1,
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 900, lineHeight: 1.2 }}>
                          {MEMBERSHIP_LEVEL_LABELS[row.level]}
                        </Typography>
                        <Typography variant="caption" sx={{ color, fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.45, ...justifiedTextSx }}>
                          {unlockedText}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gridColumn: { md: '2' }, gridRow: { md: 1 }, justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: '#0f172a',
                          border: `3px solid ${color}`,
                          boxShadow: `0 0 0 8px rgba(15, 23, 42, 0.86), 0 0 26px ${color}66`,
                          color: 'white',
                          fontWeight: 900,
                        }}
                      >
                        {row.level}
                      </Avatar>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </SectionCard>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mt: 3, mb: 3 }}>

            <SectionCard
              id="student-how-it-works-tiers-leaderboard"
              icon={<EmojiEventsIcon />}
              title="Achievement Tiers Vs. Leaderboard"
              subtitle="Both use your official results, but they answer different questions."
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '1fr 120px 1fr' },
                  alignItems: 'stretch',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    bgcolor: 'rgba(8, 145, 178, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.38)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 76, height: 76, bgcolor: 'rgba(6, 182, 212, 0.18)', color: '#67e8f9' }}>
                      <MilitaryTechIcon sx={{ fontSize: 44 }} />
                    </Avatar>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.25rem' }}>
                        Achievement tiers
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.55, ...justifiedTextSx }}>
                        Your badge level <Box component="span" sx={{ fontWeight: 900 }}>across the country</Box>, compared with students in your class.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.25 }}>
                    {achievementTierBadges.map((badge) => (
                      <Box
                        key={badge.label}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: badge.bg,
                          border: `1px solid ${badge.color}66`,
                        }}
                      >
                        <Box
                          aria-hidden
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(15, 23, 42, 0.68)',
                            border: `1px solid ${badge.color}55`,
                            fontSize: badge.label === 'Platinum' ? '1.5rem' : '1.25rem',
                            color: badge.color,
                            flexShrink: 0,
                          }}
                        >
                          {badge.symbol}
                        </Box>
                        <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '0.95rem' }}>
                          {badge.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.7)',
                    px: 1,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '100%', lg: 2 },
                      minHeight: { xs: 2, lg: 180 },
                      background: {
                        xs: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.55), transparent)',
                        lg: 'linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.55), transparent)',
                      },
                      borderTop: { xs: '2px solid rgba(148, 163, 184, 0.45)', lg: 0 },
                      borderLeft: { xs: 0, lg: '2px solid rgba(148, 163, 184, 0.45)' },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      textAlign: 'center',
                      bgcolor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 999,
                      px: 1.5,
                      py: 0.75,
                      color: 'rgba(255,255,255,0.72)',
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    Built on your
                    <br />
                    results
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    bgcolor: 'rgba(245, 158, 11, 0.11)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 76, height: 76, bgcolor: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24' }}>
                      <EmojiEventsIcon sx={{ fontSize: 44 }} />
                    </Avatar>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.25rem' }}>
                        Leaderboard
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.55, ...justifiedTextSx }}>
                        A <Box component="span" sx={{ fontWeight: 900 }}>school-level</Box> top 10 list for each exam and class.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    {[
                      {
                        icon: <EmojiEventsIcon fontSize="small" />,
                        title: 'Top 10 per class, per exam  ',
                        
                      },
                      {
                        icon: <QueryStatsIcon fontSize="small" />,
                        title: 'Uses scores and percentiles to rank',
                       
                      },
                    ].map((item) => (
                      <Box
                        key={item.title}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.25,
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: 'rgba(15, 23, 42, 0.62)',
                          border: '1px solid rgba(245, 158, 11, 0.32)',
                        }}
                      >
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24' }}>
                          {item.icon}
                        </Avatar>
                        <Box>
                          <Typography sx={{ color: 'white', fontWeight: 900 }}>{item.title}</Typography>
                         
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </SectionCard>

          </Box>

          <SectionCard
            id="student-how-it-works-percentiles"
            icon={<MilitaryTechIcon />}
            title="Understanding Percentiles"
            subtitle="A percentile tells you where you stand compared to other students who took the same exam."
          >
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.65, mb: 1.5, ...justifiedTextSx }}>
              It is like your rank in a group. The higher your percentile, the better you performed compared to others.
            </Typography>
            <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', mb: 1 }}>
              Example
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.65, mb: 1.5, ...justifiedTextSx }}>
              Imagine 100 students took the exam. A 90th percentile means you did better than 90 students - only 10
              scored higher. A 75th percentile means you did better than 75. A 50th percentile means you are around
              the middle.
            </Typography>
            <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', mb: 1 }}>
              Remember
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.65, mb: 1.5, ...justifiedTextSx }}>
              A percentile does not tell you how many questions you got right. It tells you how well you performed
              compared to other students.
            </Typography>
            <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.05rem', mb: 1.5 }}>
              Achievement Tier Badges
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.68)', lineHeight: 1.6, mb: 2, ...justifiedTextSx }}>
              These badges come from percentile bands after the core reasoning results are ready for your class.
              A badge is useful, but remember that the real win is understanding your strengths and improving step by step.
            </Typography>
            <TableContainer component={Box} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderSx}>Percentile</TableCell>
                    <TableCell sx={tableHeaderSx}>Badge</TableCell>
                    <TableCell sx={tableHeaderSx}>Meaning</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {percentileRows.map((row) => (
                    <TableRow key={row.badge}>
                      <TableCell sx={tableCellSx}>{row.percentile}</TableCell>
                      <TableCell sx={{ ...tableCellSx, color: 'white', fontWeight: 900 }}>{row.badge}</TableCell>
                      <TableCell sx={tableCellSx}>{row.meaning}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, my: 3, alignItems: 'stretch' }}>
            <SectionCard
              sx={{ height: '100%' }}
              id="student-how-it-works-adaptive"
              icon={<AutoAwesomeIcon />}
              title="Exams Personalized to Your Level"
              subtitle="Your GYS exam adjusts as you go to match your skill level."
            >
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <MiniCard
                  icon={<RocketLaunchIcon fontSize="small" />}
                  title="How to Approach an Adaptive Exam"
                  body="In an adaptive exam, every question is compulsory, so make sure you answer them all. Leaving a question unanswered is more harmful than answering it incorrectly, because unanswered questions receive penalty points, which can lower your final score. If you are unsure of an answer, make your best guess and move on. Do not spend too much time on one question, or you may run out of time to complete the exam."
                  color="#06b6d4"
                />
                <MiniCard
                  icon={<AutoAwesomeIcon fontSize="small" />}
                  title="Stay confident as it gets harder"
                  body="As you answer correctly, the exam will give you more difficult questions. Don't be worried if the questions become harder—it usually means you are doing well! Keep an eye on the timer, maintain a steady pace, and aim to attempt every question. The best strategy is to answer every question, manage your time wisely, and stay confident throughout the exam."
                  color="#38bdf8"
                />
              </Box>
            </SectionCard>

            <SectionCard
              sx={{ height: '100%' }}
              id="student-how-it-works-practice"
              icon={<QuizIcon />}
              title="Practice Exams"
              subtitle="Practice helps you learn the format without changing your official score, badge, or leaderboard rank."
            >
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <MiniCard
                  icon={<QuizIcon fontSize="small" />}
                  title="Same level, no score pressure"
                  body="Practice matches your real unlocked or current level and does not affect official results, percentiles, achievement tiers, or leaderboard rank."
                  color="#38bdf8"
                />
                <MiniCard
                  icon={<TimelineIcon fontSize="small" />}
                  title="Separate question pool"
                  body="Practice draws from its own question bank. You build confidence and learn the format without repeating items from your official attempt."
                  color="#10b981"
                />
              
                <MiniCard
                  icon={<AutoAwesomeIcon fontSize="small" />}
                  title="Practice as many times as you want"
                  body="You can retry practice exams, attempt the same questions again, and review the solutions whenever you like."
                  color="#8b5cf6"
                />
              </Box>
            </SectionCard>
          </Box>

          <SectionCard
            id="student-how-it-works-gamification"
            icon={<MonetizationOnIcon />}
            title="Argus Coins & Daily Rewards"
            subtitle="Earn coins as you learn, build streaks for bonus rewards, and redeem them in the Rewards Shop."
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5, mb: 2.5 }}>
              <MiniCard
                icon={<WbTwilightIcon fontSize="small" />}
                title="Question of the Day"
                body="One fresh challenge every day from your practice bank. Answer once per day to earn coins  -  20 for a correct answer, 5 for trying."
                color="#f59e0b"
              />
              <MiniCard
                icon={<LocalFireDepartmentIcon fontSize="small" />}
                title="Login & QoD streaks"
                body="Visit GYS daily to grow your login streak. Answer the Question of the Day on consecutive days to build a QoD streak. Hit 7- and 30-day milestones for bonus coins."
                color="#ef4444"
              />
              <MiniCard
                icon={<MonetizationOnIcon fontSize="small" />}
                title="How you earn coins"
                body="Official exams award 60 base coins plus up to 90 more based on your score. Weekly practice awards up to 30 base coins plus 4 per correct answer  -  once per week."
                color="#fde68a"
              />
              <MiniCard
                icon={<StorefrontIcon fontSize="small" />}
                title="Rewards Shop"
                body="Spend Argus Coins on streak freezes and gift cards from Amazon, Starbucks, Flipkart, and more. Redemptions are fulfilled manually by the GYS team."
                color="#a78bfa"
              />
            </Box>

            <TableContainer component={Box} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderSx}>Activity</TableCell>
                    <TableCell sx={tableHeaderSx}>Coins</TableCell>
                    <TableCell sx={tableHeaderSx}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { activity: 'Question of the Day (correct)', coins: '20', notes: 'Once per day' },
                    { activity: 'Question of the Day (attempted)', coins: '5', notes: 'Once per day if not correct' },
                    { activity: 'Official exam', coins: '60 + score bonus', notes: 'Up to 90 extra based on performance' },
                    { activity: 'Weekly practice', coins: '30 + per correct', notes: 'Once per week; all 10 questions; thoughtful timing required' },
                    { activity: '7-day streak milestone', coins: '50', notes: 'Login or QoD streak' },
                    { activity: '30-day streak milestone', coins: '250', notes: 'Login or QoD streak' },
                  ].map((row) => (
                    <TableRow key={row.activity}>
                      <TableCell sx={{ ...tableCellSx, color: 'white', fontWeight: 800 }}>{row.activity}</TableCell>
                      <TableCell sx={tableCellSx}>{row.coins}</TableCell>
                      <TableCell sx={tableCellSx}>{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.68)', mt: 2, lineHeight: 1.6, ...justifiedTextSx }}>
              Find your coin balance and streaks in the sidebar, take today&apos;s question from the dashboard or{' '}
              <Box component="span" sx={{ color: '#fde68a', fontWeight: 800 }}>Question of the Day</Box> page, and browse rewards under{' '}
              <Box component="span" sx={{ color: '#fde68a', fontWeight: 800 }}>Rewards Shop</Box>.
            </Typography>
          </SectionCard>

          <Typography
            sx={{
              mt: 5,
              mb: 4,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.78)',
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.12rem' },
            }}
          >
            Keep going - every exam, practice round, and completed level takes you closer to your goals!
          </Typography>

    </Box>
  );
};

const HowItWorksPage: React.FC = () => {
  return (
    <Sentry.ErrorBoundary beforeCapture={(scope) => scope.setTag('location', 'HowItWorksPage')}>
      <DashboardLayout>
        <HowItWorksContent />
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default HowItWorksPage;
