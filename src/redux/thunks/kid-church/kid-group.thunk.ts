import { ApiVerbs, MS_CHURCH_PATH, makeApiRequest } from '@/api';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const GetKidGroups = createAsyncThunk(
  'kid-church/GetKidGroups',
  async () => {
    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_CHURCH_PATH}/kid-groups`)
    ).data;

    return response;
  },
);
