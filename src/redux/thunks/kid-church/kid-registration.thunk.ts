import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { ICreateKidRegistration } from '@/models/KidChurch';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const CreateKidRegistration = createAsyncThunk(
  'kid-church/CreateKidRegistration',
  async (payload: { createKidRegistration: ICreateKidRegistration }) => {
    const { createKidRegistration } = payload;
    const response = (
      await makeApiRequest(
        ApiVerbs.POST,
        `/${MS_KID_CHURCH_PATH}/kid-registration`,
        {
          data: {
            ...createKidRegistration,
          },
        },
      )
    ).data;

    return response;
  },
);
