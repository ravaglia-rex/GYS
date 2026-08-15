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

export type AnalyticsSectionAccent = 'navy' | 'teal' | 'amber' | 'slate' | 'violet';

const ANALYTICS_SECTION_ACCENTS: Record<
  AnalyticsSectionAccent,
  { bar: string; soft: string; stepBg: string; stepText: string }
> = {
  navy: {
    bar: ip.navy,
    soft: 'rgba(16, 64, 139, 0.04)',
    stepBg: 'rgba(16, 64, 139, 0.1)',
    stepText: ip.navy,
  },
  teal: {
    bar: '#0f766e',
    soft: 'rgba(15, 118, 110, 0.05)',
    stepBg: 'rgba(15, 118, 110, 0.12)',
    stepText: '#115e59',
  },
  amber: {
    bar: '#b45309',
    soft: 'rgba(180, 83, 9, 0.05)',
    stepBg: 'rgba(180, 83, 9, 0.12)',
    stepText: '#92400e',
  },
  slate: {
    bar: '#475569',
    soft: '#f8fafc',
    stepBg: '#e2e8f0',
    stepText: '#334155',
  },
  violet: {
    bar: '#6d28d9',
    soft: 'rgba(109, 40, 217, 0.05)',
    stepBg: 'rgba(109, 40, 217, 0.1)',
    stepText: '#5b21b6',
  },
};

/** Numbered analytics block with accent rail for scanning dense dashboards. */
export function PlatformAdminAnalyticsSection({
  step,
  title,
  subtitle,
  accent = 'navy',
  action,
  children,
  dense = false,
}: {
  step?: string | number;
  title: string;
  subtitle?: ReactNode;
  accent?: AnalyticsSectionAccent;
  action?: ReactNode;
  children: ReactNode;
  dense?: boolean;
}) {
  const a = ANALYTICS_SECTION_ACCENTS[accent];
  return (
    <Box
      sx={{
        ...platformAdminCardSx,
        mb: 2.5,
        overflow: 'hidden',
        borderLeft: `4px solid ${a.bar}`,
        backgroundImage: `linear-gradient(180deg, ${a.soft} 0%, #fff 88px)`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
          px: { xs: 2, sm: 2.5 },
          pt: dense ? 1.75 : 2.25,
          pb: dense ? 1.25 : 1.5,
          borderBottom: `1px solid ${ip.cardBorder}`,
        }}
      >
        <Box sx={{ minWidth: 0, display: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: subtitle ? 0.5 : 0 }}>
            {step != null && step !== '' ? (
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 28,
                  height: 28,
                  px: 0.75,
                  borderRadius: 999,
                  bgcolor: a.stepBg,
                  color: a.stepText,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}
              >
                {step}
              </Box>
            ) : null}
            <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: '1.05rem', lineHeight: 1.25 }}>
              {title}
            </Typography>
          </Box>
          {subtitle ? (
            <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.45, pl: step != null ? 5 : 0 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Box>
      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: dense ? 1.75 : 2.25 }}>{children}</Box>
    </Box>
  );
}

export function accuracyChipTone(pct: number | null | undefined): AdminChipTone {
  if (pct == null || !Number.isFinite(pct)) return 'neutral';
  if (pct >= 85) return 'success';
  if (pct >= 70) return 'info';
  if (pct >= 50) return 'warning';
  return 'error';
}

export function PlatformAdminAccuracyChip({ pct }: { pct: number | null | undefined }) {
  if (pct == null || !Number.isFinite(pct)) {
    return <PlatformAdminChip label="-" tone="neutral" />;
  }
  return <PlatformAdminChip label={`${pct}%`} tone={accuracyChipTone(pct)} />;
}

export function PlatformAdminStatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  onClick,
  selected = false,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ReactNode;
  accent: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <Card
      sx={{
        ...platformAdminCardSx,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        borderColor: selected ? accent : ip.cardBorder,
        boxShadow: selected ? `0 0 0 1px ${accent}` : undefined,
        '&:hover': onClick
          ? { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)', borderColor: selected ? accent : '#cbd5e1' }
          : undefined,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-pressed={onClick ? selected : undefined}
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
  valueLabels,
  value,
  minWidth,
  onChange,
  disabled = false,
  fullWidth = false,
}: {
  id: string;
  label: string;
  labels: Record<T, string>;
  /** Shorter labels for the closed select; menu items still use `labels`. */
  valueLabels?: Partial<Record<T, string>>;
  value: T;
  minWidth: number;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Stretch select to fill available row space. */
  fullWidth?: boolean;
}) {
  // Guard against null/undefined during Fast Refresh (HMR) partial module reloads.
  const safeLabels = labels ?? ({} as Record<T, string>);
  const optionKeys = Object.keys(safeLabels) as T[];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: PLATFORM_ADMIN_TOOLBAR_H,
        ...(fullWidth
          ? { flex: '1 1 0', minWidth: Math.min(minWidth, 140), width: '100%' }
          : { flexShrink: 0 }),
      }}
    >
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{
          ...platformAdminFilterLabelSx,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          color: disabled ? ip.subtext : platformAdminFilterLabelSx.color,
        }}
      >
        {label}
      </Typography>
      <Select
        id={id}
        size="small"
        value={value}
        disabled={disabled || optionKeys.length === 0}
        onChange={(e) => onChange(e.target.value as T)}
        renderValue={(v) =>
          valueLabels?.[v as T] ?? safeLabels[v as T] ?? String(v)
        }
        MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
        sx={{
          ...platformAdminFilterSelectSx(minWidth),
          ...(fullWidth ? { width: '100%', minWidth: 0, maxWidth: 'none', flex: 1 } : null),
        }}
      >
        {optionKeys.map((key) => (
          <MenuItem key={key} value={key}>
            {safeLabels[key]}
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
