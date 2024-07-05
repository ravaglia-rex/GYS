import React from 'react';
import Navbar from '../../components/dashboard/NavigationBar';
import UserDropdown from '../../components/dashboard/UserDropdown';
import PaymentsTabs from '../../components/dashboard/PaymentsTabs';
import { auth } from '../../firebase/firebase';

const PaymentHistory: React.FC = () => {
  const uid = auth.currentUser?.uid || '';
  return (
    <div className="flex bg-gray-800 text-white m-0 p-0 min-h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 bg-gray-900 shadow-md z-20 top-0 sticky">
          <h1 className="text-xl font-bold ml-20">Payment History</h1>
          <UserDropdown />
        </header>
        <main className="flex-1 p-6 ml-20 bg-gray-800">
          <PaymentsTabs uid={uid}/>
        </main>
      </div>
    </div>
  );
};

export default PaymentHistory;