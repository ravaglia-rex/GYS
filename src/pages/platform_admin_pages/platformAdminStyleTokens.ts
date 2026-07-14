import { institutionalPalette as ip } from '../../theme/institutionalPalette';

export const PLATFORM_ADMIN_PAGE_MAX_WIDTH = 1200;
export const PLATFORM_ADMIN_TOOLBAR_H = 40;

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

export const platformAdminTablePaperSx = {
  boxShadow: 'none',
  bgcolor: '#fff',
  color: ip.heading,
  border: `1px solid ${ip.cardBorder}`,
  borderRadius: 1.5,
  overflowX: 'auto',
  maxWidth: '100%',
} as const;

export const platformAdminTableSx = {
  bgcolor: '#fff',
  minWidth: 720,
  '& .MuiTableCell-root': {
    borderColor: ip.cardBorder,
    color: ip.heading,
    py: 1.5,
    px: 2,
    fontSize: '0.875rem',
  },
  '& .MuiTableRow-root:last-child .MuiTableCell-root': {
    borderBottom: 0,
  },
  '& .MuiTableRow-root:hover': {
    bgcolor: 'rgba(16, 64, 139, 0.04)',
  },
} as const;

export const platformAdminTableHeadRowSx = {
  bgcolor: ip.cardMutedBg,
  '& .MuiTableCell-root': {
    color: ip.heading,
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '0.01em',
    borderBottom: `1px solid ${ip.cardBorder}`,
    py: 1.25,
    whiteSpace: 'nowrap',
  },
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
    borderRadius: 1.5,
    color: ip.heading,
    '& fieldset': { borderColor: ip.cardBorder },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: ip.navy },
  },
  '& .MuiInputBase-input': { color: ip.heading },
  '& .MuiInputBase-input::placeholder': { color: ip.subtext, opacity: 1 },
} as const;

export const platformAdminSearchFieldSx = {
  ...platformAdminTextFieldSx,
  '& .MuiOutlinedInput-root': {
    ...platformAdminTextFieldSx['& .MuiOutlinedInput-root'],
    height: PLATFORM_ADMIN_TOOLBAR_H,
    minHeight: PLATFORM_ADMIN_TOOLBAR_H,
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  '& .MuiInputBase-input': {
    ...platformAdminTextFieldSx['& .MuiInputBase-input'],
    py: 0,
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiInputAdornment-root': {
    height: 'auto',
    maxHeight: 'none',
    marginTop: '0 !important',
    marginBottom: '0 !important',
  },
} as const;

export const platformAdminFilterToolbarRowSx = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1.5,
  alignItems: 'center',
} as const;

export const platformAdminStatsGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr 1fr',
    sm: 'repeat(2, 1fr)',
    lg: 'repeat(4, 1fr)',
  },
  gap: 2,
  mb: 2.5,
  alignItems: 'stretch',
} as const;

export const platformAdminClearFiltersButtonSx = {
  height: PLATFORM_ADMIN_TOOLBAR_H,
  minHeight: PLATFORM_ADMIN_TOOLBAR_H,
  alignSelf: 'center',
  textTransform: 'none',
  color: '#b91c1c',
  borderColor: 'rgba(239, 68, 68, 0.35)',
  fontWeight: 600,
  borderRadius: 1.5,
  px: 1.75,
  boxSizing: 'border-box',
  '&:hover': { borderColor: '#b91c1c', bgcolor: 'rgba(239, 68, 68, 0.06)' },
} as const;

