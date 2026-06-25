import type { ReactNode } from 'react';
import { Box, Card, CardContent, Chip, MenuItem, Select, Typography } from '@mui/material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  PLATFORM_ADMIN_TOOLBAR_H,
  platformAdminCardSx,
  platformAdminFilterLabelSx,
  platformAdminFilterSelectSx,
  platformAdminSelectMenuPaperSx,
} from './platformAdminStyleTokens';

export type AdminChipTone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

const ADMIN_CHIP_TONES: Record<AdminChipTone, { bg: string; color: string; border: string }> = {
  success: { bg: 'rgba(34, 197, 94, 0.14)', color: '#166534', border: 'rgba(34, 197, 94, 0.4)' },
  warning: { bg: '#fef3c7', color: '#92400e', border: 'rgba(217, 119, 6, 0.35)' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: 'rgba(239, 68, 68, 0.3)' },
  neutral: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  info: { bg: 'rgba(16, 64, 139, 0.08)', color: ip.navy, border: 'rgba(16, 64, 139, 0.22)' },
};

export function adminChipSx(tone: AdminChipTone) {
  const t = ADMIN_CHIP_TONES[tone];
  return {
    height: 24,
    fontWeight: 700,
    fontSize: '0.72rem',
    bgcolor: t.bg,
    color: t.color,
    border: `1px solid ${t.border}`,
    '& .MuiChip-label': { px: 1.1, letterSpacing: '0.01em' },
  } as const;
}

export function paymentStatusChipTone(status: string): AdminChipTone {
  const s = status.toLowerCase();
  if (['captured', 'paid', 'completed'].includes(s)) return 'success';
  if (['pending', 'pending_contact', 'pending_webhook', 'wire_pending', 'already_paid_pending'].includes(s)) {
    return 'warning';
  }
  if (s === 'failed') return 'error';
  return 'neutral';
}

export function formatPaymentStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'pending_contact') return 'Pending contact';
  if (s === 'pending_webhook') return 'Pending webhook';
  if (s === 'wire_pending') return 'Wire pending';
  if (s === 'already_paid_pending') return 'Already paid pending';
  if (s === 'captured') return 'Captured';
  if (s === 'paid') return 'Paid';
  if (s === 'completed') return 'Completed';
  if (s === 'failed') return 'Failed';
  if (!s || s === 'unknown') return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

export function PlatformAdminStatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  onClick,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ReactNode;
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
        '&:hover': onClick ?
          { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)', borderColor: '#cbd5e1' } :
          undefined,
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: ip.subtext,
                fontWeight: 600,
                fontSize: '0.875rem',
                lineHeight: 1.3,
                mb: 0.75,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                color: ip.heading,
                fontSize: '2rem',
                lineHeight: 1.1,
                wordBreak: 'break-word',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: ip.subtext,
                  display: 'block',
                  mt: 0.5,
                  fontSize: '0.8rem',
                  lineHeight: 1.35,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${accent}18`,
              color: accent,
              borderRadius: 2,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& .MuiSvgIcon-root': { fontSize: 24 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function PlatformAdminFilterControl<T extends string>({
  id,
  label,
  labels,
  value,
  minWidth,
  onChange,
}: {
  id: string;
  label: string;
  labels: Record<T, string>;
  value: T;
  minWidth: number;
  onChange: (value: T) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: PLATFORM_ADMIN_TOOLBAR_H,
        flexShrink: 0,
      }}
    >
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{ ...platformAdminFilterLabelSx, lineHeight: 1, display: 'flex', alignItems: 'center' }}
      >
        {label}
      </Typography>
      <Select
        id={id}
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        renderValue={(v) => labels[v as T]}
        MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
        sx={platformAdminFilterSelectSx(minWidth)}
      >
        {(Object.keys(labels) as T[]).map((key) => (
          <MenuItem key={key} value={key}>
            {labels[key]}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export function PlatformAdminTableSection({
  countLabel,
  children,
}: {
  countLabel: string;
  children: ReactNode;
}) {
  return (
    <Box sx={platformAdminCardSx}>
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2.5 }, pb: 0 }}>
        <Typography variant="body2" sx={{ color: ip.subtext, fontWeight: 500 }}>
          {countLabel}
        </Typography>
      </Box>
      <Box sx={{ p: { xs: 1.5, sm: 2 }, pt: 1.5 }}>{children}</Box>
    </Box>
  );
}
