import React from 'react';
import Navbar from '../../components/dashboard/NavigationBar';
import CommonHeader from '../../components/dashboard/CommonHeader';
import PaymentsTabs from '../../components/dashboard/PaymentsTabs';
import { auth } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';
import { useLocation } from 'react-router-dom';

const PaymentHistory: React.FC = () => {
  const uid = auth.currentUser?.uid || '';
  const location = useLocation();
  const highlightPaymentsEntry = location.state ? location.state.highlightPaymentsEntry : "";

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'PaymentHistory');
      }}
    >
      <div className="flex bg-gray-800 text-white m-0 p-0 min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <CommonHeader />
          <main className="flex-1 p-6 ml-20 bg-gray-800">
            <PaymentsTabs uid={uid} highlightPaymentsEntry={highlightPaymentsEntry || ""}/>
          </main>
        </div>
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default PaymentHistory;