import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Card, CardContent, Typography, Avatar, Badge, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  School, 
  CheckCircle, 
  Clock,
  BarChart3,
  Lock,
  Bell,
} from 'lucide-react';
import { Close as CloseIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { auth } from '../../firebase/firebase';
import { sendNotificationEmails } from '../../db/studentCollection';
import { usePayments, useSchoolDetails, useStudent } from '../../query/hooks';
import {
  normalizeMembershipLevel,
  membershipLevelForAssessmentGate,
  NON_COMPETITIVE_CHART_ASSESSMENT_IDS,
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
import {
  generateDashboardNotifications,
  getStalePeriodicDashboardNotificationIds,
  useDismissedDashboardNotificationIds,
  type DashboardNotificationEventSource,
  type CompletedAssessmentNotificationSource,
  type UnlockedAssessmentNotificationSource,
} from '../../utils/dashboardNotifications';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { readGamificationFromStudent, istDateStringClient } from '../../utils/gamification';
import QodDashboardCard from '../gamification/QodDashboardCard';
import CoinsLeaderboardWidget from './CoinsLeaderboardWidget';
import HowGysWorksImportantBanner from './HowGysWorksImportantBanner';

export type { AssessmentChartRow } from '../../utils/assessmentGating';

/**
 * When the student doc has no level, infer tier from last payment totals.
 * Rev 13 charged totals: ~₹353 / ~₹1,061 / ~₹2,123 / ~₹3,185; legacy tiers ~₹589 / ~₹1,533 / ~₹2,949 / ~₹3,185.
 */
function membershipLabelFromPaymentAmountInr(amount: number): string {
  if (amount >= 2700) return MEMBERSHIP_LEVEL_LABEL[4];
  if (amount >= 1900) return MEMBERSHIP_LEVEL_LABEL[3];
  if (amount >= 1200) return MEMBERSHIP_LEVEL_LABEL[2];
  return `${MEMBERSHIP_LEVEL_LABEL[1]} • ₹299`;
}

function formatFirstName(name: string | undefined | null): string | null {
  const firstName = name?.trim().split(/\s+/)[0];
  if (!firstName) return null;
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

function getFirebaseFirstName(): string {
  return formatFirstName(auth.currentUser?.displayName) ?? 'Student';
}

/** Program assessments: chart score 0–100 from latest attempt (or legacy best); labels show points out of {@link EXAM_MAX_SCORE_POINTS}. */
const ColumnChart: React.FC<{ data: AssessmentChartRow[] }> = ({ data }) => {
  const programBarPalette = [
    '#5eead4', '#93c5fd', '#fcd34d', '#f9a8d4', '#c4b5fd', '#67e8f9', '#86efac', '#fca5a5',
  ];

  const rows = data ?? [];

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
    <Box sx={{ p: { xs: 1.5, sm: 2 }, width: '100%', overflow: 'visible' }}>
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
                        mt: 1,
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
                        pb: 0.25,
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
  /** When set, profile header uses shared query cache instead of fetching again. */
  uid?: string;
  stats: {
    totalAssessments: number;
    completedAssessments: number;
    averageScore: number;
    availableAssessments: number;
  };
  latestAssessmentResults?: AssessmentChartRow[];
  completedAssessments?: CompletedAssessmentNotificationSource[];
  unlockedAssessments?: UnlockedAssessmentNotificationSource[];
  backendNotificationEvents?: DashboardNotificationEventSource[];
  /** @deprecated Explorer is now the canonical default achievement tier from the student profile. */
  defaultEntryTier?: boolean;
  /** Static profile - skips Firestore; use with sample / preview dashboards */
  previewProfile?: DashboardOverviewPreviewProfile;
  /** When set with previewProfile, stat-card clicks navigate here instead of live assessment routes */
  previewNavTargets?: { available: string; completed: string; sampleAssessmentExitTo?: string };
  /** Preview only: “Results Available” and “Assessments Available” stats are non-interactive */
  previewDisableAssessmentStatClicks?: boolean;
  /** Preview/sample dashboards should not write notification dismissals to persistent browser storage. */
  persistNotificationDismissals?: boolean;
  /** Preview only: mock gamification values for coins/streak widgets */
  previewGamification?: {
    argus_coins: number;
    login_streak: number;
    qod_streak: number;
    qod_answered_today?: boolean;
  };
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
    <CardContent
      sx={{
        p: { xs: 2, sm: 3 },
        textAlign: 'left',
        display: { xs: 'flex', sm: 'block' },
        alignItems: { xs: 'center', sm: 'initial' },
        gap: { xs: 1.75, sm: 0 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: { xs: 0, sm: 2 },
          flexShrink: 0,
        }}
      >
        <Avatar
          sx={{
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
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

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: { xs: '1.85rem', sm: '2.15rem' },
            lineHeight: 1,
            mb: { xs: 0.35, sm: 1 },
          }}
        >
          {value}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: { xs: '0.9rem', sm: '0.92rem' },
            lineHeight: 1.25,
            mb: { xs: 0, sm: 2 },
          }}
        >
          {title}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  uid,
  stats,
  latestAssessmentResults = [],
  completedAssessments = [],
  unlockedAssessments = [],
  backendNotificationEvents = [],
  defaultEntryTier: _defaultEntryTier = true,
  previewProfile,
  previewNavTargets,
  previewDisableAssessmentStatClicks = false,
  persistNotificationDismissals = true,
  previewGamification,
}) => {
  const navigate = useNavigate();
  const [, setIsNavigating] = useState(false);
  const [userName, setUserName] = useState<string>(() => getFirebaseFirstName());
  const [loading, setLoading] = useState<boolean>(true);
  const [studentGrade, setStudentGrade] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [membershipLevel, setMembershipLevel] = useState<string | null>(null);
  const [membershipExpiry, setMembershipExpiry] = useState<string | null>(null);
  const [achievementTierId, setAchievementTierId] = useState<string>(ACHIEVEMENT_TIER_EXPLORER);
  const [sessionDismissedNotificationIds, setSessionDismissedNotificationIds] = useState<Set<string>>(() => new Set());
  const notificationEmailSentRef = useRef<Set<string>>(new Set());
  const notificationListRef = useRef<HTMLDivElement | null>(null);
  const latestNotificationsSectionRef = useRef<HTMLDivElement | null>(null);
  const performanceOverviewRef = useRef<HTMLDivElement | null>(null);
  const [performanceOverviewHeight, setPerformanceOverviewHeight] = useState<number | null>(null);

  const useLiveProfile = Boolean(uid) && !previewProfile;
  const { data: userData, isLoading: studentQueryLoading } = useStudent(uid, useLiveProfile);

  const gamification = useMemo(() => {
    if (previewGamification) {
      return {
        argus_coins: previewGamification.argus_coins,
        coins_lifetime_earned: previewGamification.argus_coins,
        login_streak: { current: previewGamification.login_streak, longest: previewGamification.login_streak },
        qod_streak: { current: previewGamification.qod_streak, longest: previewGamification.qod_streak },
        qod_attempted_total: previewGamification.qod_streak,
        qod_correct_total: Math.max(0, previewGamification.qod_streak - 1),
        qod_accuracy_pct:
          previewGamification.qod_streak > 0
            ? Math.round((1000 * Math.max(0, previewGamification.qod_streak - 1)) / previewGamification.qod_streak) /
              10
            : 0,
        practice_sessions_total: 4,
        practice_questions_total: 40,
        practice_correct_total: 28,
        practice_accuracy_pct: 70,
        practice_coins_earned_total: 62,
        qod_last_answered_date: previewGamification.qod_answered_today ? istDateStringClient() : undefined,
      };
    }
    return readGamificationFromStudent(userData as Record<string, unknown> | undefined);
  }, [previewGamification, userData]);

  const schoolId =
    typeof userData?.school_id === 'string' && userData.school_id && userData.school_id !== 'not-listed'
      ? userData.school_id
      : undefined;
  const { data: schoolNameFromQuery } = useSchoolDetails(schoolId, useLiveProfile);
  const { data: payments = [] } = usePayments(uid, useLiveProfile);
  const [notificationScrollbar, setNotificationScrollbar] = useState({
    visible: false,
    top: 0,
    height: 0,
  });

  const { dismissedIds, dismissOne, dismissMany } = useDismissedDashboardNotificationIds();
  const allNotifications = useMemo(() => generateDashboardNotifications({
    availableAssessmentsCount: stats.availableAssessments,
    completedAssessments,
    unlockedAssessments,
    backendNotificationEvents,
  }), [backendNotificationEvents, completedAssessments, stats.availableAssessments, unlockedAssessments]);
  const autoDismissedPeriodicIds = useMemo(
    () => getStalePeriodicDashboardNotificationIds(allNotifications.map(n => n.id)),
    [allNotifications]
  );
  const activeDismissedIds = persistNotificationDismissals ? dismissedIds : sessionDismissedNotificationIds;
  const notifications = useMemo(
    () => allNotifications.filter(
      n => !activeDismissedIds.has(n.id) && !autoDismissedPeriodicIds.includes(n.id)
    ),
    [activeDismissedIds, allNotifications, autoDismissedPeriodicIds]
  );

  useEffect(() => {
    if (!persistNotificationDismissals || autoDismissedPeriodicIds.length === 0) return;
    const idsToDismiss = autoDismissedPeriodicIds.filter(id => !dismissedIds.has(id));
    if (idsToDismiss.length > 0) {
      dismissMany(idsToDismiss);
    }
  }, [autoDismissedPeriodicIds, dismissMany, dismissedIds, persistNotificationDismissals]);

  useEffect(() => {
    if (!persistNotificationDismissals || notifications.length === 0) return;

    const newIds = notifications
      .map((n) => n.id)
      .filter((id) => !notificationEmailSentRef.current.has(id));
    if (newIds.length === 0) return;
    newIds.forEach((id) => notificationEmailSentRef.current.add(id));

    void sendNotificationEmails({
      notificationIds: newIds,
      availableAssessmentsCount: stats.availableAssessments,
      completedAssessments,
    }).catch(error => {
      console.warn('Notification email send skipped:', error);
    });
  }, [completedAssessments, notifications, persistNotificationDismissals, stats.availableAssessments]);

  const handleDismissNotification = (id: string) => {
    if (persistNotificationDismissals) {
      dismissOne(id);
      return;
    }
    setSessionDismissedNotificationIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const updateNotificationScrollbar = useCallback(() => {
    const el = notificationListRef.current;
    if (!el) {
      setNotificationScrollbar({ visible: false, top: 0, height: 0 });
      return;
    }

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 1) {
      setNotificationScrollbar({ visible: false, top: 0, height: 0 });
      return;
    }

    const height = Math.max(40, (el.clientHeight / el.scrollHeight) * el.clientHeight);
    const top = (el.scrollTop / maxScroll) * (el.clientHeight - height);
    setNotificationScrollbar({ visible: true, top, height });
  }, []);

  useEffect(() => {
    updateNotificationScrollbar();
    window.addEventListener('resize', updateNotificationScrollbar);
    return () => window.removeEventListener('resize', updateNotificationScrollbar);
  }, [notifications.length, performanceOverviewHeight, updateNotificationScrollbar]);

  useEffect(() => {
    const el = performanceOverviewRef.current;
    if (!el) return;

    const syncPerformanceOverviewHeight = () => {
      setPerformanceOverviewHeight(Math.ceil(el.getBoundingClientRect().height));
    };

    syncPerformanceOverviewHeight();
    const resizeObserver = new ResizeObserver(syncPerformanceOverviewHeight);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, []);

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
    if (!useLiveProfile) {
      setLoading(false);
      return;
    }
    if (studentQueryLoading || !userData) {
      setLoading(studentQueryLoading);
      return;
    }

    setAchievementTierId(normalizeAchievementTierId(userData?.achievement_tier as string | undefined));
    const profileFirstName = formatFirstName(userData?.first_name ?? userData?.firstName);
    setUserName(profileFirstName ?? getFirebaseFirstName());
    if (userData?.grade) {
      setStudentGrade(userData.grade);
    }
    if (typeof userData?.signup_school_name === 'string' && userData.signup_school_name.trim()) {
      setSchoolName(userData.signup_school_name.trim());
    } else if (schoolNameFromQuery && typeof schoolNameFromQuery === 'string') {
      setSchoolName(schoolNameFromQuery);
    } else {
      setSchoolName(null);
    }

    const levelMap: Record<string, string> = {
      LEVEL_1: MEMBERSHIP_LEVEL_LABEL[1],
      LEVEL_2: MEMBERSHIP_LEVEL_LABEL[2],
      LEVEL_3: MEMBERSHIP_LEVEL_LABEL[3],
      LEVEL_4: MEMBERSHIP_LEVEL_LABEL[4],
    };
    const rawLevel = userData?.membership_level ?? userData?.plan_level ?? null;
    const levelFromStudent: string | number | null =
      typeof rawLevel === 'number' ? normalizeMembershipLevel(rawLevel) : rawLevel;
    const levelNum =
      typeof levelFromStudent === 'number'
        ? levelFromStudent
        : typeof levelFromStudent === 'string' && /^LEVEL_[1234]$/.test(levelFromStudent)
          ? Number(levelFromStudent.replace('LEVEL_', ''))
          : null;
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

    const sortedPayments = [...payments].sort(
      (a, b) => new Date(b.paid_at ?? 0).getTime() - new Date(a.paid_at ?? 0).getTime()
    );

    if (sortedPayments.length > 0) {
      const latest = sortedPayments[0];
      if (levelFromStudent != null && levelFromStudent !== '') {
        if (typeof levelFromStudent === 'number' && levelFromStudent >= 1 && levelFromStudent <= 4) {
          setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1'] ?? `Level ${tierForBadge}`);
        } else {
          setMembershipLevel(levelMap[levelFromStudent as keyof typeof levelMap] ?? String(levelFromStudent));
        }
      } else {
        setMembershipLevel(membershipLabelFromPaymentAmountInr((latest.amount_paise ?? 0) / 100));
      }
      const baseDate = new Date(latest.paid_at ?? '');
      setMembershipExpiry(!isNaN(baseDate.getTime()) ? resolveExpiry(baseDate) : creationExpiry());
    } else if (levelFromStudent != null && levelFromStudent !== '') {
      if (typeof levelFromStudent === 'number' && levelFromStudent >= 1 && levelFromStudent <= 4) {
        setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1'] ?? `Level ${tierForBadge}`);
      } else {
        setMembershipLevel(levelMap[levelFromStudent as keyof typeof levelMap] ?? String(levelFromStudent));
      }
      setMembershipExpiry(creationExpiry());
    } else if (levelNum != null && levelNum >= 1 && levelNum <= 4) {
      setMembershipLevel(levelMap[`LEVEL_${tierForBadge}` as 'LEVEL_1']);
      setMembershipExpiry(creationExpiry());
    } else {
      setMembershipLevel(MEMBERSHIP_LEVEL_LABEL[1]);
      setMembershipExpiry(creationExpiry());
    }

    setLoading(false);
  }, [previewProfile, useLiveProfile, studentQueryLoading, userData, schoolNameFromQuery, payments]);

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

  const scrollToLatestNotifications = () => {
    latestNotificationsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const getDisplayResults = () => {
    return { data: latestAssessmentResults };
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

  const renderTierBadge = (containerSx: Record<string, unknown> = {}) => showStudentMeta && (
    <Box sx={{ flexShrink: 0, ...containerSx }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 0.2, sm: 0.35 },
          mt: { sm: 0.25 },
          px: { xs: 1.5, sm: 1.5 },
          py: { xs: 1, sm: 1 },
          minWidth: { xs: 72, sm: 72 },
          borderRadius: '16px',
          textAlign: 'center',
          ...tierChipSx,
        }}
      >
        <Typography
          component="span"
          aria-hidden
          sx={{ fontSize: '1.35rem', lineHeight: 1, color: 'inherit' }}
        >
          {tierEmoji}
        </Typography>
        <Typography
          component="span"
          sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.15, color: 'inherit' }}
        >
          {tierLabel}
        </Typography>
      </Box>
    </Box>
  );

  const studentMetaChips = showStudentMeta && (studentGrade || schoolName || membershipLevel || membershipExpiry) && (
    <>
      {(studentGrade || schoolName) && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            px: { xs: 1.25, sm: 1.5 },
            py: 0.5,
          }}
        >
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: { xs: '0.78rem', sm: '0.82rem' },
              fontWeight: 500,
              overflowWrap: 'anywhere',
            }}
          >
            {[studentGrade ? `Class ${studentGrade}` : null, schoolName ?? null].filter(Boolean).join(' • ')}
          </Typography>
        </Box>
      )}
      {(membershipLevel || membershipExpiry) && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: '100%',
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '20px',
            px: { xs: 1.25, sm: 1.5 },
            py: 0.5,
          }}
        >
          <Typography
            sx={{
              color: '#fbbf24',
              fontSize: { xs: '0.78rem', sm: '0.82rem' },
              fontWeight: 500,
              overflowWrap: 'anywhere',
            }}
          >
            {[membershipLevel ?? null, membershipExpiry ? `Active until ${membershipExpiry}` : null]
              .filter(Boolean)
              .join(' • ')}
          </Typography>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ mb: 4, ml: { xs: 0, sm: 1 }, minWidth: 0 }}>
      {/* Welcome Section - title left, performance tier badge top-right on larger screens */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: { xs: 'center', sm: 'flex-start' },
            justifyContent: 'space-between',
            gap: { xs: 1.25, sm: 2 },
            mb: 0.5,
            minWidth: 0,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              ...studentPageTitleSx,
              fontSize: { xs: '1.7rem', sm: '1.9rem', md: '2.25rem' },
              lineHeight: 1.1,
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 55%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            👋 Welcome to Your Dashboard, {userName}!
          </Typography>
          {renderTierBadge({ alignSelf: { xs: 'center', sm: 'flex-start' } })}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'rgba(234,179,8,0.15)',
              border: '1px solid rgba(234,179,8,0.35)',
              color: '#fde68a',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            {gamification.argus_coins.toLocaleString()} Argus Coins
          </Box>
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.3)',
              color: '#fdba74',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            Login streak: {gamification.login_streak.current}d
          </Box>
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: '#d8b4fe',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            QoD streak: {gamification.qod_streak.current}d
          </Box>
        </Box>

        <Typography
          variant="h6"
          sx={{
            ...studentPageSubtitleSx,
            fontSize: { xs: '1rem', sm: '1.08rem' },
            fontWeight: 500,
            mt: 0,
            mb: 1.25,
          }}
        >
          Track your progress, manage assessments, and achieve your goals
        </Typography>

        {/* Class / school / membership - below title row */}
        {studentMetaChips && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 0.75, sm: 1 },
              mb: 0,
              mt: 0,
              alignItems: 'center',
            }}
          >
            {studentMetaChips}
          </Box>
        )}
      </Box>

      {/* Stats Grid */}
      <Box
        data-tutorial-id="student-dashboard-stats"
        sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: { xs: 2, sm: 3 }, 
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
          title="Notifications"
          value={notifications.length}
          icon={<Bell size={24} />}
          color="#f59e0b"
          onClick={scrollToLatestNotifications}
        />
      </Box>

      {!previewProfile && uid ? <HowGysWorksImportantBanner uid={uid} /> : null}

      <QodDashboardCard
        qodStreak={gamification.qod_streak.current}
        alreadyAnswered={gamification.qod_last_answered_date === istDateStringClient()}
        preview={Boolean(previewProfile)}
      />

      {!previewProfile && <CoinsLeaderboardWidget uid={uid} />}

      {/* Performance Overview and Notifications - Side by side */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
        gridAutoRows: 'auto',
        alignItems: 'stretch',
        gap: 3,
        mb: 3
      }}>
        {/* Performance Overview */}
        <Card
          ref={performanceOverviewRef}
          data-tutorial-id="student-dashboard-chart"
          sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          alignSelf: 'start',
          height: 'auto',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
              
              </Box>
            </Box>

            {displayResults.data.length > 0 ? (
              <>
                <Box
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 180,
                    px: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.78)',
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    Log in on a tablet or PC to view the full performance graph.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    width: '100%',
                  }}
                >
                  <ColumnChart data={displayResults.data} />
                </Box>
              </>
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
        <Card
          ref={latestNotificationsSectionRef}
          id="latest-notifications"
          data-tutorial-id="student-dashboard-notifications"
          sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 420, lg: performanceOverviewHeight ? `${performanceOverviewHeight}px` : 'auto' },
          minHeight: 0,
          overflow: 'hidden',
          scrollMarginTop: 24,
        }}>
          <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
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
          
            <Box sx={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>
            <Box
              ref={notificationListRef}
              onScroll={updateNotificationScrollbar}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: '100%',
                minHeight: 0,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                pr: notificationScrollbar.visible ? 2 : 0,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
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
                      position: 'relative',
                      pr: 4.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      aria-label={`Dismiss ${notification.title}`}
                      onClick={() => handleDismissNotification(notification.id)}
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        color: 'rgba(255, 255, 255, 0.55)',
                      }}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
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
            {notificationScrollbar.visible && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 8,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  pointerEvents: 'none',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: `${notificationScrollbar.top}px`,
                    right: 1,
                    width: 6,
                    height: `${notificationScrollbar.height}px`,
                    borderRadius: 999,
                    backgroundColor: 'rgba(203, 213, 225, 0.9)',
                    boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.35)',
                  }}
                />
              </Box>
            )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardOverview;
