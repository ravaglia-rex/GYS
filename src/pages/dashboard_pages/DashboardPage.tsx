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
      <div className="flex bg-gray-800 text-white m-0 p-0 min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <CommonHeader />
          <main className="flex-1 p-6 ml-20 bg-gray-800">
            <ExamCardsGroup uid={uid} />
          </main>
        </div>
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default Dashboard;
