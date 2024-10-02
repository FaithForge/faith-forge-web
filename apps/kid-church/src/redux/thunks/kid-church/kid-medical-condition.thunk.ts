import { HttpRequestMethod } from '@faith-forge-web/common-types/global';
import { makeApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { MS_KID_CHURCH_PATH } from '../../../api';
import { RootState } from '../../store';

export const GetKidMedicalConditions = createAsyncThunk(
  'kid-church/GetKidMedicalConditions',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        HttpRequestMethod.GET,
        `/${MS_KID_CHURCH_PATH}/kid-medical-conditions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    ).data;

    return response;
  }
);
