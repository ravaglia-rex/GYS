import React from 'react';
import Navbar from '../../components/dashboard/NavigationBar';
import UserDropdown from '../../components/dashboard/UserDropdown';

const Dashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-800 text-white m-0 p-0">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end p-4 bg-gray-900 shadow-md">
          <UserDropdown />
        </header>
        <main className="flex-1 p-6">
          {/* <h1 className="text-2xl">Dashboard Content</h1> */}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
