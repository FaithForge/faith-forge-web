import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';

export const GetKidMedicalConditions = createAsyncThunk(
  'kid-church/GetKidMedicalConditions',
  async (payload: { force?: boolean } | void, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kid-medical-conditions`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    return response;
  },
  {
    condition: (payload, { getState }) => {
      if (payload && typeof payload === 'object' && payload.force) return true;
      const state = getState() as RootState;
      const hasConditions = (state.kidMedicalConditionSlice.data?.length ?? 0) > 0;
      return !hasConditions;
    },
  },
);
