import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/libs/state/redux/store';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { setupChunkLoadErrorAutoRecover } from '@/libs/utils/appCache';
import { setupRemoteVersionWatcher } from '@/libs/utils/versionCheck';

// Initialize dayjs Spanish locale globally for the application
dayjs.locale('es');

// Automatically recover when dynamic chunks fail after new deployments
setupChunkLoadErrorAutoRecover();

// Automatically check if a new version was deployed and purge client caches (production only)
if (import.meta.env.PROD) {
  setupRemoteVersionWatcher();
}

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
