import { HttpRequestMethod, MS } from '@faith-forge-web/common-types/global';
import { microserviceApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ICreateKidRegistration } from '../../../models/KidChurch';
import { RootState } from '../../store';

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
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/kid-registration`,
        options: {
          data: {
            ...payload,
            churchId: churchSlice.current?.id,
            churchMeetingId: churchMeetingSlice.current?.id,
            churchPrinterId: churchPrinterSlice.current?.name,
            log: `Registrado por ${authSlice.user?.firstName} ${authSlice.user?.lastName} del grupo ${accountSlice.churchGroup}`,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
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
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/kid-registration/reprint`,
        options: {
          data: {
            id,
            copies,
            churchPrinterId: churchPrinterSlice.current?.name,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
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
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.DELETE,
        url: `/kid-registration/${id}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
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
