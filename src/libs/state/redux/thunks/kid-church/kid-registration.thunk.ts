import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';

// Note: CreateKidRegistration, ReprintKidRegistration, and RemoveKidRegistration have been migrated to kidChurchApi RTK Query endpoints.

export const ScanCodeKidRegistration = createAsyncThunk(
  'kid-church/ScanCodeKidRegistration',
  async (code: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchMeeting = state.churchMeetingSlice;

    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kid-registration/scan-code`,
        options: {
          params: {
            code,
            registrationChurchMeetingId: churchMeeting.current?.id,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    return response;
  },
);
