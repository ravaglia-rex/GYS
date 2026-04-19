import React from 'react';
import type { SvgIconProps } from '@mui/material';
import {
  Box, Card, CardContent, Typography, Button, Chip, Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  WorkspacePremium as PremiumIcon,
  School as StandardIcon,
  ArrowForward as ArrowIcon,
  LooksOne as EntryIcon,
} from '@mui/icons-material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

const RECOMMENDED_GOLD = '#fbbf24';
const STANDARD_RING = 'rgba(30, 58, 138, 0.7)';
/** Same as ip.statBlue - literal here so plan data has no palette init at module top */
const PLAN_STANDARD_BLUE = '#1D4ED8';

type PlanIcon = React.ComponentType<SvgIconProps>;

interface Plan {
  id: string;
  name: string;
  price: string;
  per: string;
  features: string[];
  accent: string;
  Icon: PlanIcon;
  current?: boolean;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'entry',
    name: 'Entry',
    price: '₹2,00,000',
    per: '/yr',
    accent: '#475569',
    Icon: EntryIcon,
    features: [
      'Assessment 1 (Pattern and Logic)',
      'Headline performance report',
      'Tier distribution analysis',
      'Path to next tier',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '₹3,00,000',
    per: '/yr',
    accent: PLAN_STANDARD_BLUE,
    Icon: StandardIcon,
    current: true,
    recommended: true,
    features: [
      'Assessments 1–3 (full reasoning triad)',
      'Full analytics & subscore breakdowns',
      'Grade-level analysis',
      'Comparative benchmarks (national, regional)',
      'Quarterly growth tracking',
      'Prioritized recommendations',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹5,00,000',
    per: '/yr',
    accent: '#8b5cf6',
    Icon: PremiumIcon,
    features: [
      'Everything in Standard',
      'All grades & custom cohorts',
      'Cohort analysis & cluster insights',
      'Consulting-style action plans',
      'Dedicated account manager',
      'Marketing toolkit (tier badges, parent comms)',
    ],
  },
];

function SchoolAdminSubscriptionPage() {
  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto', pb: 6 }}>
      {/* Header - aligned with For Schools / institutional pricing */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: ip.heading, fontWeight: 700, mb: 0.5 }}>
          Institutional Subscriptions
        </Typography>
        <Typography variant="body2" sx={{ color: ip.subtext }}>
          Annual institutional license. All students in selected grades included.
        </Typography>
      </Box>

