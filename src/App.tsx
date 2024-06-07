import React from 'react';
// import './App.css';
import './styles/index.css';
import AppRouter from './router/AppRouter';
import {persistor, store} from './state_data/reducer';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from './components/ui/toaster';

function App() {
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
