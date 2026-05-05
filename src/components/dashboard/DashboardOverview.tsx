import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Avatar, Badge } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  School, 
  CheckCircle, 
  Clock,
  Target,
  BarChart3,
  Lock,
} from 'lucide-react';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { auth } from '../../firebase/firebase';
import { getStudent } from '../../db/studentCollection';
import { getSchoolDetails } from '../../db/schoolCollection';
import { getPayments } from '../../db/studentPaymentMappings';
import {
  normalizeMembershipLevel,
  membershipLevelForAssessmentGate,
  NON_COMPETITIVE_CHART_ASSESSMENT_IDS,
  DASHBOARD_CHART_EXAM_IDS,
  ASSESSMENT_NAMES,
  EXAM_MAX_SCORE_POINTS,
  tierPercentToExamPoints,
  type AssessmentChartRow,
} from '../../utils/assessmentGating';
import {
  ACHIEVEMENT_TIER_EXPLORER,
  formatAchievementTierLabel,
  normalizeAchievementTierId,
} from '../../utils/achievementTier';
import { MEMBERSHIP_LEVEL_LABEL } from '../../utils/studentMembershipPricing';

export type { AssessmentChartRow } from '../../utils/assessmentGating';

const CHART_FALLBACK_EXAMS: AssessmentChartRow[] = DASHBOARD_CHART_EXAM_IDS.map((id) => ({
  subject: ASSESSMENT_NAMES[id] ?? id,
  score: 0,
  assessmentId: id,
  locked: true,
}));

/**
 * When the student doc has no level, infer tier from last payment (GST-inclusive totals).
 * Rev 13 list + GST: ~₹353 / ~₹1,061 / ~₹2,123 / ~₹3,185; legacy tiers ~₹589 / ~₹1,533 / ~₹2,949 / ~₹3,185.
 */
function membershipLabelFromPaymentAmountInr(amount: number): string {
  if (amount >= 2700) return MEMBERSHIP_LEVEL_LABEL[4];
  if (amount >= 1900) return MEMBERSHIP_LEVEL_LABEL[3];
  if (amount >= 1200) return MEMBERSHIP_LEVEL_LABEL[2];
  return `${MEMBERSHIP_LEVEL_LABEL[1]} • ₹299`;
}

