import { IAuth } from '@/models/KidChurch';
import { UserLogin } from '@/redux/thunks/user/auth.thunk';
import { createSlice } from '@reduxjs/toolkit';

const initialState: IAuth = {
  user: undefined,
  token: '',
  error: undefined,
  loading: false,
};

const AuthSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  reducers: {},
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

export const {} = AuthSlice.actions;
export default AuthSlice.reducer;
