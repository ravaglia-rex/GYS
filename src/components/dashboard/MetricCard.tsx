import React from 'react';
import { Card, CardContent, Typography, Box, SvgIconProps } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactElement<SvgIconProps>;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  trendType = 'neutral',
  icon,
  color = 'primary'
}) => {
  const getColorScheme = (colorType: string) => {
    switch (colorType) {
      case 'success':
        return { bg: '#10b981', text: '#ffffff', icon: '#10b981' };
      case 'warning':
        return { bg: '#f59e0b', text: '#ffffff', icon: '#f59e0b' };
      case 'error':
        return { bg: '#ef4444', text: '#ffffff', icon: '#ef4444' };
      case 'info':
        return { bg: '#3b82f6', text: '#ffffff', icon: '#3b82f6' };
      default:
        return { bg: '#8b5cf6', text: '#ffffff', icon: '#8b5cf6' };
    }
  };

  const colorScheme = getColorScheme(color);

  const getTrendColor = (type: string) => {
    switch (type) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <Card 
      sx={{ 
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && (
            <Box 
              sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                backgroundColor: `${colorScheme.bg}20`,
                mr: 2
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  color: colorScheme.icon, 
                  fontSize: 24 
                } 
              })}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                mt: 0.5
              }}
            >
              {value}
            </Typography>
            {trend && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: getTrendColor(trendType),
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {trendType === 'positive' && '↗'}
                {trendType === 'negative' && '↘'}
                {trendType === 'neutral' && '→'}
                {trend}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
