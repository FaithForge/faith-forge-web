import { ApiVerbs, MS_CHURCH_PATH, makeApiRequest } from '@/api';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const GetChurches = createAsyncThunk(
  'church/GetChurches',
  async (withAdditionalData: boolean) => {
    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_CHURCH_PATH}/churches`, {
        params: {
          withAdditionalData,
        },
      })
    ).data;
    return response;
  },
);

export const GetChurchMeetings = createAsyncThunk(
  'church/GetChurchMeetings',
  async (churchId: string) => {
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_CHURCH_PATH}/${churchId}/meetings`,
      )
    ).data;
    return response;
  },
);

export const GetChurchPrinters = createAsyncThunk(
  'church/GetChurchPrinters',
  async (churchId: string) => {
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_CHURCH_PATH}/${churchId}/printers`,
      )
    ).data;
    return response;
  },
);
