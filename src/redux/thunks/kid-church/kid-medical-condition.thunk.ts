import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const GetKidMedicalConditions = createAsyncThunk(
  'kid-church/GetKidMedicalConditions',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_KID_CHURCH_PATH}/kid-medical-conditions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);
