import { IChurchMeeting, IChurchMeetings } from '@/libs/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetChurchMeetings } from '../../thunks/church/church.thunk';

export interface ChurchMeetingSliceState extends IChurchMeetings {
  loadedCampusId?: string;
  meetingsByCampus: Record<string, IChurchMeeting[]>;
}

const initialState: ChurchMeetingSliceState = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
  loadedCampusId: undefined,
  meetingsByCampus: {},
};

const churchMeetingSlice = createSlice({
  name: 'churchMeeting',
  initialState: initialState,
  reducers: {
    updateCurrentChurchMeeting: (state, action: PayloadAction<string>) => {
      let match = state.data.find(
        (churchMeeting: any) => churchMeeting.id === action.payload,
      );
      if (!match && state.meetingsByCampus) {
        for (const list of Object.values(state.meetingsByCampus)) {
          match = list.find((m: any) => m.id === action.payload);
          if (match) break;
        }
      }
      if (match) {
        state.current = match;
      }
    },
    resetChurchMeetingState: (state) => {
      state.data = initialState.data;
      state.current = initialState.current;
      state.error = initialState.error;
      state.loading = initialState.loading;
      state.loadedCampusId = undefined;
      state.meetingsByCampus = {};
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchMeetings.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchMeetings.fulfilled, (state, action) => {
      const incoming = action.payload || [];
      const campusId = action.meta.arg?.churchCampusId;

      if (!state.meetingsByCampus) {
        state.meetingsByCampus = {};
      }
      if (campusId) {
        state.meetingsByCampus[campusId] = incoming;
      }

      state.data = incoming;
      state.error = undefined;
      state.loading = false;
      state.loadedCampusId = campusId;

      if (state.current) {
        // Refresh current meeting instance only if it belongs to this campus
        const match = incoming.find((m: any) => m.id === state.current?.id);
        if (match) {
          state.current = match;
        } else {
          state.current = undefined;
        }
      }
    });
    builder.addCase('auth/logout', (state) => {
      state.current = undefined;
      state.loadedCampusId = undefined;
    });

    builder.addCase(GetChurchMeetings.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurchMeeting, resetChurchMeetingState } =
  churchMeetingSlice.actions;
export default churchMeetingSlice.reducer;
