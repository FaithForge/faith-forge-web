import { ReduxDefaultStateWithoutData } from '@/libs/models';
import { createSlice } from '@reduxjs/toolkit';
import {
  CreateKidRegistration,
  RemoveKidRegistration,
  ReprintKidRegistration,
} from '../../thunks/kid-church/kid-registration.thunk';

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
    builder.addCase(ReprintKidRegistration.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(ReprintKidRegistration.fulfilled, (state) => {
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(ReprintKidRegistration.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

// export const {} = kidRegistrationSlice.actions;
export default kidRegistrationSlice.reducer;
