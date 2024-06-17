import React, { useState, useEffect } from 'react';
import './styles/index.css';
import AppRouter from './router/AppRouter';
import { persistor, store } from './state_data/reducer';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from './components/ui/toaster';
import MinimumWidthPage from './pages/MinimumWidthPage';

function App() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobileWidthThreshold = 768; // Max width for mobile devices
      if (window.innerWidth < mobileWidthThreshold) {
        setIsMobileDevice(true);
      } else {
        setIsMobileDevice(false);
      }
    };

    handleResize(); // Check on initial mount
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (isMobileDevice) {
    return <MinimumWidthPage />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <div className="App">
          <AppRouter />
        </div>
        <Toaster />
      </PersistGate>
    </Provider>
  );
}

export default App;
