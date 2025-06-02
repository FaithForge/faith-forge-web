import { IChurchCampus, IChurchCampuses } from '@/libs/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetChurchCampuses } from '../../thunks/church/church.thunk';

const initialState: IChurchCampuses = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const churchCampusSlice = createSlice({
  name: 'churchCampus',
  initialState: initialState,
  reducers: {
    updateCurrentChurchCampus: (state, action: PayloadAction<string>) => {
      state.current =
        state.data.find(
          (churchCampus: IChurchCampus) => churchCampus.id === action.payload,
        ) ?? state.current;
    },
    resetChurchCampusState: (state) => {
      state.data = initialState.data;
      state.current = initialState.current;
      state.error = initialState.error;
      state.loading = initialState.loading;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchCampuses.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchCampuses.fulfilled, (state, action) => {
      state.data = action.payload;
      state.current = action.payload[0];
      state.error = initialState.error;
      state.loading = false;
    });
    builder.addCase(GetChurchCampuses.rejected, (state, action) => {
      state.data = initialState.data;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurchCampus, resetChurchCampusState } =
  churchCampusSlice.actions;
export default churchCampusSlice.reducer;
