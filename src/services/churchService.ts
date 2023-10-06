import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest } from '../api';

export const GetChurches = createAsyncThunk('church/getChurch', async () => {
  const response = (await makeApiRequest(ApiVerbs.GET, '/churches')).data;
  return response;
});

export const GetPrinters = createAsyncThunk(
  'church/getPrinters',
  async (churchId: string) => {
    const response = (
      await makeApiRequest(ApiVerbs.GET, `/churches/${churchId}/printers`)
    ).data;
    return response;
  },
);