/** Program assessments: chart score 0–100 from latest attempt (or legacy best); labels show points out of {@link EXAM_MAX_SCORE_POINTS}. */
const ColumnChart: React.FC<{ data: AssessmentChartRow[] }> = ({ data }) => {
  const programBarPalette = [
    '#5eead4', '#93c5fd', '#fcd34d', '#f9a8d4', '#c4b5fd', '#67e8f9', '#86efac', '#fca5a5',
  ];

  const rows = data?.length === 5 ? data : CHART_FALLBACK_EXAMS;

  const dataWithPoints = rows.map((item, index) => {
    const locked = item.locked === true;
    const tierPct = locked ? 0 : Math.max(0, Math.min(100, Math.round(item.score)));
    const points = locked ? 0 : tierPercentToExamPoints(tierPct);
    const isNonCompetitive =
      !locked &&
      !!item.assessmentId &&
      NON_COMPETITIVE_CHART_ASSESSMENT_IDS.has(item.assessmentId);
    return {
      ...item,
      points,
      barColor: programBarPalette[index % programBarPalette.length],
      isNonCompetitive,
    };
  });

  const chartMax = EXAM_MAX_SCORE_POINTS;
  /** Total vertical slot for the chart column (must match Y-axis height). */
  const BAR_AREA_PX = 260;
  /** Fixed band for the score text + margin so tall bars never overflow into the level label below. */
  const SCORE_LABEL_BAND_PX = 44;
  const SCORE_TO_BAR_GAP_PX = 4;
  /** Pixel height available for the colored bar (proportional to score). */
  const BAR_SCALE_HEIGHT = BAR_AREA_PX - SCORE_LABEL_BAND_PX - SCORE_TO_BAR_GAP_PX;
  const BAR_WIDTH_PX = 72;
  /** Keeps exam titles aligned when a column has no Level row (locked / empty meta). */
  const LEVEL_META_ROW_MIN_PX = 30;

  const baseTicks = [1000, 750, 500, 250, 0];
  const topTick = chartMax <= 1000 ? [chartMax] : [];
  const ticks = Array.from(new Set([...topTick, ...baseTicks].filter((v) => v <= chartMax))).sort((a, b) => b - a);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, width: '100%', overflow: 'hidden' }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
        Latest level score by assessment (out of {EXAM_MAX_SCORE_POINTS})
      </Typography>
      <Box sx={{ width: '100%', pb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            gap: 0,
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Y-axis: tick band height must match BAR_SCALE_HEIGHT so 0–1000 aligns with bar pixels (not the full column). */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 36,
              flexShrink: 0,
              height: BAR_AREA_PX,
              pr: 0.5,
            }}
          >
            <Box
              sx={{ flexShrink: 0, height: SCORE_LABEL_BAND_PX + SCORE_TO_BAR_GAP_PX }}
              aria-hidden
            />
            <Box
              sx={{
                position: 'relative',
                flexShrink: 0,
                height: BAR_SCALE_HEIGHT,
                width: '100%',
              }}
            >
              {ticks.map((value) => {
                const pct = Math.max(0, Math.min(100, (value / chartMax) * 100));
                return (
                  <Typography
                    key={`tick-${value}`}
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: `${pct}%`,
                      right: 0,
                      transform: 'translateY(50%)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.7rem',
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </Typography>
                );
              })}
            </Box>
          </Box>

          {/* Bars + labels (assessment names below bars, not on the bars) */}
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: 0.5,
              minHeight: BAR_AREA_PX + 96,
              py: 0,
              minWidth: 0,
            }}
          >
            {dataWithPoints.map((item, index) => {
              const locked = item.locked === true;
              const barHeight = item.isNonCompetitive
                ? Math.round(BAR_SCALE_HEIGHT * 0.88)
                : Math.min(
                    BAR_SCALE_HEIGHT,
                    Math.max(4, (item.points / chartMax) * BAR_SCALE_HEIGHT)
                  );
              const color = item.barColor ?? programBarPalette[index % programBarPalette.length];

              return (
                <Box
                  key={index}
                  sx={{
                    flex: '1 1 0',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: BAR_AREA_PX,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {locked ? (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        aria-label="Locked"
                      >
                        <Lock size={28} color="rgba(255, 255, 255, 0.38)" strokeWidth={2} aria-hidden />
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ flex: 1, minHeight: 0, width: '100%' }} aria-hidden />
                        <Box
                          sx={{
                            width: '100%',
                            height: SCORE_LABEL_BAND_PX,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: `${SCORE_TO_BAR_GAP_PX}px`,
                            gap: 0.25,
                            boxSizing: 'border-box',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: item.isNonCompetitive ? 'rgba(255,255,255,0.75)' : 'white',
                              fontWeight: 700,
                              fontSize: item.isNonCompetitive ? '0.72rem' : '0.8rem',
                              lineHeight: 1.2,
                              textAlign: 'center',
                              px: 0.25,
                            }}
                          >
                            {item.isNonCompetitive ? 'Completed' : `${item.points}`}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: BAR_WIDTH_PX,
                            maxWidth: '100%',
                            backgroundColor: color,
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.3s ease',
                            boxShadow: `0 4px 14px ${color}55`,
                            flexShrink: 0,
                          }}
                          style={{ height: `${barHeight}px` }}
                        />
                      </>
                    )}
                  </Box>
                  <Box
                    sx={{
                      mt: 0.75,
                      minHeight: LEVEL_META_ROW_MIN_PX,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {!locked && !item.isNonCompetitive && item.chartLevel != null && (
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{
                          px: 0.5,
                          textAlign: 'center',
                          color: 'rgba(147, 197, 253, 0.95)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          width: '100%',
                          lineHeight: 1.25,
                        }}
                      >
                        Level {item.chartLevel}
                      </Typography>
                    )}
                    {!locked && !item.isNonCompetitive && item.chartScoreIsBestFallback && (
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{
                          px: 0.5,
                          textAlign: 'center',
                          color: 'rgba(148, 163, 184, 0.95)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          width: '100%',
                          lineHeight: 1.25,
                        }}
                      >
                        Best overall
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      mt: 1.5,
                      px: 0.75,
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.88)',
                      fontSize: { xs: '0.72rem', sm: '0.78rem' },
                      lineHeight: 1.35,
                      width: '100%',
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      overflowWrap: 'break-word',
                      hyphens: 'none',
                    }}
                  >
                    {item.subject}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export interface DashboardOverviewPreviewProfile {
  userName: string;
  grade: number;
  schoolName: string;
  membershipLevel: string;
  membershipExpiry: string;
  /** Achievement band (`explorer`, `bronze`, `silver`, `gold`). Defaults to Explorer when omitted. */
  achievementTierId?: string;
}

interface DashboardOverviewProps {
  stats: {
    totalAssessments: number;
    completedAssessments: number;
    averageScore: number;
    availableAssessments: number;
  };
  latestAssessmentResults?: AssessmentChartRow[];
  /** @deprecated Explorer is now the canonical default achievement tier from the student profile. */
  defaultEntryTier?: boolean;
  /** Static profile - skips Firestore; use with sample / preview dashboards */
  previewProfile?: DashboardOverviewPreviewProfile;
  /** When set with previewProfile, stat-card clicks navigate here instead of live assessment routes */
  previewNavTargets?: { available: string; completed: string; sampleAssessmentExitTo?: string };
  /** Preview only: “Results Available” and “Assessments Available” stats are non-interactive */
  previewDisableAssessmentStatClicks?: boolean;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  trend?: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, trend, onClick }) => (
  <Card 
    onClick={onClick}
    sx={{
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      cursor: onClick ? 'pointer' : 'default',
      ...(onClick
        ? {
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
              borderColor: `${color}40`,
            },
          }
        : {
            '&:hover': {
              transform: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          }),
    }}
  >
    <CardContent sx={{ p: 3, textAlign: 'left' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            background: `linear-gradient(135deg, ${color}20, ${color}40)`,
            color: color,
            border: `2px solid ${color}30`,
          }}
        >
          {icon}
        </Avatar>
        {trend && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            backgroundColor: `${color}20`,
            color: color,
            ml: 1,
          }}>
            <TrendingUp size={16} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {trend}
            </Typography>
          </Box>
        )}
      </Box>

      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
        {title}
      </Typography>
    </CardContent>
  </Card>
);

