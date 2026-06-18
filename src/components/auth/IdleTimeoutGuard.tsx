import React, { ReactNode } from 'react';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import IdleTimeoutWarningDialog from './IdleTimeoutWarningDialog';

interface IdleTimeoutGuardProps {
  children: ReactNode;
  enabled: boolean;
}

const IdleTimeoutGuard: React.FC<IdleTimeoutGuardProps> = ({ children, enabled }) => {
  const { warningOpen, secondsRemaining, staySignedIn } = useIdleTimeout({ enabled });

  return (
    <>
      {children}
      <IdleTimeoutWarningDialog
        open={warningOpen}
        secondsRemaining={secondsRemaining}
        onStaySignedIn={staySignedIn}
      />
    </>
  );
};

export default IdleTimeoutGuard;
