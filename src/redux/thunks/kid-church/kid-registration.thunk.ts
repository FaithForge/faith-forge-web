import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { ICreateKidRegistration } from '@/models/KidChurch';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const CreateKidRegistration = createAsyncThunk(
  'kid-church/CreateKidRegistration',
  async (payload: ICreateKidRegistration, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchMeetingSlice = state.churchMeetingSlice;
    const authSlice = state.authSlice;
    const accountSlice = state.accountSlice;
    const churchPrinterSlice = state.churchPrinterSlice;

    const response = (
      await makeApiRequest(
        ApiVerbs.POST,
        `/${MS_KID_CHURCH_PATH}/kid-registration`,
        {
          data: {
            ...payload,
            churchMeetingId: churchMeetingSlice.current?.id,
            churchPrinterId: churchPrinterSlice.current?.name,
            log: `Registrado por ${authSlice.user?.firstName} ${authSlice.user?.lastName} del grupo ${accountSlice.churchGroup} en la impresora ${churchPrinterSlice.current?.name}`,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);