// Function to generate dynamic notifications based on the rules
const generateDynamicNotifications = (
  availableAssessmentsCount: number,
  resultsAvailableCount: number
) => {
  const notifications = [];
  const now = new Date();

  // Rule 1: If number of assessments available is not 0, show "New Assessment Available"
  if (availableAssessmentsCount > 0) {
    notifications.push({
      id: 'new-assessment-available',
      type: 'info',
      title: 'New Assessment Available',
      message: `You have ${availableAssessmentsCount} new assessment${availableAssessmentsCount > 1 ? 's' : ''} available to take. Check the assessments section to get started.`,
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      color: '#8b5cf6'
    });
  }

  // Rule 2: If number of results available is 2, show 2 different notifications
  if (resultsAvailableCount === 2) {
    notifications.push({
      id: 'challenge-assessment-result',
      type: 'success',
      title: 'Challenge Assessment Evaluated',
      message: 'Your challenge assessment has been evaluated and results are now available. Check your performance analysis.',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      color: '#10b981'
    });

    notifications.push({
      id: 'assessment-analysis-ready',
      type: 'info',
      title: 'Analysis Complete',
      message: 'Your detailed assessment analysis is ready for review. Discover your strengths and areas for improvement.',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      color: '#3b82f6'
    });
  }

  if (resultsAvailableCount === 1) {
    notifications.push({
      id: 'qualifying-assessment-result',
      type: 'success',
      title: 'Qualifying Assessment Result Available',
      message: 'Your qualifying assessment has been evaluated and results are now available. View your performance and next steps.',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      color: '#10b981'
    });
  }

  return notifications;
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  latestAssessmentResults = [],
  defaultEntryTier: _defaultEntryTier = true,
  previewProfile,
  previewNavTargets,
  previewDisableAssessmentStatClicks = false,
}) => {
  const navigate = useNavigate();
  const [, setIsNavigating] = useState(false);
  const [userName, setUserName] = useState<string>('Student');
  const [loading, setLoading] = useState<boolean>(true);
  const [studentGrade, setStudentGrade] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [membershipLevel, setMembershipLevel] = useState<string | null>(null);
  const [membershipExpiry, setMembershipExpiry] = useState<string | null>(null);
  const [achievementTierId, setAchievementTierId] = useState<string>(ACHIEVEMENT_TIER_EXPLORER);

  // Generate notifications based on stats
  const notifications = generateDynamicNotifications(stats.availableAssessments, stats.completedAssessments);

  useEffect(() => {
    if (previewProfile) {
      setUserName(previewProfile.userName);
      setStudentGrade(previewProfile.grade);
      setSchoolName(previewProfile.schoolName);
      setMembershipLevel(previewProfile.membershipLevel);
      setMembershipExpiry(previewProfile.membershipExpiry);
      setAchievementTierId(normalizeAchievementTierId(previewProfile.achievementTierId));
      setLoading(false);
      return;
    }
    const fetchUserName = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userData = await getStudent(auth.currentUser.uid);
          setAchievementTierId(normalizeAchievementTierId(userData?.achievement_tier as string | undefined));
          if (userData?.first_name) {
            setUserName(userData.first_name.charAt(0).toUpperCase() + userData.first_name.slice(1).toLowerCase());
          }
          if (userData?.grade) {
            setStudentGrade(userData.grade);
          }
          if (userData?.school_id) {
            try {
              const name = await getSchoolDetails(userData.school_id);
              if (name && typeof name === 'string') setSchoolName(name);
            } catch {}
          }

          // Derive membership level + expiry from payments, fall back to account creation date
          const levelMap: Record<string, string> = {
            LEVEL_1: MEMBERSHIP_LEVEL_LABEL[1],
            LEVEL_2: MEMBERSHIP_LEVEL_LABEL[2],
            LEVEL_3: MEMBERSHIP_LEVEL_LABEL[3],
            LEVEL_4: MEMBERSHIP_LEVEL_LABEL[4],
          };
          const rawLevel =
            userData?.membership_level ?? userData?.plan_level ?? null;
          const levelFromStudent: string | number | null =
            typeof rawLevel === 'number' ? normalizeMembershipLevel(rawLevel) : rawLevel;
          const levelNum =
            typeof levelFromStudent === 'number'
              ? levelFromStudent
              : typeof levelFromStudent === 'string' && /^LEVEL_[1234]$/.test(levelFromStudent)
                ? Number(levelFromStudent.replace('LEVEL_', ''))
                : null;
          /** Tier for badge copy: institutional floor (e.g. Premium school) can show Reasoning + Skills when applicable. */
          const tierForBadge = membershipLevelForAssessmentGate(
            userData as { membership_level?: number | null; assessment_gate_membership_level?: number | null }
          );

          const resolveExpiry = (baseDate: Date) => {
            baseDate.setFullYear(baseDate.getFullYear() + 1);
            return baseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          };

          const creationExpiry = () => {
            const t = auth.currentUser?.metadata?.creationTime;
            return t ? resolveExpiry(new Date(t)) : null;
          };

          try {
            const payments = await getPayments(auth.currentUser.uid);
            // Use any payment regardless of status - take the most recent by paid_on
            const sorted = [...payments].sort(
              (a, b) => new Date(b.paid_on).getTime() - new Date(a.paid_on).getTime()
            );

            if (sorted.length > 0) {
              const latest = sorted[0];
              // Determine level: student doc field > amount heuristic
              if (levelFromStudent != null && levelFromStudent !== '') {
                if (typeof levelFromStudent === 'number' && levelFromStudent >= 1 && levelFromStudent <= 4) {
                  setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1'] ?? `Level ${tierForBadge}`);
                } else {
                  setMembershipLevel(levelMap[levelFromStudent as keyof typeof levelMap] ?? String(levelFromStudent));
                }
              } else {
                setMembershipLevel(membershipLabelFromPaymentAmountInr(latest.amount));
              }
              const baseDate = new Date(latest.paid_on);
              setMembershipExpiry(
                !isNaN(baseDate.getTime()) ? resolveExpiry(baseDate) : creationExpiry()
              );
            } else {
              // No payments - default new students to Level 1; respect explicit level on student doc
              if (levelFromStudent != null && levelFromStudent !== '') {
                if (typeof levelFromStudent === 'number' && levelFromStudent >= 1 && levelFromStudent <= 4) {
                  setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1'] ?? `Level ${tierForBadge}`);
                } else {
                  setMembershipLevel(levelMap[levelFromStudent as keyof typeof levelMap] ?? String(levelFromStudent));
                }
              } else if (levelNum != null && levelNum >= 1 && levelNum <= 4) {
                setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1']);
              } else {
                setMembershipLevel(MEMBERSHIP_LEVEL_LABEL[1]);
              }
              setMembershipExpiry(creationExpiry());
            }
          } catch {
            if (levelFromStudent != null && levelFromStudent !== '') {
              if (typeof levelFromStudent === 'number' && levelFromStudent >= 1 && levelFromStudent <= 4) {
                setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1'] ?? `Level ${tierForBadge}`);
              } else {
                setMembershipLevel(levelMap[levelFromStudent as keyof typeof levelMap] ?? String(levelFromStudent));
              }
            } else if (levelNum != null && levelNum >= 1 && levelNum <= 4) {
              setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1']);
            } else {
              setMembershipLevel(MEMBERSHIP_LEVEL_LABEL[1]);
            }
            setMembershipExpiry(creationExpiry());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to Firebase displayName or 'Student'
          const fallbackName = auth.currentUser?.displayName?.split(' ')[0];
          setUserName(fallbackName ? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1).toLowerCase() : 'Student');
        }
      }
      setLoading(false);
    };

    fetchUserName();
  }, [previewProfile]);

  const handleNavigation = (path: string) => {
    if (previewNavTargets) {
      if (path === '/assessments/available') {
        const exitTo = previewNavTargets.sampleAssessmentExitTo;
        navigate(
          previewNavTargets.available,
          exitTo ? { state: { sampleAssessmentExitTo: exitTo } } : undefined
        );
      } else if (path === '/assessments/completed') navigate(previewNavTargets.completed);
      return;
    }
    setIsNavigating(true);

    setTimeout(() => {
      try {
        navigate(path);
      } catch {
        window.location.href = path;
      }
    }, 150);
  };

  const getDisplayResults = () => {
    if (latestAssessmentResults.length === 5) {
      return { data: latestAssessmentResults };
    }
    return { data: CHART_FALLBACK_EXAMS };
  };

  const displayResults = getDisplayResults();

  const showStudentMeta =
    !loading &&
    (studentGrade || schoolName || membershipLevel || membershipExpiry || achievementTierId);

  const tierLabel = formatAchievementTierLabel(achievementTierId);
  const tierEmoji =
    tierLabel === 'Explorer'
      ? '🧭'
      : tierLabel === 'Bronze'
        ? '🥉'
        : tierLabel === 'Silver'
          ? '🥈'
          : tierLabel === 'Gold'
            ? '🥇'
            : tierLabel === 'Platinum'
              ? '✦'
              : tierLabel === 'Diamond'
                ? '💎'
                : '🏅';

  const tierChipSx =
    tierLabel === 'Explorer'
      ? { bgcolor: '#F0E9F8', border: '1px solid #D1C4E9', color: '#5E35B1' }
      : tierLabel === 'Bronze'
        ? { bgcolor: '#ffe4d6', border: '1px solid #ea580c', color: '#b5561c' }
        : tierLabel === 'Silver'
          ? { bgcolor: '#f3f4f6', border: '1px solid #9ca3af', color: '#374151' }
          : tierLabel === 'Gold'
            ? { bgcolor: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309' }
            : tierLabel === 'Platinum'
              ? { bgcolor: '#e0f2fe', border: '1px solid #38bdf8', color: '#0369a1' }
              : tierLabel === 'Diamond'
                ? { bgcolor: '#ede9fe', border: '1px solid #a78bfa', color: '#5b21b6' }
                : { bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', color: '#e2e8f0' };

  const tierBadge = showStudentMeta && (
    <Box sx={{ alignSelf: { xs: 'flex-end', sm: 'flex-start' }, flexShrink: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.35,
          mt: { sm: 0.25 },
          px: 1.5,
          py: 1,
          minWidth: 72,
          borderRadius: '16px',
          textAlign: 'center',
          ...tierChipSx,
        }}
      >
        <Typography component="span" aria-hidden sx={{ fontSize: '1.35rem', lineHeight: 1, color: 'inherit' }}>
          {tierEmoji}
        </Typography>
        <Typography
          component="span"
          sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.2, color: 'inherit' }}
        >
          {tierLabel}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ mb: 4, ml: 1 }}>
      {/* Welcome Section - title left, performance tier badge top-right */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 700,
              flex: { sm: '1 1 auto' },
              minWidth: 0,
              fontSize: '2.2rem',
              background: 'linear-gradient(45deg, #10b981, #3b82f6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            👋 Welcome to Your Dashboard, {loading ? 'Student' : userName}!
          </Typography>
          {tierBadge}
        </Box>

        {/* Grade / school / membership - below title row */}
        {showStudentMeta && (studentGrade || schoolName || membershipLevel || membershipExpiry) && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1.5,
              mt: 0.5,
              alignItems: 'center',
            }}
          >
            {(studentGrade || schoolName) && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.82rem', fontWeight: 500 }}>
                  {[studentGrade ? `Grade ${studentGrade}` : null, schoolName ?? null].filter(Boolean).join(' • ')}
                </Typography>
              </Box>
            )}
            {(membershipLevel || membershipExpiry) && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '20px',
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <Typography sx={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 500 }}>
                  {[membershipLevel ?? null, membershipExpiry ? `Active until ${membershipExpiry}` : null]
                    .filter(Boolean)
                    .join(' • ')}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 400, fontSize: '1.2rem' }}>
          Track your progress, manage assessments, and achieve your goals
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, 
        mb: 4 
      }}>
        <StatCard
          title="Total Assessments"
          value={stats.totalAssessments}
          icon={<School size={24} />}
          color="#3b82f6"
        />
        
        <StatCard
          title="Results Available"
          value={stats.completedAssessments}
          icon={<CheckCircle size={24} />}
          color="#10b981"
          onClick={
            previewDisableAssessmentStatClicks
              ? undefined
              : () => handleNavigation('/assessments/completed')
          }
        />
         <StatCard
          title="Assessments Available"
          value={stats.availableAssessments}
          icon={<Clock size={24} />}
          color="#8b5cf6"
          onClick={
            previewDisableAssessmentStatClicks
              ? undefined
              : () => handleNavigation('/assessments/available')
          }
        />
        
        <StatCard
          title="Ranking (Coming Soon!)"
          value="--"
          icon={<Target size={24} />}
          color="#f59e0b"
        />
      </Box>

      {/* Performance Overview and Notifications - Side by side */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
        gap: 3,
        mb: 3
      }}>
        {/* Performance Overview */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
              }}>
                <BarChart3 size={24} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
                  Performance Overview
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem' }}>
                  {displayResults.data.length > 0
                    ? `Latest score from your most recent attempt at each exam (out of ${EXAM_MAX_SCORE_POINTS}); level is shown under each bar. Profiles without attempt history yet show best overall. Non-scored programmes show completion only.`
                    : 'Performance data will appear here once your assessments are evaluated'}
                </Typography>
              </Box>
            </Box>

            {displayResults.data.length > 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ColumnChart data={displayResults.data} />
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <BarChart3 size={40} color="#8b5cf6" />
                </Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  No Results Available Yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 400 }}>
                  Complete your first assessment or wait for your completed assessments to be evaluated to see your performance breakdown and track your progress across different subjects.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Latest Notifications */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
                Latest Notifications
              </Typography>
              <Badge 
                badgeContent={notifications.length} 
                color="error"
                invisible={notifications.length === 0}
              >
                <NotificationsIcon sx={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.8)' }} />
              </Badge>
            </Box>
          
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No notifications at the moment. Check back later for updates.
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <Box
                    key={notification.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: `${notification.color}10`,
                      border: `1px solid ${notification.color}30`,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: notification.color, fontWeight: 600, mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {notification.message}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardOverview;
