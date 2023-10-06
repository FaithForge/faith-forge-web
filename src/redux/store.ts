import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import churchMeetingSlice from './slices/churchMeetingSlice';
import churchSlice from './slices/churchSlice';
import kidGuardianSlice from './slices/kidGuardianSlice';
import kidSlice from './slices/kidSlice';
import userSlice from './slices/userSlice';

const reducers = combineReducers({
  churchMeetingSlice,
  churchSlice,
  kidGuardianSlice,
  kidSlice,
  userSlice,
});

const persistConfig = {
  timeout: 10,
  key: 'root',
  storage,
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
