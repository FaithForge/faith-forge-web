import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest } from '../api';

export const GetKidGuardian = createAsyncThunk(
  'kidGuardian/getKidGuardian',
  async (payload: { nationalId: string }) => {
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/registration/guardians/${payload.nationalId}`,
      )
    ).data;

    return response;
  },
);
