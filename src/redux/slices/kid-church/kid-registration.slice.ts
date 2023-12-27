import { ReduxDefaultStateWithoutData } from '@/models/Redux';
import {
  CreateKidRegistration,
  RemoveKidRegistration,
} from '@/redux/thunks/kid-church/kid-registration.thunk';
import { createSlice } from '@reduxjs/toolkit';

const initialState: ReduxDefaultStateWithoutData = {
  error: undefined,
  loading: false,
};

const kidRegistrationSlice = createSlice({
  name: 'kidRegistration',
  initialState: initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(CreateKidRegistration.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(CreateKidRegistration.fulfilled, (state) => {
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(CreateKidRegistration.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(RemoveKidRegistration.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(RemoveKidRegistration.fulfilled, (state) => {
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(RemoveKidRegistration.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
    // builder.addCase(ReprintRegisterLabelKid.pending, (state) => {
    //   state.error = undefined;
    //   state.loading = true;
    // });
    // builder.addCase(ReprintRegisterLabelKid.fulfilled, (state) => {
    //   state.error = undefined;
    //   state.loading = false;
    // });
    // builder.addCase(ReprintRegisterLabelKid.rejected, (state, action) => {
    //   state.error = action.error.message;
    //   state.loading = false;
    // });
  },
});

export const {} = kidRegistrationSlice.actions;
export default kidRegistrationSlice.reducer;
