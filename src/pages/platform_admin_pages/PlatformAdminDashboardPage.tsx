import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  CardGiftcard as RewardsIcon,
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
  formatInrFromPaise,
  type PlatformAdminNotification,
  type PlatformAdminOverviewStats,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminPageContainerSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminPageHeader } from './platformAdminComponents';

const MAX_RECENT_ALERTS = 6;
/** Roughly three notification rows visible before scrolling. */
const RECENT_ALERTS_SCROLL_HEIGHT = 420;

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, notificationData] = await Promise.all([
        getPlatformAdminOverview(),
        listPlatformAdminNotifications(MAX_RECENT_ALERTS),
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
        subtitle="Platform-wide stats and recent alerts"
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
                New school signups and roster updates. Email copies go to platform admin addresses.
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
            <Box
              sx={{
                maxHeight: RECENT_ALERTS_SCROLL_HEIGHT,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 3 },
              }}
            >
              <List disablePadding>
              {notifications.map((notification, index) => {
                const accent = notificationTypeColor(notification.type);
                return (
                  <React.Fragment key={notification.id}>
                    {index > 0 && <Divider sx={{ my: 1 }} />}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        py: 1.25,
                        px: 1.5,
                        opacity: notification.read ? 0.72 : 1,
                        bgcolor: notification.read ? 'transparent' : ip.pendingBg,
                        borderRadius: 1.5,
                      }}
                    >
                      <Box sx={{ color: accent, mt: 0.25, flexShrink: 0, display: 'flex' }}>
                        {notificationIcon(notification.type)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
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
                                flexShrink: 0,
                              }}
                            >
                              {notificationTypeLabel(notification.type)}
                            </Typography>
                          </Box>
                          {!notification.read && (
                            <Button
                              size="small"
                              onClick={() => handleMarkNotificationRead(notification.id)}
                              sx={{
                                textTransform: 'none',
                                color: ip.subtext,
                                minWidth: 0,
                                flexShrink: 0,
                                px: 1,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Mark read
                            </Button>
                          )}
                        </Box>
                        <Typography
                          sx={{
                            display: 'block',
                            color: ip.subtext,
                            fontSize: '0.88rem',
                            mt: 0.5,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          sx={{
                            display: 'block',
                            color: ip.subtext,
                            fontSize: '0.78rem',
                            mt: 0.75,
                            wordBreak: 'break-word',
                          }}
                        >
                          {formatNotificationTime(notification.created_at)}
                          {notification.school_id ? ` · School ID ${notification.school_id}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </React.Fragment>
                );
              })}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlatformAdminDashboardPage;
