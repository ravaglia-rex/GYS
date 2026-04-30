import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  CANONICAL_ACHIEVEMENT_TIER_IDS,
  formatAchievementTierLabel,
} from '../../utils/achievementTier';
import {
  NATIONAL_PERFORMANCE_TIER_COLORS,
  nationalTierPercentDistribution,
} from '../../utils/schoolAdminTierAnalytics';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

export interface NationalPerformanceTierOverviewProps {
  counts: Record<(typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number], number>;
  total: number;
  subtitle?: string;
  barHeight?: number;
}

/**
 * Horizontal stacked bar for national GYS performance tier distribution (`achievement_tier` on roster).
 */
export const NationalPerformanceTierOverview: React.FC<NationalPerformanceTierOverviewProps> = ({
  counts,
  total,
  subtitle,
  barHeight = 28,
}) => {
  const pctById = nationalTierPercentDistribution(counts, total);
  const segments = CANONICAL_ACHIEVEMENT_TIER_IDS.map((id) => ({
    key: id,
    count: counts[id],
    pct: pctById[id],
    color: NATIONAL_PERFORMANCE_TIER_COLORS[id],
    label: formatAchievementTierLabel(id),
  }));

  return (
    <Box>
      {subtitle && (
        <Typography variant="body2" sx={{ color: ip.subtext, mb: 1.5, lineHeight: 1.5 }}>
          {subtitle}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          borderRadius: 1,
          overflow: 'hidden',
          height: barHeight,
          mb: 1.5,
          border: `1px solid ${ip.cardBorder}`,
        }}
      >
        {total > 0 ? (
          segments.map((s) => (
            <Tooltip key={s.key} title={`${s.label}: ${s.count} students (${s.pct}%)`} arrow>
              <Box
                sx={{
                  width: `${s.pct}%`,
                  bgcolor: s.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: s.pct > 6 ? 'auto' : 0,
                }}
              >
                {s.pct >= 8 && (
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                    {s.pct}%
                  </Typography>
                )}
              </Box>
            </Tooltip>
          ))
        ) : (
          <Box sx={{ flex: 1, bgcolor: ip.cardMutedBg }} />
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {segments.map((s) => (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
            <Typography variant="caption" sx={{ color: ip.subtext, fontSize: '0.72rem' }}>
              {s.label}: {s.count} ({total > 0 ? s.pct : 0}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
