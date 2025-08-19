import React from 'react';
import Navbar from '../../components/dashboard/NavigationBar';
import CommonHeader from '../../components/dashboard/CommonHeader';
import ExamCardsGroup from '../../components/dashboard/ExamCardsGroup';
import { auth } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';

const Dashboard: React.FC = () => {
  const uid = auth.currentUser?.uid || '';

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'Dashboard');
      }}
    >
      <div className="flex bg-gray-950 text-gray-100 m-0 p-0 min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col pl-20">
          <CommonHeader />
          <main className="flex-1 p-6 bg-gradient-to-b from-gray-950 to-gray-900/80">
            <div className="max-w-7xl mx-auto">
              <ExamCardsGroup uid={uid} />
            </div>
          </main>
        </div>
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default Dashboard;
