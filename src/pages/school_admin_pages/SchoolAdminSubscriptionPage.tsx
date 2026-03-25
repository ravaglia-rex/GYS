import React from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  WorkspacePremium as PremiumIcon,
  School as StandardIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  per: string;
  description: string;
  features: PlanFeature[];
  accent: string;
  icon: React.ReactElement;
  current?: boolean;
  tag?: string;
}

const PLANS: Plan[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: '₹2,00,000',
    per: '/year',
    description: 'Core institutional access for schools getting started with GYS assessments.',
    accent: ip.statBlue,
    icon: <StandardIcon sx={{ fontSize: '1.6rem', color: ip.statBlue }} />,
    current: true,
    features: [
      { text: 'Unlimited student connections', included: true },
      { text: 'Full access for school-paid students', included: true },
      { text: 'Invitation code generation', included: true },
      { text: 'Institutional performance reports (.docx)', included: true },
      { text: 'Analytics & grade-level breakdown', included: true },
      { text: 'Student approval workflow', included: true },
      { text: 'Consulting-style action plans', included: false },
      { text: 'Dedicated account manager', included: false },
      { text: 'Faculty training workshops', included: false },
      { text: 'Marketing toolkit & tier badges for parents', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹5,00,000',
    per: '/year',
    description: 'Full-service institutional partnership with hands-on support and marketing tools.',
    accent: '#8b5cf6',
    icon: <PremiumIcon sx={{ fontSize: '1.6rem', color: '#8b5cf6' }} />,
    tag: 'Recommended',
    features: [
      { text: 'Everything in Standard', included: true },
      { text: 'Consulting-style action plans', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Faculty training workshops', included: true },
      { text: 'Marketing toolkit & tier badges for parents', included: true },
      { text: 'Priority report generation', included: true },
      { text: 'Custom branded parent communication templates', included: true },
      { text: 'Quarterly strategic review meetings', included: true },
    ],
  },
];

const SchoolAdminSubscriptionPage: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: ip.heading, fontWeight: 700, mb: 0.5 }}>
          Subscription
        </Typography>
        <Typography variant="body2" sx={{ color: ip.subtext }}>
          Manage your institutional subscription and explore upgrade options
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
              Standard Subscription
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext }}>
              Renews annually · ₹2,00,000/yr · Next renewal: 1 Jan 2028
            </Typography>
          </Box>
        </Box>
        <Chip label="Active" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#16a34a', fontWeight: 700 }} />
      </Box>

      {/* Plans */}
      <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 2 }}>
        Available Plans
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5, mb: 4 }}>
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            sx={{
              bgcolor: '#fff',
              boxShadow: 'none',
              border: plan.current ? `2px solid ${plan.accent}` : `1px solid ${ip.cardBorder}`,
              borderRadius: 2.5,
              position: 'relative',
              transition: 'all 0.18s',
              '&:hover': { border: `2px solid ${plan.accent}`, transform: 'translateY(-2px)' },
            }}
          >
            {(plan.tag || plan.current) && (
              <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                {plan.current && <Chip label="Current Plan" size="small" sx={{ bgcolor: `${plan.accent}20`, color: plan.accent, fontWeight: 700, fontSize: '0.68rem' }} />}
                {plan.tag && !plan.current && <Chip label={plan.tag} size="small" sx={{ bgcolor: `${plan.accent}20`, color: plan.accent, fontWeight: 700, fontSize: '0.68rem' }} />}
              </Box>
            )}
            <CardContent sx={{ p: '28px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                {plan.icon}
                <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700 }}>{plan.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                <Typography variant="h4" sx={{ color: plan.accent, fontWeight: 800 }}>{plan.price}</Typography>
                <Typography variant="body2" sx={{ color: ip.subtext }}>{plan.per}</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: ip.subtext, mb: 2.5 }}>{plan.description}</Typography>
              <Divider sx={{ borderColor: ip.cardBorder, mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                {plan.features.map(f => (
                  <Box key={f.text} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon sx={{ fontSize: '0.9rem', color: f.included ? '#16a34a' : ip.cardBorder }} />
                    <Typography variant="body2" sx={{ color: f.included ? ip.heading : ip.subtext, fontSize: '0.82rem' }}>
                      {f.text}
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
                  Current Plan
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

      {/* Billing info */}
      <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 2 }}>Billing Information</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {[
              { label: 'Billing Contact', value: 'Principal / Academic Director' },
              { label: 'Payment Method', value: 'Bank Transfer / NEFT' },
              { label: 'GST Number', value: 'Registered Institution' },
              { label: 'Next Renewal', value: '1 January 2028' },
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
              Download Invoice
            </Button>
            <Button variant="outlined" size="small" sx={{ borderColor: ip.cardBorder, color: ip.subtext, '&:hover': { bgcolor: ip.cardMutedBg }, borderRadius: 1.5 }}>
              Update Billing Details
            </Button>
            <Button variant="text" size="small" sx={{ color: ip.statBlue, fontWeight: 600, fontSize: '0.8rem' }}>
              Contact Sales for Custom Pricing →
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SchoolAdminSubscriptionPage;
