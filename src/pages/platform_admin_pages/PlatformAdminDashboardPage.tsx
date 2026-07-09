import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  CardGiftcard as RewardsIcon,
  PlayArrow as RunIcon,
  CheckCircleOutline as CheckIcon,
  WarningAmber as WarningIcon,
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  CurrencyRupee as RupeeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  getPlatformAdminOverview,
  listPlatformAdminNotifications,
  markAllPlatformAdminNotificationsRead,
  markPlatformAdminNotificationsRead,
  runPlatformAdminPipeline,
  formatInrFromPaise,
  type PlatformAdminNotification,
  type PlatformAdminOverviewStats,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminMutedCardSx,
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminPageHeader } from './platformAdminComponents';

type PipelineId = 'student' | 'school' | 'monthly';

type PipelineDefinition = {
  id: PipelineId;
  title: string;
  subtitle: string;
  duration: string;
  summary: string;
  steps: string[];
  warning?: string;
};

const PIPELINE_DEFINITIONS: PipelineDefinition[] = [
  {
    id: 'student',
    title: 'Student pipeline',
    subtitle: 'National tiers + student PDF reports',
    duration: 'Typically 5–20 minutes',
    summary:
      'Runs across every student account. Use after large assessment windows or when student tiers/reports look stale.',
    steps: [
      'Recalculates national performance tiers for all students (leaderboard rankings).',
      'Scans each student for newly eligible Discovery and Reasoning Triad reports.',
      'Generates missing PDF reports and stores them on the student record (S3 + Firestore).',
      'Publishes in-app dashboard alerts (bell icon) for students  -  leaderboard and badge refresh. No email is sent.',
    ],
  },
  {
    id: 'school',
    title: 'School pipeline',
    subtitle: 'Institutional analytics + quarterly PDFs',
    duration: 'Typically 3–15 minutes',
    summary:
      'Recomputes school-wide analytics from the current student roster. On quarter-start months it also builds quarterly institutional PDFs.',
    steps: [
      'Loads all students rostered to each school and recomputes avg percentile, completion rate, and assessed count.',
      'Updates `schools/{id}/analytics/current` and institutional tier fields on the school document.',
      'On Jan/Apr/Jul/Oct (IST): writes quarterly report metadata and uploads the institutional PDF to S3.',
      'School POCs see new report alerts in the school admin portal  -  no email is sent by this pipeline.',
    ],
    warning: 'Quarter-start months also regenerate quarterly PDFs for every school.',
  },
  {
    id: 'monthly',
    title: 'Full monthly pipeline',
    subtitle: 'Student stage, then school stage',
    duration: 'Typically 10–35 minutes',
    summary:
      'Same job that runs automatically on the 1st of each month (IST). Runs the student pipeline first, then the school pipeline so institutional analytics use fresh student tiers.',
    steps: [
      'Stage 1  -  Student pipeline (tiers + student PDF reports for all students).',
      'Stage 2  -  School pipeline (per-school analytics cache + quarterly PDFs when applicable).',
    ],
    warning: 'This is the heaviest operation. Avoid running during peak exam hours.',
  },
];

function notificationTypeLabel(type: PlatformAdminNotification['type']): string {
  switch (type) {
    case 'school_registered':
      return 'New school';
    case 'school_students_added':
      return 'Roster updated';
    case 'student_joined':
      return 'Student joined';
    default:
      return 'Alert';
  }
}

function notificationTypeColor(type: PlatformAdminNotification['type']): string {
  switch (type) {
    case 'school_registered':
      return ip.statBlue;
    case 'school_students_added':
      return '#d97706';
    case 'student_joined':
      return ip.approveGreen;
    default:
      return ip.subtext;
  }
}

function notificationIcon(type: PlatformAdminNotification['type']) {
  switch (type) {
    case 'school_registered':
      return <SchoolIcon sx={{ fontSize: 20 }} />;
    case 'school_students_added':
      return <GroupAddIcon sx={{ fontSize: 20 }} />;
    case 'student_joined':
      return <PersonAddIcon sx={{ fontSize: 20 }} />;
    default:
      return <NotificationsIcon sx={{ fontSize: 20 }} />;
  }
}

