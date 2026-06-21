import type { ReactNode } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

export const PLATFORM_ADMIN_PAGE_MAX_WIDTH = 1200;

export const platformAdminPageContainerSx = {
  width: '100%',
  maxWidth: PLATFORM_ADMIN_PAGE_MAX_WIDTH,
  mx: 'auto',
  pb: 6,
  px: { xs: 2, sm: 3, md: 4 },
  pt: { xs: 2, sm: 3 },
} as const;

export const platformAdminCardSx = {
  bgcolor: '#fff',
  border: `1px solid ${ip.cardBorder}`,
  borderRadius: 2,
  boxShadow: 'none',
} as const;

export const platformAdminTableContainerSx = {
  ...platformAdminCardSx,
  overflow: 'hidden',
} as const;

export const platformAdminMutedCardSx = {
  bgcolor: ip.cardMutedBg,
  border: `1px solid ${ip.cardBorder}`,
  borderRadius: 2,
  boxShadow: 'none',
} as const;

export const platformAdminTextFieldSx = {
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: ip.cardBorder },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: ip.navy },
  },
  '& .MuiInputBase-input': { color: ip.heading },
} as const;

export const platformAdminFilterGroupSx = {
  bgcolor: '#fff',
  border: `1px solid ${ip.cardBorder}`,
  borderRadius: 2,
  p: 0.25,
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    border: 'none',
    borderRadius: '6px !important',
    color: ip.subtext,
    px: 1.75,
    py: 0.75,
    '&.Mui-selected': {
      bgcolor: ip.sidebarActiveBg,
      color: ip.sidebarActiveText,
      '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.12)' },
    },
    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.04)' },
  },
} as const;

export const platformAdminPrimaryButtonSx = {
  textTransform: 'none',
  fontWeight: 700,
  bgcolor: ip.navy,
  color: '#fff',
  boxShadow: 'none',
  '&:hover': { bgcolor: '#0b3366', boxShadow: 'none' },
  '&.Mui-disabled': { bgcolor: '#94a3b8', color: '#fff' },
} as const;

export const platformAdminOutlinedButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  color: ip.navy,
  borderColor: ip.cardBorder,
  bgcolor: '#fff',
  '&:hover': { borderColor: ip.navy, bgcolor: ip.cardMutedBg },
} as const;

export const platformAdminTableHeadCellSx = {
  fontWeight: 700,
  color: ip.heading,
  bgcolor: ip.cardMutedBg,
  borderBottom: `1px solid ${ip.cardBorder}`,
} as const;

export type AdminChipTone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

const ADMIN_CHIP_TONES: Record<AdminChipTone, { bg: string; color: string; border: string }> = {
  success: { bg: 'rgba(34, 197, 94, 0.12)', color: '#15803d', border: 'rgba(34, 197, 94, 0.35)' },
  warning: { bg: ip.pendingBg, color: '#a16207', border: 'rgba(217, 119, 6, 0.35)' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: 'rgba(239, 68, 68, 0.3)' },
  neutral: { bg: ip.declineGray, color: ip.declineText, border: ip.cardBorder },
  info: { bg: 'rgba(16, 64, 139, 0.08)', color: ip.navy, border: 'rgba(16, 64, 139, 0.2)' },
};

export function adminChipSx(tone: AdminChipTone) {
  const t = ADMIN_CHIP_TONES[tone];
  return {
    height: 26,
    fontWeight: 600,
    fontSize: '0.75rem',
    bgcolor: t.bg,
    color: t.color,
    border: `1px solid ${t.border}`,
    '& .MuiChip-label': { px: 1.1 },
  } as const;
}

export function paymentStatusChipTone(status: string): AdminChipTone {
  const s = status.toLowerCase();
  if (['captured', 'paid', 'completed'].includes(s)) return 'success';
  if (['pending', 'pending_contact', 'pending_webhook'].includes(s)) return 'warning';
  if (s === 'failed') return 'error';
  return 'neutral';
}

export function PlatformAdminChip({ label, tone }: { label: string; tone: AdminChipTone }) {
  return <Chip label={label} size="small" sx={adminChipSx(tone)} />;
}

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

export function PlatformAdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: ReactNode;
  action?: ReactNode;
}) {
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
        <Typography variant="h4" sx={pageHeaderTitleSx}>
          {title}
        </Typography>
        <Typography variant="body1" sx={pageHeaderSubtitleSx}>
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

export { ip as platformAdminPalette };
