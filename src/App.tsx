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
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Create dark theme for Material-UI
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: '#0f172a',
        paper: 'rgba(30, 41, 59, 0.8)',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
      primary: {
        main: '#8b5cf6',
      },
      secondary: {
        main: '#3b82f6',
      },
    },
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#8b5cf6',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.9)',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#8b5cf6',
            },
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          label: {
            color: '#ffffff',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#8b5cf6',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#8b5cf6',
            },
          },
        },
      },
    },
  });

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

  if (isMobileDevice) {
    return <MinimumWidthPage />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <div className="App">
            <AppRouter />
          </div>
          <Toaster />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default Sentry.withProfiler(App);
