import { IKidGuardians } from '@/models/KidChurch';
import {
  CreateKidGuardian,
  GetKidGuardian,
} from '@/redux/thunks/kid-church/kid-guardian.thunk';
import { createSlice } from '@reduxjs/toolkit';

const initialState: IKidGuardians = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const kidGuardianSlice = createSlice({
  name: 'kidGuardian',
  initialState: initialState,
  reducers: {
    cleanCurrentKidGuardian: (state) => {
      state.current = undefined;
      state.loading = false;
      state.error = undefined;
    },
  },
  extraReducers(builder) {
    builder.addCase(CreateKidGuardian.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(CreateKidGuardian.fulfilled, (state) => {
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(CreateKidGuardian.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(GetKidGuardian.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidGuardian.fulfilled, (state, action) => {
      state.current = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKidGuardian.rejected, (state, action) => {
      state.current = undefined;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { cleanCurrentKidGuardian } = kidGuardianSlice.actions;
export default kidGuardianSlice.reducer;