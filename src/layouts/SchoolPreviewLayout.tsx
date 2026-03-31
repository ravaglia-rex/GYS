import React from 'react';
import { Outlet } from 'react-router-dom';
import SchoolAdminLayout from './SchoolAdminLayout';
import { SchoolAdminBelowNavProvider } from './schoolAdminBelowNavContext';
import { GREENFIELD_POC_EMAIL } from '../data/schoolPreviewMock';

const PREVIEW_PATH_PREFIX = '/for-schools/preview';

/**
 * Same shell as signed-in school admins (`SchoolAdminLayout`): navy header, white sidebar, top nav,
 * amber preview strip (above the institution hero), and Exit preview (no Firestore / auth).
 */
export default function SchoolPreviewLayout() {
  return (
    <SchoolAdminBelowNavProvider>
      <SchoolAdminLayout
        interactivePreview={{
          pathPrefix: PREVIEW_PATH_PREFIX,
          pocEmail: GREENFIELD_POC_EMAIL,
        }}
      >
        <Outlet />
      </SchoolAdminLayout>
    </SchoolAdminBelowNavProvider>
  );
}
