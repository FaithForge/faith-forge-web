import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { RootState } from '@/libs/state/redux';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';

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
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/registration/reprint`,
        options: {
          data: {
            kidId,
            churchId: church?.id,
            churchMeetingId: churchMeeting?.id,
            churchPrinterId: churchPrinter?.name,
            copies,
          },
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
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/registration/testPrint`,
        options: {
          data: {
            churchMeetingId: churchMeeting?.id,
            churchPrinterId: churchPrinter?.name,
          },
        },
      })
    ).data;

    return response;
  },
);
