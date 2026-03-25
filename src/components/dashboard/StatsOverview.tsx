import React from 'react';
import { Box } from '@mui/material';
import { BookOpen, Target, Award, Clock } from 'lucide-react';
import MetricCard from './MetricCard';

interface StatsOverviewProps {
  totalAssessments?: number;
  completedAssessments?: number;
  averageScore?: number;
  upcomingAssessments?: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalAssessments = 0,
  completedAssessments = 0,
  averageScore = 0,
  upcomingAssessments = 0
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3 
      }}>
        <Box>
          <MetricCard
            title="Total Assessments"
            value={totalAssessments}
            icon={<BookOpen />}
            color="primary"
            trend={`${totalAssessments > 0 ? '+' : ''}${totalAssessments} available`}
            trendType="positive"
          />
        </Box>
        <Box>
          <MetricCard
            title="Completed"
            value={completedAssessments}
            icon={<Award />}
            color="success"
            trend={`${completedAssessments > 0 ? '+' : ''}${completedAssessments} finished`}
            trendType="positive"
          />
        </Box>
        <Box>
          <MetricCard
            title="Average Score"
            value={`${averageScore}%`}
            icon={<Target />}
            color="info"
            trend={averageScore > 80 ? "Excellent!" : averageScore > 60 ? "Good!" : "Keep improving!"}
            trendType={averageScore > 80 ? "positive" : averageScore > 60 ? "neutral" : "negative"}
          />
        </Box>
        <Box>
          <MetricCard
            title="Upcoming"
            value={upcomingAssessments}
            icon={<Clock />}
            color="warning"
            trend={`${upcomingAssessments > 0 ? upcomingAssessments : 'No'} scheduled`}
            trendType="neutral"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StatsOverview;
