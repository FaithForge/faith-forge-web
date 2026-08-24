import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/libs/state/redux/store';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { setupChunkLoadErrorAutoRecover } from '@/libs/utils/appCache';

// Automatically recover when dynamic chunks fail after new deployments
setupChunkLoadErrorAutoRecover();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
