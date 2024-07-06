import React from 'react';
import Navbar from '../../components/dashboard/NavigationBar';
import UserDropdown from '../../components/dashboard/UserDropdown';
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
          <header className="flex items-center justify-between p-4 bg-gray-900 shadow-md z-20 top-0 sticky">
            <h1 className="text-xl font-bold ml-20">Exam Dashboard</h1>
            <UserDropdown />
          </header>
          <main className="flex-1 p-6 ml-20 bg-gray-800">
            <ExamCardsGroup uid={uid} />
          </main>
        </div>
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default Dashboard;
