import React from 'react';
import './App.css';
import FrameCapture from './components/FrameCapture';
import FormEmbedding from './components/tally/FormEmbedding';
import AudioCapture from './components/AudioCapture';
import {persistor, store} from './state_data/reducer';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <div className="App">
          <FrameCapture />
          <AudioCapture />
          <FormEmbedding />
        </div>
      </PersistGate>
    </Provider>
  );
}

export default App;
