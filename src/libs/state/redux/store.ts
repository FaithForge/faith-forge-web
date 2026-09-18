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
  createTransform,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './api/baseApi';
import adminChurchMeetingSlice from './slices/church/adminChurchMeeting.slice';
import churchCampusSlice from './slices/church/churchCampus.slice';
import churchMeetingSlice from './slices/church/churchMeeting.slice';
import churchPrinterSlice from './slices/church/churchPrinter.slice';
import ministrySlice from './slices/church/ministry.slice';
import printerModeSlice from './slices/church/printerMode.slice';
import volunteerSlice from './slices/church/volunteer.slice';
import volunteerApplicationSlice from './slices/church/volunteerApplication.slice';
import volunteerAttendanceSlice from './slices/church/volunteerAttendance.slice';
import volunteerContextSlice from './slices/church/volunteerContext.slice';
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
  [baseApi.reducerPath]: baseApi.reducer,
  adminChurchMeetingSlice,
  churchCampusSlice,
  churchMeetingSlice,
  churchPrinterSlice,
  ministrySlice,
  printerModeSlice,
  volunteerSlice,
  volunteerApplicationSlice,
  volunteerAttendanceSlice,
  volunteerContextSlice,
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

/**
 * Redux Persist transform to only persist the currently selected active context
 * ('current') for campuses, meetings, and printers, while excluding server-side
 * lists ('data') from localStorage to guarantee fresh data fetching on app startup.
 */
const activeContextOnlyTransform = createTransform(
  // Transform state on its way to being serialized and stored.
  (inboundState: any, key) => {
    if (key === 'churchCampusSlice') {
      return {
        current: inboundState?.current,
        churchTerminologyOverrides: inboundState?.churchTerminologyOverrides,
        church: inboundState?.church,
      };
    }
    if (key === 'churchMeetingSlice') {
      return {
        current: inboundState?.current,
      };
    }
    if (key === 'churchPrinterSlice') {
      return {
        current: inboundState?.current,
      };
    }
    if (key === 'ministrySlice') {
      return {
        ministries: inboundState?.ministries || [],
      };
    }
    return inboundState;
  },
  // Transform state being rehydrated
  (outboundState: any, key) => {
    if (key === 'churchCampusSlice') {
      return {
        data: [],
        error: undefined,
        loading: false,
        ...outboundState,
      };
    }
    if (key === 'churchMeetingSlice') {
      return {
        data: [],
        error: undefined,
        loading: false,
        meetingsByCampus: {},
        ...outboundState,
      };
    }
    if (key === 'churchPrinterSlice') {
      return {
        data: [],
        error: undefined,
        loading: false,
        printersByCampus: {},
        adminPrintersByCampus: {},
        ...outboundState,
      };
    }
    if (key === 'ministrySlice') {
      return {
        ministries: [],
        loadingMinistries: false,
        errorMinistries: null,
        areasByMinistry: {},
        loadingAreas: false,
        errorAreas: null,
        groupsByMinistry: {},
        loadingGroups: false,
        errorGroups: null,
        serviceAreaGroups: [],
        loadingServiceAreaGroups: false,
        errorServiceAreaGroups: null,
        selectedMinistryId: null,
        loadingAction: false,
        errorAction: null,
        ...outboundState,
      };
    }
    return outboundState;
  },
  { whitelist: ['churchCampusSlice', 'churchMeetingSlice', 'churchPrinterSlice', 'ministrySlice'] },
);

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'authSlice',
    'volunteerContextSlice',
    'churchCampusSlice',
    'churchMeetingSlice',
    'churchPrinterSlice',
    'printerModeSlice',
    'ministrySlice',
  ],
  transforms: [activeContextOnlyTransform],
};

const persistedReducer = persistReducer<ReturnType<typeof reducers>>(persistConfig, reducers);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

// Auto-invalidate relevant RTK Query tags when offline queue syncs
if (typeof window !== 'undefined') {
  window.addEventListener('offlineQueue:synced', () => {
    store.dispatch(baseApi.util.invalidateTags(['KidGroup', 'KidRegistered', 'ChurchMeeting']));
  });
}

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof reducers>;
export type AppDispatch = typeof store.dispatch;
