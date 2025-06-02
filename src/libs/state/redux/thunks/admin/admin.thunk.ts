/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { KidGuardianRelationCodeEnum } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

export const CleanCache = createAsyncThunk(
  'church/CleanCache',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.POST,
        url: `/admin/clear-cache`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Internal Error');
    }
  },
);

