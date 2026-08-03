import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { auth } from '../../firebase/firebase';
import { canAccessOfficialStudentAssessments } from '../../utils/officialStudentAssessmentsAccess';

interface OfficialStudentAssessmentsRouteProps {
  children: ReactNode;
}

/** Blocks official assessment student routes unless globally enabled or email is beta-allowlisted. */
const OfficialStudentAssessmentsRoute: React.FC<OfficialStudentAssessmentsRouteProps> = ({
  children,
}) => {
  const userEmail =
    useSelector((state: RootState) => state.auth.user?.email) ?? auth.currentUser?.email ?? '';

  if (!canAccessOfficialStudentAssessments(userEmail)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default OfficialStudentAssessmentsRoute;
