import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest } from '../api';
import { RootState } from '../redux/store';

export const ReprintRegisterLabelKid = createAsyncThunk(
  'kid/reprintRegisterLabelKid',
  async (
    payload: {
      kidId: string;
      copies: number;
    },
    { getState },
  ) => {
    const state = getState() as RootState;
    const church = state.churchSlice.current;
    const churchPrinter = state.churchSlice.current;

    const churchMeeting = state.churchMeetingSlice.current;
    const { kidId, copies } = payload;

    const response = (
      await makeApiRequest(ApiVerbs.POST, `/registration/reprint`, {
        data: {
          kidId,
          churchId: church?.id,
          churchMeetingId: churchMeeting?.id,
          churchPrinterId: churchPrinter?.name,
          copies,
        },
      })
    ).data;

    return response;
  },
);

export const TestPrintLabel = createAsyncThunk(
  'kid/testPrintLabel',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const churchPrinter = state.churchSlice.current;

    const churchMeeting = state.churchMeetingSlice.current;

    const response = (
      await makeApiRequest(ApiVerbs.POST, `/registration/testPrint`, {
        data: {
          churchMeetingId: churchMeeting?.id,
          churchPrinterId: churchPrinter?.name,
        },
      })
    ).data;

    return response;
  },
);
