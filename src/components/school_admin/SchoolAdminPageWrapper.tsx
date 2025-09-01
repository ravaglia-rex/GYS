import React from 'react';
import SchoolAdminLayout from '../../layouts/SchoolAdminLayout';

interface SchoolAdminPageWrapperProps {
  children: React.ReactNode;
}

const SchoolAdminPageWrapper: React.FC<SchoolAdminPageWrapperProps> = ({ children }) => {
  return (
    <SchoolAdminLayout>
      {children}
    </SchoolAdminLayout>
  );
};

export default SchoolAdminPageWrapper;
