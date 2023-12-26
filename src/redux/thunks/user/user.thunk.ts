import { ApiVerbs, MS_USER_PATH, makeApiRequest } from '@/api';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const UploadUserImage = createAsyncThunk(
  'user/uploadUserImage',
  async (payload: { formData: any }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        ApiVerbs.POST,
        `/${MS_USER_PATH}/user/upload-image`,
        {
          data: payload.formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      )
    ).data;

    return response.key;
  },
);
