import { ApiVerbs, MS_CHURCH_PATH, makeApiRequest } from '@/api';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const GetKidMedicalConditions = createAsyncThunk(
  'kid-church/GetKidMedicalConditions',
  async () => {
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_CHURCH_PATH}/kid-medical-conditions`,
      )
    ).data;

    return response;
  },
);
