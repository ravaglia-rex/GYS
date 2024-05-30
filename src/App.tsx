import React from 'react';
import './App.css';
import AppRouter from './router/AppRouter';
import {persistor, store} from './state_data/reducer';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <div className="App">
          <AppRouter />
        </div>
      </PersistGate>
    </Provider>
  );
}

export default App;
