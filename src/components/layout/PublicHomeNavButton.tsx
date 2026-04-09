import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentSignupExitOptional } from '../../contexts/StudentSignupExitContext';

const GYS_BLUE = '#1e3a8a';

type PublicHomeNavButtonProps = {
  className?: string;
  /** Filled style for headers that only show Home + brand (e.g. login). */
  prominent?: boolean;
};

/**
 * Visible "Home" control for logged-out marketing / registration flows (returns to `/`).
 */
const PublicHomeNavButton: React.FC<PublicHomeNavButtonProps> = ({
  className = '',
  prominent = false,
}) => {
  const navigate = useNavigate();
  const signupExit = useStudentSignupExitOptional();

  const base = prominent
    ? 'text-sm font-semibold px-5 py-2.5 rounded-xl text-white shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-150'
    : 'text-sm font-semibold text-slate-700 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0';

  return (
    <button
      type="button"
      onClick={() => {
        const goHome = () => {
          navigate('/');
          window.scrollTo(0, 0);
        };
        if (signupExit) {
          signupExit.requestLeave(goHome);
          return;
        }
        goHome();
      }}
      className={`${base} ${className}`.trim()}
      style={prominent ? { backgroundColor: GYS_BLUE } : undefined}
    >
      Home
    </button>
  );
};

export default PublicHomeNavButton;
