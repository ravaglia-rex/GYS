import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import * as Sentry from '@sentry/react';
import {
  AutoAwesome as AutoAwesomeIcon,
  EmojiEvents as EmojiEventsIcon,
  HelpOutline as HelpOutlineIcon,
  MilitaryTech as MilitaryTechIcon,
  Psychology as PsychologyIcon,
  Quiz as QuizIcon,
  QueryStats as QueryStatsIcon,
  RocketLaunch as RocketLaunchIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ASSESSMENT_NAMES, LEVEL_CLEAR_THRESHOLD_LABEL, MEMBERSHIP_LEVEL_LABELS } from '../../utils/assessmentGating';
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
};

const tableHeaderSx = {
  ...tableCellSx,
  color: 'white',
  fontWeight: 800,
  bgcolor: 'rgba(15, 23, 42, 0.8)',
};

const gradeTableFirstColumnSx = {
  minWidth: 150,
  whiteSpace: 'nowrap',
};

type SectionCardProps = {
  id?: string;
  icon: React.ReactElement;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const SectionCard: React.FC<SectionCardProps> = ({ id, icon, title, subtitle, children }) => (
  <Paper id={id} data-tutorial-id={id} sx={{ ...glassPanelSx, p: { xs: 2.25, md: 3 } }}>
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
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.15 }}>
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography sx={{ display: { xs: 'block', sm: 'none' }, color: 'rgba(255, 255, 255, 0.68)', mt: 1.5, lineHeight: 1.6 }}>
          {subtitle}
        </Typography>
      )}

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
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
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.15 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.68)', mt: 0.75, lineHeight: 1.6 }}>
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
    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.55 }}>
      {body}
    </Typography>
  </Box>
);

const FlowStep: React.FC<{ step: string; title: string; body: React.ReactNode; color: string }> = ({
  step,
  title,
  body,
  color,
}) => (
  <Box
    sx={{
      p: 2.25,
      borderRadius: 2,
      bgcolor: 'rgba(15, 23, 42, 0.62)',
      border: `1px solid ${color}66`,
      overflow: 'hidden',
      minHeight: 156,
    }}
  >
    <Typography
      sx={{
        float: 'right',
        ml: 1.5,
        mb: 0.5,
        mt: -0.75,
        width: 56,
        textAlign: 'right',
        color: `${color}33`,
        fontWeight: 900,
        fontSize: '4.4rem',
        lineHeight: 0.9,
      }}
    >
      {step}
    </Typography>
    <Typography sx={{ color, fontWeight: 900, mb: 0.75 }}>{title}</Typography>
    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.55 }}>
      {body}
    </Typography>
  </Box>
);

const journeySteps = [
  {
    step: '1',
    title: 'Start Here',
    body: 'Your dashboard shows the exams you can take today. Results show your performance and progress.',
    color: '#8b5cf6',
  },
  {
    step: '2',
    title: 'Answer carefully',
    body: 'The system uses your responses to choose helpful next questions and understand your true level.',
    color: '#06b6d4',
  },
  {
    step: '3',
    title: 'Complete levels',
    body: (
      <>
        Exams have levels. A level is completed when you score <Box component="span" sx={{ fontWeight: 900 }}>{LEVEL_CLEAR_THRESHOLD_LABEL}</Box> or higher. You can attempt a level once every <Box component="span" sx={{ fontWeight: 900 }}>3 months</Box>.
      </>
    ),
    color: '#10b981',
  },
  {
    step: '4',
    title: 'Unlock the next goal',
    body: 'Attempting exams and completing levels unlock next steps: insights, reports, better comparisons, and much more!',
    color: '#f59e0b',
  },
];

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
    exams: ['Pattern and Logic', 'Verbal Reasoning', 'Mathematical Reasoning', 'English Proficiency', 'AI Proficiency'],
  },
  {
    level: 4,
    exams: [
      'Pattern and Logic',
      'Verbal Reasoning',
      'Mathematical Reasoning',
      'English Proficiency',
      'AI Proficiency',
      'Comprehensive Personality',
      'Interest & Career Discovery',
    ],
  },
];

const packageRoadmapColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const gradeRows = [
  {
    grades: 'Classes 6-7',
    comparisonLevel: 'Level 1',
    clearanceBand: 'Classes 6-8',
    childCopy: 'Your tier and ranking is decided based on your Level 1 performance only. Other levels do not affect it, but you can take them.',
  },
  {
    grades: 'Classes 8-9',
    comparisonLevel: 'Level 2',
    clearanceBand: 'Classes 6-8 for class 8, Classes 9-10 for class 9',
    childCopy: 'Your tier and ranking is decided based on your Level 2 performance only. Other levels do not affect it, but you can take them.',
  },
  {
    grades: 'Classes 10-12',
    comparisonLevel: 'Level 3',
    clearanceBand: 'Classes 9-10 for class 10, Classes 11-12 for classes 11-12',
    childCopy: 'Your tier and ranking is decided based on your Level 3 performance only. Lower levels do not affect it, but you need to take them to unlock this level.',
  },
];

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

const examOrder = [
  ASSESSMENT_NAMES.symbolic_reasoning,
  ASSESSMENT_NAMES.verbal_reasoning,
  ASSESSMENT_NAMES.mathematical_reasoning,
  ASSESSMENT_NAMES.english_proficiency,
  ASSESSMENT_NAMES.ai_literacy,
  ASSESSMENT_NAMES.comprehensive_personality,
  ASSESSMENT_NAMES.career_interest_inventory,
];

