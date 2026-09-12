import { IAuth } from '@/libs/models';
import {
  AppRole,
  getMainUserRole,
  sortUserRolesByPriority,
  UserRole,
} from '@/libs/utils/auth';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FetchMyVolunteerPermissions, UserLogin } from '../../thunks/user/auth.thunk';
import { clearHttpCache } from '@/libs/utils/http';
import { updateBiometricSessionToken } from '@/libs/utils/biometrics';

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
    changeCurrentRole: (state, action: PayloadAction<AppRole>) => {
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
      updateBiometricSessionToken({
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      }).catch(() => {});
    },
    updateUserRoles: (state, action: PayloadAction<AppRole[]>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          roles: sortUserRolesByPriority(action.payload as any),
        };
        const isSuperAdmin = (action.payload as any[])?.includes(UserRole.SUPER_ADMIN);
        if (isSuperAdmin && state.currentRole && state.currentRole !== UserRole.USER) {
          return;
        }
        if (!state.currentRole || !action.payload.includes(state.currentRole)) {
          state.currentRole = getMainUserRole(action.payload as any);
        }
      }
    },
    setAuthSession: (
      state,
      action: PayloadAction<{
        user: any;
        token: string;
        refreshToken?: string;
        currentRole?: AppRole;
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
    builder.addCase(FetchMyVolunteerPermissions.fulfilled, (state, action) => {
      if (state.user && action.payload && Array.isArray(action.payload)) {
        const merged = Array.from(
          new Set([...(state.user.roles || []), ...action.payload])
        ) as AppRole[];
        state.user.roles = sortUserRolesByPriority(merged as any);

        const isSuperAdmin = (state.user.roles as any[])?.includes(UserRole.SUPER_ADMIN);
        if (isSuperAdmin && state.currentRole && state.currentRole !== UserRole.USER) {
          return;
        }

        if (
          !state.currentRole ||
          state.currentRole === UserRole.USER ||
          !merged.includes(state.currentRole)
        ) {
          state.currentRole = getMainUserRole(state.user.roles as any);
        }
      }
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
