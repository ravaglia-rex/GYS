import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface IdleTimeoutWarningDialogProps {
  open: boolean;
  secondsRemaining: number;
  onStaySignedIn: () => void;
}

const IdleTimeoutWarningDialog: React.FC<IdleTimeoutWarningDialogProps> = ({
  open,
  secondsRemaining,
  onStaySignedIn,
}) => {
  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          backgroundColor: '#1e293b',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Session expiring soon</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'text.primary' }}>
          You have been inactive. You will be signed out in{' '}
          <strong>{secondsRemaining}</strong> second{secondsRemaining === 1 ? '' : 's'}.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onStaySignedIn} autoFocus>
          Stay signed in
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdleTimeoutWarningDialog;
