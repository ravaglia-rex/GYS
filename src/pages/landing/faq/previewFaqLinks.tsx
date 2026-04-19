import React from 'react';
import { Link } from 'react-router-dom';

const linkClassName =
  'font-semibold text-blue-900 underline underline-offset-2 decoration-blue-900/35 hover:text-blue-950 hover:decoration-blue-950';

export const FAQ_PREVIEW_HUB = '/for-schools/preview';
export const FAQ_SCHOOL_DASHBOARD_PREVIEW = '/for-schools/preview/dashboard';
export const FAQ_STUDENT_DASHBOARD_PREVIEW = '/students/preview/dashboard';
export const FAQ_SAMPLE_ASSESSMENT = '/for-schools/preview/assessment';

type FaqLinkProps = { to: string; children: React.ReactNode };

/** In-FAQ router links for preview hub, dashboards, and sample exam (matches SchoolPreviewHubPage routes). */
export const FaqLink: React.FC<FaqLinkProps> = ({ to, children }) => (
  <Link to={to} className={linkClassName}>
    {children}
  </Link>
);
