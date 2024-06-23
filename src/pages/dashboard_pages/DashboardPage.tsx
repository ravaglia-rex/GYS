import React from 'react';
import Navbar from '../../components/dashboard/NavigationBar';
import UserDropdown from '../../components/dashboard/UserDropdown';
import ExamCardsGroup from '../../components/dashboard/ExamCardsGroup';
import { auth } from '../../firebase/firebase';

const Dashboard: React.FC = () => {
  const uid = auth.currentUser?.uid || '';

  return (
    <div className="flex h-screen bg-gray-800 text-white m-0 p-0">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 bg-gray-900 shadow-md">
          <h1 className="text-xl font-bold ml-20">Exam Dashboard</h1>
          <UserDropdown />
        </header>
        <main className="flex-1 p-6 ml-20">
          <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
          <ExamCardsGroup uid={uid} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