export function platformAdminFilterSelectSx(minWidth = 168) {
  return {
    minWidth,
    width: minWidth,
    maxWidth: minWidth,
    height: PLATFORM_ADMIN_TOOLBAR_H,
    minHeight: PLATFORM_ADMIN_TOOLBAR_H,
    boxSizing: 'border-box' as const,
    bgcolor: '#fff',
    color: `${ip.heading} !important`,
    borderRadius: 1.5,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: ip.cardBorder },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy, borderWidth: 1 },
    '&.Mui-disabled': {
      bgcolor: '#F8FAFC',
      opacity: 1,
      '& .MuiOutlinedInput-notchedOutline': { borderColor: ip.cardBorder },
      '& .MuiSelect-select': {
        color: `${ip.subtext} !important`,
        WebkitTextFillColor: ip.subtext,
      },
      '& .MuiSvgIcon-root': { color: ip.subtext },
    },
    '& .MuiOutlinedInput-root': {
      height: PLATFORM_ADMIN_TOOLBAR_H,
      minHeight: PLATFORM_ADMIN_TOOLBAR_H,
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    '& .MuiSelect-select': {
      color: `${ip.heading} !important`,
      WebkitTextFillColor: ip.heading,
      display: 'flex',
      alignItems: 'center',
      minHeight: PLATFORM_ADMIN_TOOLBAR_H - 2,
      py: 0,
      px: 1.25,
      boxSizing: 'border-box' as const,
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    '& .MuiSvgIcon-root': { color: ip.heading },
  };
}

export const platformAdminSelectMenuPaperSx = {
  bgcolor: '#fff',
  color: ip.heading,
  border: `1px solid ${ip.cardBorder}`,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
  mt: 0.5,
  '& .MuiMenuItem-root': {
    color: ip.heading,
    fontSize: '0.875rem',
    fontWeight: 500,
    '&.Mui-selected': {
      bgcolor: ip.sidebarActiveBg,
      color: ip.sidebarActiveText,
      fontWeight: 600,
    },
    '&.Mui-selected:hover': { bgcolor: 'rgba(37, 99, 235, 0.12)' },
  },
} as const;

export const platformAdminFilterLabelSx = {
  color: ip.subtext,
  fontWeight: 600,
  fontSize: '0.8rem',
  whiteSpace: 'nowrap',
  flexShrink: 0,
} as const;

export const platformAdminDialogPaperSx = {
  borderRadius: 2,
  bgcolor: '#fff',
  overflow: 'hidden',
  boxShadow: '0 20px 48px rgba(15, 23, 42, 0.18)',
} as const;

export const platformAdminDialogFieldLabelSx = {
  ...platformAdminFilterLabelSx,
  display: 'block',
  mb: 0.75,
  whiteSpace: 'normal',
} as const;

export const platformAdminDialogTextFieldSx = {
  ...platformAdminTextFieldSx,
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  '& .MuiOutlinedInput-root': {
    ...platformAdminTextFieldSx['& .MuiOutlinedInput-root'],
    minHeight: PLATFORM_ADMIN_TOOLBAR_H,
  },
  '& .MuiFormHelperText-root': {
    color: ip.subtext,
    mt: 0.75,
    mx: 0,
    lineHeight: 1.4,
  },
} as const;

export const platformAdminDialogSelectSx = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  bgcolor: '#fff',
  color: `${ip.heading} !important`,
  borderRadius: 1.5,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: ip.cardBorder },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy, borderWidth: 1 },
  '& .MuiOutlinedInput-root': {
    minHeight: PLATFORM_ADMIN_TOOLBAR_H,
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  '& .MuiSelect-select': {
    color: `${ip.heading} !important`,
    display: 'flex',
    alignItems: 'center',
    py: 1,
    px: 1.25,
    boxSizing: 'border-box',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  '& .MuiSvgIcon-root': { color: ip.heading },
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
  borderRadius: 1.5,
  '&:hover': { bgcolor: '#0b3366', boxShadow: 'none' },
  '&.Mui-disabled': { bgcolor: '#94a3b8', color: '#fff' },
} as const;

export const platformAdminOutlinedButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  color: ip.navy,
  borderColor: ip.cardBorder,
  bgcolor: '#fff',
  borderRadius: 1.5,
  '&:hover': { borderColor: ip.navy, bgcolor: ip.cardMutedBg },
} as const;

export const platformAdminTextButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  color: ip.navy,
  borderRadius: 1.5,
  px: 1.25,
  minWidth: 0,
  '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.08)' },
} as const;

export const platformAdminTableHeadCellSx = {
  fontWeight: 700,
  color: ip.heading,
  bgcolor: ip.cardMutedBg,
  borderBottom: `1px solid ${ip.cardBorder}`,
} as const;

export { ip as platformAdminPalette };
