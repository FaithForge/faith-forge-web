import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest } from '../api';
import { IKidGuardian } from '../models/KidGuardian';
import { removeAccentsAndFormat } from '../utils/text';

export const GetKidGuardian = createAsyncThunk(
  'kidGuardian/getKidGuardian',
  async (payload: { nationalId: string }) => {
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/registration/guardians/${payload.nationalId}`,
      )
    ).data;

    return response;
  },
);

export const CreateKidGuardian = createAsyncThunk(
  'kid/createKid',
  async (payload: { kidGuardianRegistration: IKidGuardian; kidId: string }) => {
    const { kidGuardianRegistration, kidId } = payload;

    const response = (
      await makeApiRequest(ApiVerbs.POST, `/registration/guardians`, {
        data: {
          kidId,
          guardian: {
            nationalIdType: kidGuardianRegistration.nationalIdType,
            nationalId: kidGuardianRegistration.nationalId.trim(),
            firstName: removeAccentsAndFormat(
              kidGuardianRegistration.firstName,
            ),
            lastName: removeAccentsAndFormat(kidGuardianRegistration.lastName),
            phone: kidGuardianRegistration.phone.trim(),
            gender: kidGuardianRegistration.gender,
            relation: kidGuardianRegistration.relation,
          },
        },
      })
    ).data;

    return response;
  },
);
