import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  STUDENT_SIGNUP_EXIT_DIALOG_BODY,
  STUDENT_SIGNUP_EXIT_DIALOG_TITLE,
} from '../constants/studentSignupExit';

export type StudentSignupExitContextValue = {
  /** Opens the styled leave dialog; runs `onProceed` only if the user confirms leaving. */
  requestLeave: (onProceed: () => void) => void;
};

const StudentSignupExitContext = createContext<StudentSignupExitContextValue | null>(null);

export function useStudentSignupExit(): StudentSignupExitContextValue {
  const ctx = useContext(StudentSignupExitContext);
  if (!ctx) {
    throw new Error('useStudentSignupExit must be used within StudentRegistrationFlowLayout');
  }
  return ctx;
}

/** For shared components (e.g. Home) that may render inside or outside the signup flow. */
export function useStudentSignupExitOptional(): StudentSignupExitContextValue | null {
  return useContext(StudentSignupExitContext);
}

export function StudentSignupExitProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  const requestLeave = useCallback((onProceed: () => void) => {
    pendingRef.current = onProceed;
    setOpen(true);
  }, []);

  const handleStay = useCallback(() => {
    pendingRef.current = null;
    setOpen(false);
  }, []);

  const handleLeave = useCallback(() => {
    const fn = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    fn?.();
  }, []);

  const value = useMemo(() => ({ requestLeave }), [requestLeave]);

  return (
    <StudentSignupExitContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onClose={handleStay}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1e293b',
              backgroundImage: 'none',
              color: '#f8fafc',
              maxWidth: 520,
              width: '100%',
              opacity: 1,
              p: 0,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            pt: { xs: 3, sm: 3.5 },
            pb: 2,
            fontWeight: 800,
            fontSize: '1.2rem',
          }}
        >
          {STUDENT_SIGNUP_EXIT_DIALOG_TITLE}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 0, pb: 2 }}>
          <DialogContentText
            component="div"
            sx={{
              m: 0,
              color: 'rgba(248, 250, 252, 0.98)',
              typography: 'body2',
              lineHeight: 1.65,
            }}
          >
            {STUDENT_SIGNUP_EXIT_DIALOG_BODY}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            pb: { xs: 3, sm: 3.5 },
            pt: 0,
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button onClick={handleStay} sx={{ color: '#f8fafc' }}>
            Stay and continue signup
          </Button>
          <Button onClick={handleLeave} color="error" variant="contained">
            Leave without saving
          </Button>
        </DialogActions>
      </Dialog>
    </StudentSignupExitContext.Provider>
  );
}
