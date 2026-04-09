import React from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSignupExitProvider } from '../contexts/StudentSignupExitContext';

/**
 * Wraps pre-complete student signup steps so exit guarding can share one modal (exam-style UI).
 * Welcome lives outside this layout.
 */
const StudentRegistrationFlowLayout: React.FC = () => (
  <StudentSignupExitProvider>
    <Outlet />
  </StudentSignupExitProvider>
);

export default StudentRegistrationFlowLayout;
