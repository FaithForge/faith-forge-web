import { IAuth } from '@faith-forge-web/models';
import { createSlice } from '@reduxjs/toolkit';
import { UserLogin } from '../../thunks/user/auth.thunk';

const initialState: IAuth = {
  user: undefined,
  token: '',
  error: undefined,
  loading: false,
};

const AuthSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  reducers: {
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
      state.user = action.payload.user;
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

export const { logout } = AuthSlice.actions;
export default AuthSlice.reducer;