export const HowItWorksContent: React.FC = () => {
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
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
                  <HelpOutlineIcon sx={{ fontSize: 30 }} />
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
                  How GYS Works
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ ...studentPageSubtitleSx, display: { xs: 'block', sm: 'none' }, mt: 2, lineHeight: 1.65 }}>
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
                  <HelpOutlineIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      ...studentPageTitleSx,
                    }}
                  >
                    How GYS Works
                  </Typography>
                  <Typography variant="h6" sx={{ ...studentPageSubtitleSx, lineHeight: 1.65 }}>
                    Think of GYS like a learning adventure map! You take exams, complete levels, unlock the next challenge,
                    and see how your skills grow compared with students in your class.
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 3 }}>
              {['Exam levels', 'Achievement tiers', 'Class levels', 'Adaptive exams', 'Progress', 'Leaderboards', 'Percentiles'].map((label) => (
                <Chip
                  key={label}
                  label={label}
                  sx={{
                    color: '#e0f2fe',
                    bgcolor: 'rgba(14, 165, 233, 0.16)',
                    border: '1px solid rgba(125, 211, 252, 0.35)',
                    fontWeight: 700,
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box
            id="student-how-it-works-map"
            data-tutorial-id="student-how-it-works-map"
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}
          >
            {journeySteps.map((item) => (
              <FlowStep key={item.step} {...item} />
            ))}
          </Box>

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
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.76)', lineHeight: 1.6 }}>
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
                        textAlign: { xs: 'left', md: detailsOnLeft ? 'left' : 'right' },
                        zIndex: 1,
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 900, lineHeight: 1.2 }}>
                          {MEMBERSHIP_LEVEL_LABELS[row.level]}
                        </Typography>
                        <Typography variant="caption" sx={{ color, fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.45 }}>
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
              id="student-how-it-works-class-levels"
              icon={<SchoolIcon />}
              title="Compete within your class"
              subtitle="Your standing depends on your level, which is decided by your class."
            >
              <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
                {gradeRows.map((row) => (
                  <Box
                    key={row.grades}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(15, 23, 42, 0.52)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1rem', mb: 0.75 }}>
                      {row.grades}
                    </Typography>
                    <Typography sx={{ color: '#93c5fd', fontWeight: 800, fontSize: '0.95rem', mb: 1.25 }}>
                      {row.comparisonLevel}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.76)', lineHeight: 1.55 }}>
                      {row.childCopy}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <TableContainer component={Box} sx={{ display: { xs: 'none', sm: 'block' }, borderRadius: 2, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...tableHeaderSx, ...gradeTableFirstColumnSx }}>Your class</TableCell>
                      <TableCell sx={tableHeaderSx}>Your expected level</TableCell>
                      <TableCell sx={tableHeaderSx}>What this means</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gradeRows.map((row) => (
                      <TableRow key={row.grades}>
                        <TableCell sx={{ ...tableCellSx, ...gradeTableFirstColumnSx, color: 'white', fontWeight: 800 }}>{row.grades}</TableCell>
                        <TableCell sx={tableCellSx}>{row.comparisonLevel}</TableCell>
                        <TableCell sx={tableCellSx}>{row.childCopy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>

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
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.55 }}>
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
                    textAlign: 'center',
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
                      maxWidth: 100,
                      bgcolor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 999,
                      px: 1.5,
                      py: 0.75,
                      color: 'rgba(255,255,255,0.72)',
                      fontWeight: 800,
                    }}
                  >
                    Built on your results
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
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.55 }}>
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
            title="Achievement Tier Badges"
            subtitle="These badges come from percentile bands after the core reasoning results are ready for your class. A badge is useful, but remember that the real win is understanding your strengths and improving step by step."
          >
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, my: 3 }}>
            <SectionCard
              id="student-how-it-works-adaptive"
              icon={<AutoAwesomeIcon />}
              title="Adaptive Exams"
              subtitle="Adaptive exams try to measure your real skill without wasting too much time on questions that are far too easy or far too hard."
            >
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <MiniCard
                  icon={<RocketLaunchIcon fontSize="small" />}
                  title="How your answers guide the exam"
                  body="Correct answers may move the next question toward a stronger skill level, while missed questions may check the foundation to find where help is needed."
                  color="#10b981"
                />
                <MiniCard
                  icon={<PsychologyIcon fontSize="small" />}
                  title="Retake a level every 3 months"
                  body="On adaptive exams, you can retake the same level every 3 months to show growth and refresh your official progress."
                  color="#f59e0b"
                />
              </Box>
            
            </SectionCard>

            <SectionCard
              id="student-how-it-works-practice"
              icon={<QuizIcon />}
              title="Practice Exams"
              subtitle="Practice helps you learn the format without changing your official score, badge, or leaderboard rank. Your practice exam level matches your real exam level."
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mb: 2 }}>
                <MiniCard
                  icon={<QuizIcon fontSize="small" />}
                  title="Same level, no score pressure"
                  body="Practice matches your real unlocked or current level and does not affect official results, percentiles, achievement tiers, or leaderboard rank."
                  color="#38bdf8"
                />
                <MiniCard
                  icon={<AutoAwesomeIcon fontSize="small" />}
                  title="Practice as many times as you want"
                  body="You can retry practice exams, attempt the same questions again, and review the solutions."
                  color="#8b5cf6"
                />
              </Box>
             
            </SectionCard>
          </Box>

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
