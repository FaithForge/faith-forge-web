import { IAuth } from '@/libs/models';
import {
  getMainUserRole,
  sortUserRolesByPriority,
  UserRole,
} from '@/libs/utils/auth';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserLogin } from '../../thunks/user/auth.thunk';

const initialState: IAuth = {
  user: undefined,
  token: '',
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
    logout: (state) => {
      state.user = undefined;
      state.token = '';
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
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(UserLogin.rejected, (state, action) => {
      state.user = undefined;
      state.token = '';
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { logout, changeCurrentRole } = AuthSlice.actions;
export default AuthSlice.reducer;
