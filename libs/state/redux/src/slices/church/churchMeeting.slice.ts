import { IChurchMeetings } from '@faith-forge-web/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetChurchMeetings } from '../../thunks/church/church.thunk';

const initialState: IChurchMeetings = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const churchMeetingSlice = createSlice({
  name: 'churchMeeting',
  initialState: initialState,
  reducers: {
    updateCurrentChurchMeeting: (state, action: PayloadAction<string>) => {
      state.current = state.data.find(
        (churchMeeting: any) => churchMeeting.id === action.payload,
      );
    },
    resetChurchMeetingState: (state) => {
      state.data = initialState.data;
      state.current = initialState.current;
      state.error = initialState.error;
      state.loading = initialState.loading;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchMeetings.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchMeetings.fulfilled, (state, action) => {
      state.data = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetChurchMeetings.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurchMeeting, resetChurchMeetingState } =
  churchMeetingSlice.actions;
export default churchMeetingSlice.reducer;
