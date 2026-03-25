import React from 'react';
import SchoolAdminLayout from '../../layouts/SchoolAdminLayout';
import { SchoolAdminBelowNavProvider } from '../../layouts/schoolAdminBelowNavContext';

interface SchoolAdminPageWrapperProps {
  children: React.ReactNode;
}

const SchoolAdminPageWrapper: React.FC<SchoolAdminPageWrapperProps> = ({ children }) => {
  return (
    <SchoolAdminBelowNavProvider>
      <SchoolAdminLayout>{children}</SchoolAdminLayout>
    </SchoolAdminBelowNavProvider>
  );
};

export default SchoolAdminPageWrapper;