function formatNotificationTime(iso: string | null): string {
  if (!iso) return ' - ';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return ' - ';
  return d.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  onClick,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <Card
      sx={{
        ...platformAdminCardSx,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': onClick ? { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)', borderColor: '#cbd5e1' } : undefined,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: ip.subtext }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: `${accent}18`, color: accent, borderRadius: 2, p: 1.25, display: 'flex' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const PlatformAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformAdminOverviewStats | null>(null);
  const [notifications, setNotifications] = useState<PlatformAdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState<PipelineId | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [confirmPipeline, setConfirmPipeline] = useState<PipelineDefinition | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, notificationData] = await Promise.all([
        getPlatformAdminOverview(),
        listPlatformAdminNotifications(30),
      ]);
      setStats(overview);
      setNotifications(notificationData.notifications);
      setUnreadCount(notificationData.unread_count);
      window.dispatchEvent(
        new CustomEvent('platform-admin-notifications-updated', {
          detail: { unread_count: notificationData.unread_count },
        })
      );
    } catch {
      setError('Failed to load overview stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkNotificationRead = async (id: string) => {
    const remaining = await markPlatformAdminNotificationsRead([id]);
    setUnreadCount(remaining);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    window.dispatchEvent(new CustomEvent('platform-admin-notifications-updated', { detail: { unread_count: remaining } }));
  };

  const handleMarkAllNotificationsRead = async () => {
    await markAllPlatformAdminNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    window.dispatchEvent(new CustomEvent('platform-admin-notifications-updated', { detail: { unread_count: 0 } }));
  };

  useEffect(() => {
    load();
  }, [load]);

  const runPipeline = async (pipeline: PipelineId) => {
    setConfirmPipeline(null);
    setPipelineRunning(pipeline);
    setPipelineMessage(null);
    try {
      await runPlatformAdminPipeline(pipeline);
      const label = PIPELINE_DEFINITIONS.find((p) => p.id === pipeline)?.title ?? pipeline;
      setPipelineMessage(`${label} completed successfully.`);
      await load();
    } catch {
      setPipelineMessage('Pipeline run failed. Check Cloud Functions logs for details.');
    } finally {
      setPipelineRunning(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ ...platformAdminPageContainerSx, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: ip.navy }} />
      </Box>
    );
  }

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Overview"
        subtitle="Platform-wide stats and manual pipeline controls"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <Card
          sx={{
            ...platformAdminCardSx,
            mb: 2,
            background: `linear-gradient(135deg, ${ip.navy} 0%, #1e3a5f 100%)`,
            borderColor: 'transparent',
          }}
        >
          <CardContent sx={{ py: 2.5, px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: 2,
                  p: 1.25,
                  display: 'flex',
                }}
              >
                <RupeeIcon />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.25 }}>
                  Total revenue collected (excl. test schools)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  {formatInrFromPaise(stats.total_revenue_paise)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard
            title="Total schools"
            value={stats.schools_total}
            subtitle={`${stats.schools_paid} paid · ${stats.schools_verified} verified`}
            icon={<SchoolIcon />}
            accent={ip.statBlue}
            onClick={() => navigate('/platform-admin/schools')}
          />
          <StatCard
            title="Pending payments"
            value={stats.schools_pending_payment}
            icon={<PaymentIcon />}
            accent="#d97706"
            onClick={() => navigate('/platform-admin/schools?filter=pending')}
          />
          <StatCard
            title="Total students"
            value={stats.students_total}
            subtitle="Excludes test accounts"
            icon={<PeopleIcon />}
            accent={ip.approveGreen}
            onClick={() => navigate('/platform-admin/students')}
          />
          <StatCard
            title="Pending redemptions"
            value={stats.pending_redemptions}
            icon={<RewardsIcon />}
            accent="#b45309"
            onClick={() => navigate('/platform-admin/rewards')}
          />
        </Box>
      )}

      <Card sx={{ ...platformAdminCardSx, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading }}>
                Recent alerts
              </Typography>
              <Typography variant="body2" sx={{ color: ip.subtext }}>
                New school signups, roster updates, and student joins. Email copies go to platform admin addresses.
              </Typography>
            </Box>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllNotificationsRead}
                sx={{ textTransform: 'none', color: ip.statBlue, flexShrink: 0 }}
              >
                Mark all read ({unreadCount})
              </Button>
            )}
          </Box>

          {notifications.length === 0 ? (
            <Typography sx={{ color: ip.subtext, fontSize: '0.9rem' }}>No alerts yet.</Typography>
          ) : (
            <List disablePadding>
              {notifications.map((notification, index) => {
                const accent = notificationTypeColor(notification.type);
                return (
                  <React.Fragment key={notification.id}>
                    {index > 0 && <Divider sx={{ my: 1 }} />}
                    <ListItem
                      disableGutters
                      sx={{
                        alignItems: 'flex-start',
                        py: 1.25,
                        opacity: notification.read ? 0.72 : 1,
                        bgcolor: notification.read ? 'transparent' : ip.pendingBg,
                        borderRadius: 1.5,
                        px: 1.5,
                      }}
                      secondaryAction={
                        !notification.read ? (
                          <Button
                            size="small"
                            onClick={() => handleMarkNotificationRead(notification.id)}
                            sx={{ textTransform: 'none', color: ip.subtext, minWidth: 0 }}
                          >
                            Mark read
                          </Button>
                        ) : undefined
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.25, color: accent }}>
                        {notificationIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pr: 8 }}>
                            <Typography sx={{ fontWeight: notification.read ? 600 : 700, color: ip.heading }}>
                              {notification.title}
                            </Typography>
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: accent,
                                bgcolor: `${accent}18`,
                                px: 1,
                                py: 0.25,
                                borderRadius: 999,
                              }}
                            >
                              {notificationTypeLabel(notification.type)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'block' }}>
                            <Typography component="span" sx={{ display: 'block', color: ip.subtext, fontSize: '0.88rem', mt: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography component="span" sx={{ display: 'block', color: ip.subtext, fontSize: '0.78rem', mt: 0.75 }}>
                              {formatNotificationTime(notification.created_at)}
                              {notification.school_id ? ` · School ID ${notification.school_id}` : ''}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      <Card sx={platformAdminCardSx}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
            Data pipelines
          </Typography>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 2.5, maxWidth: 720 }}>
            These jobs normally run automatically on the 1st of each month (IST). Trigger manually only when
            you need fresh tiers, reports, or school analytics outside that schedule.
          </Typography>

          {pipelineMessage && (
            <Alert severity={pipelineMessage.includes('failed') ? 'error' : 'success'} sx={{ mb: 2.5 }}>
              {pipelineMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PIPELINE_DEFINITIONS.map((pipeline) => {
              const isRunning = pipelineRunning === pipeline.id;
              const anyRunning = pipelineRunning !== null;
              return (
                <Box
                  key={pipeline.id}
                  sx={{
                    ...platformAdminMutedCardSx,
                    p: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'stretch', md: 'flex-start' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: '1rem' }}>
                      {pipeline.title}
                    </Typography>
                    <Typography sx={{ color: ip.sidebarActiveText, fontWeight: 600, fontSize: '0.82rem', mb: 0.75 }}>
                      {pipeline.subtitle} · {pipeline.duration}
                    </Typography>
                    <Typography sx={{ color: ip.subtext, fontSize: '0.9rem', mb: 1.25, lineHeight: 1.55 }}>
                      {pipeline.summary}
                    </Typography>
                    <List dense disablePadding sx={{ color: ip.heading }}>
                      {pipeline.steps.map((step) => (
                        <ListItem key={step} disableGutters sx={{ py: 0.25, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.35, color: ip.statBlue }}>
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={step}
                            primaryTypographyProps={{ fontSize: '0.85rem', color: ip.heading, lineHeight: 1.45 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {pipeline.warning && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1, color: '#a16207' }}>
                        <WarningIcon sx={{ fontSize: 18, mt: 0.15 }} />
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{pipeline.warning}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    disabled={anyRunning}
                    onClick={() => setConfirmPipeline(pipeline)}
                    startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <RunIcon />}
                    sx={{ ...platformAdminPrimaryButtonSx, alignSelf: { xs: 'stretch', md: 'flex-start' }, minWidth: 160 }}
                  >
                    {isRunning ? 'Running…' : 'Run pipeline'}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(confirmPipeline)} onClose={() => setConfirmPipeline(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading }}>
          Confirm pipeline run
        </DialogTitle>
        <DialogContent dividers>
          {confirmPipeline && (
            <>
              <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
                {confirmPipeline.title}
              </Typography>
              <Typography sx={{ color: ip.subtext, mb: 2, lineHeight: 1.55 }}>
                {confirmPipeline.summary}
              </Typography>
              <Typography sx={{ fontWeight: 600, color: ip.heading, mb: 1, fontSize: '0.9rem' }}>
                This will:
              </Typography>
              <List dense disablePadding>
                {confirmPipeline.steps.map((step) => (
                  <ListItem key={step} disableGutters sx={{ py: 0.35 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: ip.statBlue }}>
                      <CheckIcon sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText primary={step} primaryTypographyProps={{ fontSize: '0.88rem', color: ip.heading }} />
                  </ListItem>
                ))}
              </List>
              {confirmPipeline.warning && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Alert severity="warning" sx={{ bgcolor: ip.pendingBg, color: '#92400e' }}>
                    {confirmPipeline.warning}
                  </Alert>
                </>
              )}
              <Typography sx={{ color: ip.subtext, fontSize: '0.85rem', mt: 2 }}>
                Estimated duration: {confirmPipeline.duration}. You can leave this page  -  the job continues on the server.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmPipeline(null)} sx={{ textTransform: 'none', color: ip.subtext }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={pipelineRunning !== null}
            onClick={() => confirmPipeline && runPipeline(confirmPipeline.id)}
            sx={platformAdminPrimaryButtonSx}
          >
            Yes, run {confirmPipeline?.title.toLowerCase()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformAdminDashboardPage;
