import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest, MS_KID_CHURCH_PATH } from '../../../api';
import { RootState } from '../../store';

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
