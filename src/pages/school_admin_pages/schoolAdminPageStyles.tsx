import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

export const SCHOOL_ADMIN_PAGE_MAX_WIDTH = 1120;

export const schoolAdminPageContainerSx = {
  width: '100%',
  maxWidth: SCHOOL_ADMIN_PAGE_MAX_WIDTH,
  mx: 'auto',
  pb: 6,
} as const;

const pageHeaderTitleSx = {
  color: ip.heading,
  fontWeight: 700,
  fontSize: { xs: '2rem', sm: '2.25rem' },
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
  mb: 0.75,
} as const;

const pageHeaderSubtitleSx = {
  color: ip.subtext,
  fontSize: { xs: '0.95rem', sm: '1rem' },
  lineHeight: 1.55,
  fontWeight: 400,
} as const;

interface SchoolAdminPageHeaderProps {
  title: string;
  subtitle: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
}

export function SchoolAdminPageHeader({ title, subtitle, badge, action }: SchoolAdminPageHeaderProps) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={pageHeaderTitleSx}>
            {title}
          </Typography>
          {badge}
        </Box>
        <Typography variant="body1" sx={pageHeaderSubtitleSx}>
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}
