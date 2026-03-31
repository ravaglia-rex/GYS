import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import type { Tier123Counts } from '../../utils/schoolAdminTierAnalytics';
import { PROF_TIER_COLORS } from '../../utils/schoolAdminTierAnalytics';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

const LABELS = ['Tier 1 (Bronze)', 'Tier 2 (Silver)', 'Tier 3+ (Gold)'] as const;

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export interface ProficiencyTier123OverviewProps {
  summary: Tier123Counts;
  /** Short note under the title */
  subtitle?: string;
  barHeight?: number;
}

/**
 * Horizontal stacked bar + legend for all school students by overall proficiency band (1 / 2 / 3+).
 */
export const ProficiencyTier123Overview: React.FC<ProficiencyTier123OverviewProps> = ({
  summary,
  subtitle,
  barHeight = 28,
}) => {
  const { tier1, tier2, tier3, total } = summary;
  const p1 = pct(tier1, total);
  const p2 = pct(tier2, total);
  const p3 = pct(tier3, total);
  const segments: { key: string; count: number; pct: number; color: string; label: string }[] = [
    { key: 't1', count: tier1, pct: p1, color: PROF_TIER_COLORS.tier1, label: LABELS[0] },
    { key: 't2', count: tier2, pct: p2, color: PROF_TIER_COLORS.tier2, label: LABELS[1] },
    { key: 't3', count: tier3, pct: p3, color: PROF_TIER_COLORS.tier3, label: LABELS[2] },
  ];

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
          segments.map(s => (
            <Tooltip
              key={s.key}
              title={`${s.label}: ${s.count} students (${s.pct}%)`}
              arrow
            >
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
                {/* Was `> 8`, which hid labels at exactly 8% (e.g. 12/142 → 8%). */}
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
        {segments.map(s => (
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
