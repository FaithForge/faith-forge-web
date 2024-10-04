/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpRequestMethod, MS } from '@faith-forge-web/common-types/global';
import { microserviceApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { ICreateKidGuardian } from '../../../models/KidChurch';
import { RootState } from '../../store';

export const CreateKidGuardian = createAsyncThunk(
  'kid-church/CreateKidGuardian',
  async (payload: ICreateKidGuardian, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.KidChurch,
          method: HttpRequestMethod.POST,
          url: `/kid-guardian`,
          options: {
            data: {
              ...payload,
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
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
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kid-guardian/${nationalId}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    return response;
  },
);

export const UpdateKidGuardianPhone = createAsyncThunk(
  'kid-church/UpdateKidGuardianPhone',
  async (
    payload: { id: string; phone: string },
    { getState, rejectWithValue },
  ) => {
    const { id, phone } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.KidChurch,
          method: HttpRequestMethod.PUT,
          url: `/kid-guardian/${id}`,
          options: {
            data: {
              phone,
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Internal Error');
    }
  },
);

export const UploadQRCodeImage = createAsyncThunk(
  'kid-church/uploadQRCodeImage',
  async (payload: { formData: any }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/user/upload-qr-code`,
        options: {
          data: payload.formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      })
    ).data;

    return response.key;
  },
);
