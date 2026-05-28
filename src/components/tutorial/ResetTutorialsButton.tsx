import React, { useState } from 'react';
import { Button, type ButtonProps } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useTutorialContext } from './TutorialContext';

type ResetState = 'idle' | 'saving';

const ResetTutorialsButton: React.FC<ButtonProps> = ({
  children = 'Show tutorials again',
  disabled,
  onClick,
  ...buttonProps
}) => {
  const tutorialContext = useTutorialContext();
  const [resetState, setResetState] = useState<ResetState>('idle');

  if (!tutorialContext) return null;

  const handleClick: ButtonProps['onClick'] = async (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    setResetState('saving');
    try {
      await tutorialContext.resetAllPages();
    } catch {
      // Keep the button lightweight; the overlay will simply remain dismissed if persistence fails.
    } finally {
      setResetState('idle');
    }
  };

  return (
    <Button
      startIcon={<ReplayIcon />}
      disabled={disabled || resetState === 'saving'}
      onClick={handleClick}
      {...buttonProps}
    >
      {resetState === 'saving' ? 'Resetting tutorials...' : children}
    </Button>
  );
};

export default ResetTutorialsButton;
