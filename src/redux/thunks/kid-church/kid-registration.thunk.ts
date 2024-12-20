import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { ICreateKidRegistration } from '@/models/KidChurch';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const CreateKidRegistration = createAsyncThunk(
  'kid-church/CreateKidRegistration',
  async (payload: ICreateKidRegistration, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchSlice = state.churchSlice;
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
            churchId: churchSlice.current?.id,
            churchMeetingId: churchMeetingSlice.current?.id,
            churchPrinterId: churchPrinterSlice.current?.name,
            log: `Registrado por ${authSlice.user?.firstName} ${authSlice.user?.lastName} del grupo ${accountSlice.churchGroup}`,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);

export const ReprintKidRegistration = createAsyncThunk(
  'kid-church/ReprintKidRegistration',
  async (
    payload: {
      id: string;
      copies: number;
    },
    { getState },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const { id, copies } = payload;
    const churchPrinterSlice = state.churchPrinterSlice;

    const response = (
      await makeApiRequest(
        ApiVerbs.POST,
        `/${MS_KID_CHURCH_PATH}/kid-registration/reprint`,
        {
          data: {
            id,
            copies,
            churchPrinterId: churchPrinterSlice.current?.name,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);

export const RemoveKidRegistration = createAsyncThunk(
  'kid-church/RemoveKidRegistration',
  async (
    payload: {
      id: string;
    },
    { getState },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const { id } = payload;

    const response = (
      await makeApiRequest(
        ApiVerbs.DELETE,
        `/${MS_KID_CHURCH_PATH}/kid-registration/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);

export const ScanCodeKidRegistration = createAsyncThunk(
  'kid-church/ScanCodeKidRegistration',
  async (code: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchMeeting = state.churchMeetingSlice;

    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_KID_CHURCH_PATH}/kid-registration/scan-code`,
        {
          params: {
            code,
            registrationChurchMeetingId: churchMeeting.current?.id,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);
