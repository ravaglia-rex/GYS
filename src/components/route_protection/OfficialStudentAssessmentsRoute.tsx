import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { auth } from '../../firebase/firebase';
import {
  canAccessOfficialStudentAssessments,
  resolveOfficialAssessmentViewerEmail,
} from '../../utils/officialStudentAssessmentsAccess';

interface OfficialStudentAssessmentsRouteProps {
  children: ReactNode;
}

/**
 * Optional start-gate for official exam take flows.
 * Browse routes should NOT use this — students should still see locked/coming-soon UI.
 * Prefer live Firebase email over persisted Redux (stale school-admin sessions).
 */
const OfficialStudentAssessmentsRoute: React.FC<OfficialStudentAssessmentsRouteProps> = ({
  children,
}) => {
  const reduxEmail = useSelector((state: RootState) => state.auth.user?.email);
  const userEmail = resolveOfficialAssessmentViewerEmail(auth.currentUser?.email, reduxEmail);

  if (!canAccessOfficialStudentAssessments(userEmail)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default OfficialStudentAssessmentsRoute;
