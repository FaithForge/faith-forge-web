import { IAuth } from '@/libs/models';
import {
  getMainUserRole,
  sortUserRolesByPriority,
  UserRole,
} from '@/libs/utils/auth';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserLogin } from '../../thunks/user/auth.thunk';
import { clearHttpCache } from '@/libs/utils/http';

const initialState: IAuth = {
  user: undefined,
  token: '',
  refreshToken: undefined,
  currentRole: undefined,
  error: undefined,
  loading: false,
};

const AuthSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  reducers: {
    changeCurrentRole: (state, action: PayloadAction<UserRole>) => {
      state.currentRole = action.payload;
    },
    updateTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string }>
    ) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
    updateUserRoles: (state, action: PayloadAction<UserRole[]>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          roles: sortUserRolesByPriority(action.payload),
        };
        if (!state.currentRole || !action.payload.includes(state.currentRole)) {
          state.currentRole = getMainUserRole(action.payload);
        }
      }
    },
    setAuthSession: (
      state,
      action: PayloadAction<{
        user: any;
        token: string;
        refreshToken?: string;
        currentRole?: UserRole;
      }>
    ) => {
      state.user = {
        ...action.payload.user,
        roles: sortUserRolesByPriority(action.payload.user?.roles),
      };
      state.currentRole =
        action.payload.currentRole || getMainUserRole(action.payload.user?.roles);
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.error = undefined;
      state.loading = false;
    },
    updateAuthUser: (state, action: PayloadAction<any>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },
    logout: (state) => {
      clearHttpCache();
      state.user = undefined;
      state.token = '';
      state.refreshToken = undefined;
      state.currentRole = undefined;
      state.error = undefined;
      state.loading = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(UserLogin.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(UserLogin.fulfilled, (state, action) => {
      state.user = {
        ...action.payload.user,
        roles: sortUserRolesByPriority(action.payload.user?.roles),
      };
      state.currentRole = getMainUserRole(action.payload.user?.roles);
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(UserLogin.rejected, (state, action) => {
      state.user = undefined;
      state.token = '';
      state.refreshToken = undefined;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const {
  logout,
  changeCurrentRole,
  setAuthSession,
  updateAuthUser,
  updateTokens,
  updateUserRoles,
} = AuthSlice.actions;
export default AuthSlice.reducer;
