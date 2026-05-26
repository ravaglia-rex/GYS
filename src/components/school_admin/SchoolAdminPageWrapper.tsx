import React from 'react';
import SchoolAdminLayout from '../../layouts/SchoolAdminLayout';
import { SchoolAdminBelowNavProvider } from '../../layouts/schoolAdminBelowNavContext';
import SchoolTutorialProvider from '../tutorial/SchoolTutorialProvider';

interface SchoolAdminPageWrapperProps {
  children: React.ReactNode;
}

const SchoolAdminPageWrapper: React.FC<SchoolAdminPageWrapperProps> = ({ children }) => {
  return (
    <SchoolAdminBelowNavProvider>
      <SchoolTutorialProvider>
        <SchoolAdminLayout>{children}</SchoolAdminLayout>
      </SchoolTutorialProvider>
    </SchoolAdminBelowNavProvider>
  );
};

export default SchoolAdminPageWrapper;
