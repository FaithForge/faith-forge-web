import { IChurchMeeting } from '@/libs/models';
import { createSlice } from '@reduxjs/toolkit';
import {
  BulkUpdateChurchMeetingStates,
  GetAllChurchMeetingsAdmin,
} from '../../thunks/church/church.thunk';

export interface AdminChurchMeetingState {
  meetings: IChurchMeeting[];
  loadingMeetings: boolean;
  loadingUpdate: boolean;
  error?: string;
  success: boolean;
}

const initialState: AdminChurchMeetingState = {
  meetings: [],
  loadingMeetings: false,
  loadingUpdate: false,
  error: undefined,
  success: false,
};

const adminChurchMeetingSlice = createSlice({
  name: 'adminChurchMeeting',
  initialState,
  reducers: {
    resetAdminChurchMeetingStatus: (state) => {
      state.error = undefined;
      state.success = false;
    },
  },
  extraReducers(builder) {
    // GetAllChurchMeetingsAdmin
    builder.addCase(GetAllChurchMeetingsAdmin.pending, (state) => {
      state.loadingMeetings = true;
      state.error = undefined;
      state.success = false;
    });
    builder.addCase(GetAllChurchMeetingsAdmin.fulfilled, (state, action) => {
      state.meetings = action.payload ?? [];
      state.loadingMeetings = false;
    });
    builder.addCase(GetAllChurchMeetingsAdmin.rejected, (state, action) => {
      state.meetings = [];
      state.loadingMeetings = false;
      state.error = action.error.message;
    });

    // BulkUpdateChurchMeetingStates
    builder.addCase(BulkUpdateChurchMeetingStates.pending, (state) => {
      state.loadingUpdate = true;
      state.error = undefined;
      state.success = false;
    });
    builder.addCase(BulkUpdateChurchMeetingStates.fulfilled, (state) => {
      state.loadingUpdate = false;
      state.success = true;
    });
    builder.addCase(BulkUpdateChurchMeetingStates.rejected, (state, action) => {
      state.loadingUpdate = false;
      state.error = (action.payload as string) ?? action.error.message;
    });
  },
});

export const { resetAdminChurchMeetingStatus } = adminChurchMeetingSlice.actions;
export default adminChurchMeetingSlice.reducer;
