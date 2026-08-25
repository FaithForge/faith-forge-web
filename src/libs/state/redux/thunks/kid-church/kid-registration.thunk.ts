import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { ICreateKidRegistration } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';

export const CreateKidRegistration = createAsyncThunk(
  'kid-church/CreateKidRegistration',
  async (payload: ICreateKidRegistration, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchCampusSlice = state.churchCampusSlice;
    const churchMeetingSlice = state.churchMeetingSlice;
    const authSlice = state.authSlice;
    const accountSlice = state.accountSlice;
    const churchPrinterSlice = state.churchPrinterSlice;
    const printerMode = state.printerModeSlice?.mode || 'NETWORK';
    const isBluetooth = printerMode === 'BLUETOOTH';

    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/kid-registration`,
        options: {
          data: {
            ...payload,
            churchId: churchCampusSlice.current?.id,
            churchMeetingId: churchMeetingSlice.current?.id,
            churchPrinterId: isBluetooth ? undefined : churchPrinterSlice.current?.name,
            skipServerPrint: isBluetooth || payload.skipServerPrint || false,
            log: `Registrado por ${authSlice.user?.firstName} ${authSlice.user?.lastName} del ${accountSlice.churchGroup}`,
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
    const printerMode = state.printerModeSlice?.mode || 'NETWORK';
    const isBluetooth = printerMode === 'BLUETOOTH';

    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/kid-registration/reprint`,
        options: {
          data: {
            id,
            copies,
            churchPrinterId: isBluetooth ? undefined : churchPrinterSlice.current?.name,
            skipServerPrint: isBluetooth,
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
