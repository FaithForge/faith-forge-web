import { IKidGroups } from '@/models/KidChurch';
import { GetKidGroups } from '@/redux/thunks/kid-church/kid-group.thunk';
import { createSlice } from '@reduxjs/toolkit';

const initialState: IKidGroups = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const kidGroupSlice = createSlice({
  name: 'kidGroup',
  initialState: initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(GetKidGroups.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidGroups.fulfilled, (state, action) => {
      state.data = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKidGroups.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const {} = kidGroupSlice.actions;
export default kidGroupSlice.reducer;
