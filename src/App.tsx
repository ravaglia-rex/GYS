import React, { useState, useEffect } from 'react';
import './styles/index.css';
import './sentry/sentry';
import * as Sentry from '@sentry/react';
import AppRouter from './router/AppRouter';
import { persistor, store } from './state_data/reducer';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from './components/ui/toaster';
import MinimumWidthPage from './pages/MinimumWidthPage';
import UnsupportedBrowserPage from './pages/UnsupportedBrowserPage';

function App() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isChromiumBrowser, setIsChromiumBrowser] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobileWidthThreshold = 768;
      if (window.innerWidth < mobileWidthThreshold) {
        setIsMobileDevice(true);
      } else {
        setIsMobileDevice(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const isChromiumBased = () => {
      const userAgent = navigator.userAgent;
      const isChrome = userAgent.includes('Chrome');
      const isEdge = userAgent.includes('Edg');
      const isArc = userAgent.includes('Arc');
      return isChrome || isEdge || isArc;
    };
    if(!isChromiumBased()) {
      setIsChromiumBrowser(false);
    }
  }, []);

  if (isMobileDevice) {
    return <MinimumWidthPage />;
  }

  if(!isChromiumBrowser){
    return <UnsupportedBrowserPage />;
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

export default Sentry.withProfiler(App);
