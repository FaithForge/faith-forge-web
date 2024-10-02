/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpRequestMethod } from '@faith-forge-web/common-types/global';
import { makeApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { MS_KID_CHURCH_PATH } from '../../../api';
import { ICreateKidGuardian } from '../../../models/KidChurch';
import { RootState } from '../../store';

export const CreateKidGuardian = createAsyncThunk(
  'kid-church/CreateKidGuardian',
  async (payload: ICreateKidGuardian, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await makeApiRequest(
          HttpRequestMethod.POST,
          `/${MS_KID_CHURCH_PATH}/kid-guardian`,
          {
            data: {
              ...payload,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Internal Error');
    }
  }
);

export const GetKidGuardian = createAsyncThunk(
  'kid-church/GetKidGuardian',
  async (nationalId: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        HttpRequestMethod.GET,
        `/${MS_KID_CHURCH_PATH}/kid-guardian/${nationalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    ).data;

    return response;
  }
);

export const UpdateKidGuardianPhone = createAsyncThunk(
  'kid-church/UpdateKidGuardianPhone',
  async (
    payload: { id: string; phone: string },
    { getState, rejectWithValue }
  ) => {
    const { id, phone } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await makeApiRequest(
          HttpRequestMethod.PUT,
          `/${MS_KID_CHURCH_PATH}/kid-guardian/${id}`,
          {
            data: {
              phone,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Internal Error');
    }
  }
);

export const UploadQRCodeImage = createAsyncThunk(
  'kid-church/uploadQRCodeImage',
  async (payload: { formData: any }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        HttpRequestMethod.POST,
        `/${MS_KID_CHURCH_PATH}/user/upload-qr-code`,
        {
          data: payload.formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
    ).data;

    return response.key;
  }
);
