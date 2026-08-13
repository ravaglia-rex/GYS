import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  CheckCircleOutline as CheckIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { runPlatformAdminPipeline } from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminMutedCardSx,
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminPageHeader } from './platformAdminComponents';
import {
  PIPELINE_DEFINITIONS,
  type PipelineDefinition,
  type PipelineId,
} from './platformAdminPipelineDefinitions';

const PlatformAdminPipelinePage: React.FC = () => {
  const [pipelineRunning, setPipelineRunning] = useState<PipelineId | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [confirmPipeline, setConfirmPipeline] = useState<PipelineDefinition | null>(null);

  const runPipeline = async (pipeline: PipelineId) => {
    setConfirmPipeline(null);
    setPipelineRunning(pipeline);
    setPipelineMessage(null);
    try {
      await runPlatformAdminPipeline(pipeline);
      const label = PIPELINE_DEFINITIONS.find((p) => p.id === pipeline)?.title ?? pipeline;
      setPipelineMessage(`${label} completed successfully.`);
    } catch {
      setPipelineMessage('Pipeline run failed. Check Cloud Functions logs for details.');
    } finally {
      setPipelineRunning(null);
    }
  };

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Pipelines"
        subtitle="Manual data pipeline controls - super admin only"
      />

      <Card sx={platformAdminCardSx}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 2.5, maxWidth: 720 }}>
            Student tiers refresh weekly (Monday IST). School analytics refresh on the 1st of each month (IST). Use
            these controls only when you need an off-schedule refresh.
          </Typography>

          {pipelineMessage && (
            <Alert severity={pipelineMessage.includes('failed') ? 'error' : 'success'} sx={{ mb: 2.5 }}>
              {pipelineMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PIPELINE_DEFINITIONS.map((pipeline) => {
              const isRunning = pipelineRunning === pipeline.id;
              const anyRunning = pipelineRunning !== null;
              return (
                <Box
                  key={pipeline.id}
                  sx={{
                    ...platformAdminMutedCardSx,
                    p: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'stretch', md: 'flex-start' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: '1rem' }}>
                      {pipeline.title}
                    </Typography>
                    <Typography sx={{ color: ip.sidebarActiveText, fontWeight: 600, fontSize: '0.82rem', mb: 0.75 }}>
                      {pipeline.subtitle} · {pipeline.duration}
                    </Typography>
                    <Typography sx={{ color: ip.subtext, fontSize: '0.9rem', mb: 1.25, lineHeight: 1.55 }}>
                      {pipeline.summary}
                    </Typography>
                    <List dense disablePadding sx={{ color: ip.heading }}>
                      {pipeline.steps.map((step) => (
                        <ListItem key={step} disableGutters sx={{ py: 0.25, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.35, color: ip.statBlue }}>
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={step}
                            primaryTypographyProps={{ fontSize: '0.85rem', color: ip.heading, lineHeight: 1.45 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {pipeline.warning && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1, color: '#a16207' }}>
                        <WarningIcon sx={{ fontSize: 18, mt: 0.15 }} />
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{pipeline.warning}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    disabled={anyRunning}
                    onClick={() => setConfirmPipeline(pipeline)}
                    startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <RunIcon />}
                    sx={{ ...platformAdminPrimaryButtonSx, alignSelf: { xs: 'stretch', md: 'flex-start' }, minWidth: 160 }}
                  >
                    {isRunning ? 'Running…' : 'Run pipeline'}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(confirmPipeline)}
        onClose={() => setConfirmPipeline(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#ffffff',
            color: ip.heading,
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: `${ip.heading} !important` }}>
          Confirm pipeline run
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: ip.cardBorder, color: ip.heading }}>
          {confirmPipeline && (
            <>
              <Typography sx={{ fontWeight: 700, color: `${ip.heading} !important`, mb: 0.5 }}>
                {confirmPipeline.title}
              </Typography>
              <Typography sx={{ color: `${ip.subtext} !important`, mb: 2, lineHeight: 1.55 }}>
                {confirmPipeline.summary}
              </Typography>
              <Typography sx={{ fontWeight: 600, color: `${ip.heading} !important`, mb: 1, fontSize: '0.9rem' }}>
                This will:
              </Typography>
              <List dense disablePadding>
                {confirmPipeline.steps.map((step) => (
                  <ListItem key={step} disableGutters sx={{ py: 0.35, alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ minWidth: 28, mt: 0.2, color: ip.statBlue }}>
                      <CheckIcon sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={step}
                      primaryTypographyProps={{
                        fontSize: '0.88rem',
                        color: `${ip.heading} !important`,
                        lineHeight: 1.45,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {confirmPipeline.warning && (
                <>
                  <Divider sx={{ my: 1.5, borderColor: ip.cardBorder }} />
                  <Alert
                    severity="warning"
                    sx={{
                      bgcolor: ip.pendingBg,
                      color: '#92400e',
                      '& .MuiAlert-icon': { color: '#a16207' },
                    }}
                  >
                    {confirmPipeline.warning}
                  </Alert>
                </>
              )}
              <Typography sx={{ color: `${ip.subtext} !important`, fontSize: '0.85rem', mt: 2 }}>
                Estimated duration: {confirmPipeline.duration}. You can leave this page - the job continues on the
                server.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff' }}>
          <Button onClick={() => setConfirmPipeline(null)} sx={{ textTransform: 'none', color: ip.subtext }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={pipelineRunning !== null}
            onClick={() => confirmPipeline && runPipeline(confirmPipeline.id)}
            sx={platformAdminPrimaryButtonSx}
          >
            Yes, run {confirmPipeline?.title.toLowerCase()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformAdminPipelinePage;
