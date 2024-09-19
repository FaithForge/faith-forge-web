import { IChurches } from '@/models/Church';
import { GetChurches } from '@/redux/thunks/church/church.thunk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: IChurches = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const churchSlice = createSlice({
  name: 'church',
  initialState: initialState,
  reducers: {
    updateCurrentChurch: (state, action: PayloadAction<string>) => {
      state.current =
        state.data.find((church) => church.id === action.payload) ??
        state.current;
    },
    resetChurchState: (state) => {
      state.data = initialState.data;
      state.current = initialState.current;
      state.error = initialState.error;
      state.loading = initialState.loading;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurches.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurches.fulfilled, (state, action) => {
      state.data = action.payload;
      state.error = initialState.error;
      state.loading = false;
    });
    builder.addCase(GetChurches.rejected, (state, action) => {
      state.data = initialState.data;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurch, resetChurchState } = churchSlice.actions;
export default churchSlice.reducer;
