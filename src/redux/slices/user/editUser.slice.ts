import { IEditUser } from '@/models/User';
import {
  GetUserByFullName,
  GetUserByNationalId,
  UpdateUser,
} from '@/redux/thunks/user/user.thunk';
import { createSlice } from '@reduxjs/toolkit';

const initialState: IEditUser = {
  user: undefined,
  error: undefined,
  loading: false,
};

const EditUserSlice = createSlice({
  name: 'ediUser',
  initialState: initialState,
  reducers: {
    resetEditUserState: (state) => {
      state.user = undefined;
      state.error = undefined;
      state.loading = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetUserByNationalId.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetUserByNationalId.fulfilled, (state, action) => {
      state.user = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetUserByNationalId.rejected, (state, action) => {
      state.user = undefined;
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(GetUserByFullName.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetUserByFullName.fulfilled, (state, action) => {
      state.user = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetUserByFullName.rejected, (state, action) => {
      state.user = undefined;
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(UpdateUser.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(UpdateUser.fulfilled, (state) => {
      state.user = undefined;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(UpdateUser.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { resetEditUserState } = EditUserSlice.actions;
export default EditUserSlice.reducer;
