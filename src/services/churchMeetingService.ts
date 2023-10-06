import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest } from '../api';

export const GetChurchMeetings = createAsyncThunk(
  'churchMeeting/getChurchMeetings',
  async (meetingId: string) => {
    if (!meetingId) {
      return [];
    }
    const response = (
      await makeApiRequest(ApiVerbs.GET, `/churches/${meetingId}/meetings`)
    ).data;
    return response;
  },
);
