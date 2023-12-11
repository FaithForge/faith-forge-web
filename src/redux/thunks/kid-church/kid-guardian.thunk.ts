import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { ICreateKidGuardian } from '@/models/KidChurch';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const CreateKidGuardian = createAsyncThunk(
  'kid-church/CreateKid',
  async (payload: ICreateKidGuardian, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

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