      {/* Current plan banner */}
      <Box sx={{
        bgcolor: ip.cardMutedBg,
        border: `1px solid ${ip.cardBorder}`,
        borderRadius: 2.5, p: 3, mb: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ bgcolor: 'rgba(37,99,235,0.1)', borderRadius: 1.5, p: 1.2, display: 'flex' }}>
            <StandardIcon sx={{ color: ip.statBlue, fontSize: '1.5rem' }} />
          </Box>
          <Box>
            <Typography variant="body1" sx={{ color: ip.heading, fontWeight: 700 }}>
              Standard
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext }}>
              Renews annually · ₹3,00,000/yr · Next renewal: 1 Jan 2028
            </Typography>
          </Box>
        </Box>
        <Chip label="Active" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#16a34a', fontWeight: 700 }} />
      </Box>

      <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 2 }}>
        Available plans
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2.5,
        mb: 4,
      }}>
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            sx={{
              bgcolor: '#fff',
              boxShadow: plan.recommended ? 2 : 'none',
              border: plan.recommended
                ? `2px solid ${STANDARD_RING}`
                : `1px solid ${ip.cardBorder}`,
              borderRadius: 2.5,
              position: 'relative',
              overflow: 'visible',
              transition: 'all 0.18s',
              pt: plan.recommended ? 1.5 : 0,
              '&:hover': {
                border: `2px solid ${plan.accent}`,
                transform: 'translateY(-2px)',
              },
            }}
          >
            {plan.recommended && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: RECOMMENDED_GOLD,
                  color: '#0f172a',
                  px: 1.75,
                  py: 0.35,
                  borderRadius: 999,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  whiteSpace: 'nowrap',
                }}
              >
                Recommended
              </Box>
            )}
            <CardContent sx={{ p: '24px !important', pt: plan.recommended ? '28px !important' : '24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <plan.Icon sx={{ fontSize: '1.6rem', color: plan.accent }} />
                <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700 }}>{plan.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
                <Typography variant="h4" sx={{ color: plan.accent, fontWeight: 800 }}>{plan.price}</Typography>
                <Typography variant="body2" sx={{ color: ip.subtext }}>{plan.per}</Typography>
              </Box>
              <Divider sx={{ borderColor: ip.cardBorder, mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3, minHeight: { md: 200 } }}>
                {plan.features.map(text => (
                  <Box key={text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckIcon sx={{ fontSize: '1rem', color: '#16a34a', mt: '2px', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: ip.heading, fontSize: '0.875rem', lineHeight: 1.45 }}>
                      {text}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {plan.current ? (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled
                  sx={{ borderColor: ip.cardBorder, color: ip.subtext, borderRadius: 1.5, fontWeight: 600 }}
                >
                  Current plan
                </Button>
              ) : plan.id === 'entry' ? (
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ borderColor: ip.cardBorder, color: ip.heading, borderRadius: 1.5, fontWeight: 600, '&:hover': { bgcolor: ip.cardMutedBg } }}
                >
                  Contact sales
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowIcon />}
                  sx={{ bgcolor: plan.accent, fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: plan.accent, filter: 'brightness(0.9)' } }}
                >
                  Upgrade to {plan.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* EducationWorld strip - matches public For Schools page */}
      <Box
        sx={{
          borderRadius: '24px',
          bgcolor: '#eef4ff',
          px: { xs: 4, sm: 5, md: 6 },
          py: { xs: 4, sm: 5, md: 6 },
          mb: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: { xs: 3, sm: 4 } }}>
          <Box
            component="img"
            src="/EW%20logo.png"
            alt="EducationWorld"
            sx={{
              flexShrink: 0,
              height: { xs: 96, sm: 112 },
              width: 'auto',
              maxWidth: { xs: 176, sm: 208 },
              objectFit: 'contain',
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
              Presented by EducationWorld
            </Typography>
            <Typography sx={{ mt: 0.75, color: '#1e293b', fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: 1.6 }}>
              India&apos;s most trusted name in school assessment and ranking. Your data, our expertise.
              For the past 20 years, the annual EducationWorld India School Rankings — the world&apos;s
              largest and most comprehensive schools survey — has stimulated and motivated institutional
              managements to strive for delivering balanced holistic education and benchmark themselves
              with globally admired schools.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Billing info */}
      <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 2 }}>Billing information</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {[
              { label: 'Billing contact', value: 'Principal / Academic Director' },
              { label: 'Payment method', value: 'Bank Transfer / NEFT' },
              { label: 'GST number', value: 'Registered institution' },
              { label: 'Next renewal', value: '1 January 2028' },
            ].map(item => (
              <Box key={item.label} sx={{ flex: 1, minWidth: 180 }}>
                <Typography variant="caption" sx={{ color: ip.subtext, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 500, mt: 0.3 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ borderColor: ip.cardBorder, my: 2 }} />
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" size="small" sx={{ borderColor: ip.cardBorder, color: ip.subtext, '&:hover': { bgcolor: ip.cardMutedBg }, borderRadius: 1.5 }}>
              Download invoice
            </Button>
            <Button variant="outlined" size="small" sx={{ borderColor: ip.cardBorder, color: ip.subtext, '&:hover': { bgcolor: ip.cardMutedBg }, borderRadius: 1.5 }}>
              Update billing details
            </Button>
            <Button variant="text" size="small" sx={{ color: ip.statBlue, fontWeight: 600, fontSize: '0.8rem' }}>
              Contact sales for custom pricing →
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default SchoolAdminSubscriptionPage;
