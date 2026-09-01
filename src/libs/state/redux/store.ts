import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import adminChurchMeetingSlice from './slices/church/adminChurchMeeting.slice';
import churchCampusSlice from './slices/church/churchCampus.slice';
import churchMeetingSlice from './slices/church/churchMeeting.slice';
import churchPrinterSlice from './slices/church/churchPrinter.slice';
import ministrySlice from './slices/church/ministry.slice';
import printerModeSlice from './slices/church/printerMode.slice';
import volunteerSlice from './slices/church/volunteer.slice';
import volunteerApplicationSlice from './slices/church/volunteerApplication.slice';
import volunteerAttendanceSlice from './slices/church/volunteerAttendance.slice';
import kidGroupRegisteredSlice from './slices/kid-church/kid-group-registered.slice';
import kidGroupSlice from './slices/kid-church/kid-group.slice';
import kidGuardianSlice from './slices/kid-church/kid-guardian.slice';
import kidMedicalConditionSlice from './slices/kid-church/kid-medical-condition.slice';
import kidRegistrationSlice from './slices/kid-church/kid-registration.slice';
import kidSlice from './slices/kid-church/kid.slice';
import scanQRKidGuardianSlice from './slices/kid-church/scan-code-kid-registration.slice';
import accountSlice from './slices/user/account.slice';
import authSlice from './slices/user/auth.slice';
import editUserSlice from './slices/user/editUser.slice';
import userSlice from './slices/user/users.slice';

const reducers = combineReducers({
  adminChurchMeetingSlice,
  churchCampusSlice,
  churchMeetingSlice,
  churchPrinterSlice,
  ministrySlice,
  printerModeSlice,
  volunteerSlice,
  volunteerApplicationSlice,
  volunteerAttendanceSlice,
  kidGroupSlice,
  kidMedicalConditionSlice,
  kidRegistrationSlice,
  kidSlice,
  kidGuardianSlice,
  authSlice,
  accountSlice,
  kidGroupRegisteredSlice,
  editUserSlice,
  userSlice,
  scanQRKidGuardianSlice,
});

const persistConfig = {
  timeout: 10,
  key: 'root',
  storage,
  whitelist: [
    'authSlice',
    'churchCampusSlice',
    'churchMeetingSlice',
    'churchPrinterSlice',
    'printerModeSlice',
    'kidGroupSlice',
    'kidMedicalConditionSlice',
  ],
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

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
