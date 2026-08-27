import React, { useState } from 'react';
import { Box, Button, CircularProgress, LinearProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useParams } from 'react-router-dom';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  platformAdminOutlinedButtonSx,
  platformAdminPageContainerSx,
} from './platformAdminPageStyles';
import { PlatformAdminPageHeader } from './platformAdminComponents';
import { PlatformAdminItemBankSection } from './PlatformAdminItemBankSection';

const PlatformAdminItemBankPage: React.FC = () => {
  const { bank: bankParam } = useParams<{ bank?: string }>();
  const bankKind =
    bankParam === 'practice' ? 'practice' : bankParam === 'review' ? 'review' : 'official';
  const [loading, setLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  return (
    <Box
      sx={{
        ...platformAdminPageContainerSx,
        maxWidth: 1280,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        bgcolor: '#F1F5F9',
        borderRadius: { md: 3 },
        border: { md: `1px solid ${ip.cardBorder}` },
      }}
    >
      <PlatformAdminPageHeader
        title="Item Bank"
        subtitle="Official and practice pools by exam and level, with options and correct answers. Official also shows pick rates. Data is Redis-cached and not realtime."
        action={
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={() => setRefreshNonce((n) => n + 1)}
            disabled={loading}
            sx={platformAdminOutlinedButtonSx}
          >
            Refresh data
          </Button>
        }
      />

      {loading ? (
        <LinearProgress
          sx={{
            mb: 2,
            height: 3,
            borderRadius: 1,
            bgcolor: 'rgba(16, 64, 139, 0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: ip.navy },
          }}
        />
      ) : null}

      <PlatformAdminItemBankSection
        key={bankKind}
        refreshNonce={refreshNonce}
        onLoadingChange={setLoading}
      />
    </Box>
  );
};

export default PlatformAdminItemBankPage;
