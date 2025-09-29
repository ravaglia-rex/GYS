import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Badge,
  Divider,
  Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  School as SchoolIcon
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  category: 'exam' | 'payment' | 'system' | 'general';
}

interface NotificationsDialogProps {
  open: boolean;
  onClose: () => void;
  availableExamsCount: number;
  resultsAvailableCount: number;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon color="success" />;
    case 'info':
      return <InfoIcon color="info" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'error':
      return <ErrorIcon color="error" />;
    default:
      return <InfoIcon />;
  }
};

const getCategoryIcon = (category: Notification['category']) => {
  switch (category) {
    case 'exam':
      return <AssignmentIcon />;
    case 'payment':
      return <PaymentIcon />;
    case 'system':
      return <InfoIcon />;
    default:
      return <SchoolIcon />;
  }
};

const getCategoryColor = (category: Notification['category']) => {
  switch (category) {
    case 'exam':
      return 'primary';
    case 'payment':
      return 'success';
    case 'system':
      return 'info';
    default:
      return 'default';
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  return `${Math.floor(diffInMinutes / 1440)} days ago`;
};

// Function to generate dynamic notifications based on the rules
const generateDynamicNotifications = (
  availableExamsCount: number,
  resultsAvailableCount: number
): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date();

  // Rule 1: If number of exams available is not 0, show "New Exam Available"
  if (availableExamsCount > 0) {
    notifications.push({
      id: 'new-exam-available',
      type: 'info',
      title: 'New Exam Available',
      message: `You have ${availableExamsCount} new exam${availableExamsCount > 1 ? 's' : ''} available to take. Check the exams section to get started.`,
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      isRead: false,
      category: 'exam'
    });
  }

  // Rule 2: If number of results available is 2, show 2 different notifications
  if (resultsAvailableCount === 2) {
    // First notification: Challenge exam evaluated and result available
    notifications.push({
      id: 'challenge-exam-result',
      type: 'success',
      title: 'Challenge Exam Evaluated',
      message: 'Your challenge exam has been evaluated and results are now available. Check your performance analysis.',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      category: 'exam'
    });

    // Second notification: Check your exam analysis now
    notifications.push({
      id: 'exam-analysis-ready',
      type: 'info',
      title: 'Analysis Complete',
      message: 'Your detailed exam analysis is ready for review. Discover your strengths and areas for improvement.',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      isRead: false,
      category: 'exam'
    });
  }

  // Rule 3: If number of results available is 1, show qualifying exam result notification
  if (resultsAvailableCount === 1) {
    notifications.push({
      id: 'qualifying-exam-result',
      type: 'success',
      title: 'Qualifying Exam Result Available',
      message: 'Your qualifying exam has been evaluated and results are now available. View your performance and next steps.',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      isRead: false,
      category: 'exam'
    });
  }

  return notifications;
};

export default function NotificationsDialog({ 
  open, 
  onClose, 
  availableExamsCount, 
  resultsAvailableCount 
}: NotificationsDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate notifications when props change
  useEffect(() => {
    const dynamicNotifications = generateDynamicNotifications(
      availableExamsCount, 
      resultsAvailableCount
    );
    setNotifications(dynamicNotifications);
  }, [availableExamsCount, resultsAvailableCount]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon color="primary" />
          </Badge>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
              No notifications
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              You're all caught up! Check back later for new updates.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      }
                    }}
                  >
                    Mark all read
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleClearAll}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      }
                    }}
                  >
                    Clear all
                  </Button>
                </Box>
              </Box>
            </Box>

            <List sx={{ 
              p: 0,
              maxHeight: notifications.length > 3 ? '400px' : 'auto',
              overflowY: notifications.length > 3 ? 'auto' : 'visible'
            }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.isRead ? 'transparent' : 'rgba(139, 92, 246, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(139, 92, 246, 0.2)',
                        color: 'white'
                      }}>
                        {getCategoryIcon(notification.category)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {getNotificationIcon(notification.type)}
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: 'white',
                              fontWeight: notification.isRead ? 400 : 600,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.category}
                            size="small"
                            color={getCategoryColor(notification.category) as any}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.8)',
                              mb: 1,
                              lineHeight: 1.4
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            {formatTimestamp(notification.timestamp)}
                            {!notification.isRead && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  ml: 1
                                }}
                              />
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
