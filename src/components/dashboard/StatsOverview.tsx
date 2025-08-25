import React from 'react';
import { Box } from '@mui/material';
import { BookOpen, Target, Award, Clock } from 'lucide-react';
import MetricCard from './MetricCard';

interface StatsOverviewProps {
  totalExams?: number;
  completedExams?: number;
  averageScore?: number;
  upcomingExams?: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalExams = 0,
  completedExams = 0,
  averageScore = 0,
  upcomingExams = 0
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
            title="Total Exams"
            value={totalExams}
            icon={<BookOpen />}
            color="primary"
            trend={`${totalExams > 0 ? '+' : ''}${totalExams} available`}
            trendType="positive"
          />
        </Box>
        <Box>
          <MetricCard
            title="Completed"
            value={completedExams}
            icon={<Award />}
            color="success"
            trend={`${completedExams > 0 ? '+' : ''}${completedExams} finished`}
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
            value={upcomingExams}
            icon={<Clock />}
            color="warning"
            trend={`${upcomingExams > 0 ? upcomingExams : 'No'} scheduled`}
            trendType="neutral"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StatsOverview;
