import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IChurchMeeting, IChurchMeetings } from '../../models/ChurchMeeting';
import { GetChurchMeetings } from '../../services/churchMeetingService';

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
    updateChurchMeetings: (state, action: PayloadAction<IChurchMeeting[]>) => {
      state.data = action.payload;
      state.current = undefined;
    },
    updateCurrentChurchMeeting: (state, action: PayloadAction<string>) => {
      state.current = state.data.find((church) => church.id === action.payload);
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

export const { updateChurchMeetings, updateCurrentChurchMeeting } =
  churchMeetingSlice.actions;
export default churchMeetingSlice.reducer;
