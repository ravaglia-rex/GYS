import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Switch, 
  FormControlLabel,
  Divider,
  Alert,
  Button,
  Grid,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Calendar,
  Award,
  BookOpen,
  Save,
  Volume2,
  VolumeX
} from 'lucide-react';

const NotificationSettings: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [notifications, setNotifications] = useState({
    // Assessment-related toggles (keys kept for backward compatibility)
    examReminders: true,
    examResults: true,
    examSchedule: true,
    examUpdates: true,
    
    // Academic
    scoreUpdates: true,
    performanceAlerts: true,
    studyReminders: false,
    certificateReady: true,
    
    // Communication
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    
    // System
    systemUpdates: false,
    maintenanceAlerts: true,
    securityAlerts: true,
    featureAnnouncements: true
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAction = (action: 'all' | 'none') => {
    setNotifications(prev =>
      Object.fromEntries(
        Object.keys(prev).map(key => [key, action === 'all'])
      ) as typeof prev
    );
  };

  const notificationCategories = [
    {
      title: 'Assessment Notifications',
      description: 'Stay updated with your assessment schedule and results',
      icon: <BookOpen size={24} />,
      color: '#8b5cf6',
      items: [
        { key: 'examReminders', label: 'Assessment Reminders', description: 'Get notified before assessments' },
        { key: 'examResults', label: 'Results Available', description: 'When your results are ready' },
        { key: 'examSchedule', label: 'Schedule Changes', description: 'Updates to assessment timing' },
        { key: 'examUpdates', label: 'Assessment Updates', description: 'Important assessment announcements' }
      ]
    },
    {
      title: 'Academic Progress',
      description: 'Track your learning journey and achievements',
      icon: <Award size={24} />,
      color: '#10b981',
      items: [
        { key: 'scoreUpdates', label: 'Score Updates', description: 'When new scores are available' },
        { key: 'performanceAlerts', label: 'Performance Alerts', description: 'Important performance insights' },
        { key: 'studyReminders', label: 'Study Reminders', description: 'Daily study schedule reminders' },
        { key: 'certificateReady', label: 'Certificate Ready', description: 'When certificates are available' }
      ]
    },
    {
      title: 'Communication Channels',
      description: 'Choose how you want to receive notifications',
      icon: <MessageSquare size={24} />,
      color: '#3b82f6',
      items: [
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications' },
        { key: 'smsNotifications', label: 'SMS Notifications', description: 'Text message updates' },
        { key: 'inAppNotifications', label: 'In-App Notifications', description: 'Notifications within the app' }
      ]
    },
    {
      title: 'System & Updates',
      description: 'Important system information and updates',
      icon: <Bell size={24} />,
      color: '#f59e0b',
      items: [
        { key: 'systemUpdates', label: 'System Updates', description: 'App and feature updates' },
        { key: 'maintenanceAlerts', label: 'Maintenance Alerts', description: 'Scheduled maintenance notices' },
        { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security notifications' },
        { key: 'featureAnnouncements', label: 'New Features', description: 'Learn about new capabilities' }
      ]
    }
  ];

  return (
    <Box>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Notification settings updated successfully!
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '1.8rem' }}>
          Notification Preferences
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 3, fontSize: '1.1rem' }}>
          Customize how and when you receive notifications. Choose what matters most to you.
        </Typography>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Volume2 size={16} />}
            onClick={() => handleQuickAction('all')}
            sx={{
              borderColor: '#10b981',
              color: '#10b981',
              '&:hover': { borderColor: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
            }}
          >
            Enable All
          </Button>
          <Button
            variant="outlined"
            startIcon={<VolumeX size={16} />}
            onClick={() => handleQuickAction('none')}
            sx={{
              borderColor: '#ef4444',
              color: '#ef4444',
              '&:hover': { borderColor: '#dc2626', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
            }}
          >
            Disable All
          </Button>
        </Box>
      </Box>

      {/* Notification Categories */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {notificationCategories.map((category, index) => (
          <Box key={index}>
            <Card sx={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 3,
              height: '100%',
            }}>
              <CardContent sx={{ p: 3 }}>
                {/* Category Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                    border: `2px solid ${category.color}30`
                  }}>
                    {category.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
                      {category.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem' }}>
                      {category.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Notification Items */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {category.items.map((item) => (
                    <Box key={item.key} sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 500, mb: 0.5, fontSize: '1rem' }}>
                            {item.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                            {item.description}
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: category.color,
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: category.color,
                                },
                              }}
                            />
                          }
                          label=""
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Save Button */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            backgroundColor: '#8b5cf6',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            '&:hover': { backgroundColor: '#7c3aed' }
          }}
        >
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </Box>

      {/* Additional Info */}
      <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
          💡 <strong>Pro Tip:</strong> You can always change these settings later. Critical notifications like security alerts and assessment results will still be sent even if disabled.
        </Typography>
      </Box>
    </Box>
  );
};

export default NotificationSettings;
