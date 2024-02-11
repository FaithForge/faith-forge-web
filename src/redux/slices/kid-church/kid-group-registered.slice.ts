import { IKidGroupRegistered } from '@/models/KidChurch';
import { GetKidGroupRegistered } from '@/redux/thunks/kid-church/kid-group.thunk';
import { createSlice } from '@reduxjs/toolkit';

const initialState: IKidGroupRegistered = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const kidGroupRegisteredSlice = createSlice({
  name: 'kidGroupRegistered',
  initialState: initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(GetKidGroupRegistered.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidGroupRegistered.fulfilled, (state, action) => {
      state.data = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKidGroupRegistered.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const {} = kidGroupRegisteredSlice.actions;
export default kidGroupRegisteredSlice.reducer;