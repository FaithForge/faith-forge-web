import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { ICreateKidGuardian } from '@/models/KidChurch';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

export const CreateKidGuardian = createAsyncThunk(
  'kid-church/CreateKidGuardian',
  async (payload: ICreateKidGuardian, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await makeApiRequest(
          ApiVerbs.POST,
          `/${MS_KID_CHURCH_PATH}/kid-guardian`,
          {
            data: {
              ...payload,
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        )
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Internal Error');
    }
  },
);

export const GetKidGuardian = createAsyncThunk(
  'kid-church/GetKidGuardian',
  async (nationalId: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_KID_CHURCH_PATH}/kid-guardian/${nationalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);
