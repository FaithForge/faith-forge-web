import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest } from '../api';
import { IKid } from '../models/Kid';
import { IKidGuardian } from '../models/KidGuardian';
import { RootState } from '../redux/store';
import { removeAccentsAndFormat } from '../utils/text';

export const uploadKidPhoto = async (payload: { formData: any }) => {
  const response = (
    await makeApiRequest(ApiVerbs.POST, `/registration/uploadImage/kids`, {
      data: payload.formData,
      headers: {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    })
  ).data;

  return response.key;
};

export const GetKid = createAsyncThunk(
  'kid/getKid',
  async (payload: { id: string; churchMeetingId?: string }, { getState }) => {
    const state = getState() as RootState;
    const churchMeeting = state.churchMeetingSlice;
    const response = (
      await makeApiRequest(ApiVerbs.GET, `/registration/kids/${payload.id}`, {
        params: {
          churchMeetingId: churchMeeting.current?.id,
        },
      })
    ).data;

    return response;
  },
);

export const GetKids = createAsyncThunk(
  'kid/getKids',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const kid = state.kidSlice;
    const churchMeeting = state.churchMeetingSlice;

    const response = (
      await makeApiRequest(ApiVerbs.GET, '/registration/kids', {
        params: {
          limit: kid.itemsPerPage,
          page: 1,
          churchMeetingId: churchMeeting.current?.id,
          findText: payload.findText,
        },
      })
    ).data;

    return response;
  },
);

export const GetMoreKids = createAsyncThunk(
  'kid/getMoreKids',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const kid = state.kidSlice;
    const churchMeeting = state.churchMeetingSlice;

    const response = (
      await makeApiRequest(ApiVerbs.GET, '/registration/kids', {
        params: {
          limit: kid.itemsPerPage,
          page: kid.currentPage + 1,
          churchMeetingId: churchMeeting.current?.id,
        },
      })
    ).data;

    return response;
  },
);

export const GetKidGroups = createAsyncThunk('kid/getKidGroups', async () => {
  const response = (
    await makeApiRequest(ApiVerbs.GET, '/registration/kidsGroups')
  ).data;

  return response;
});

export const GetKidMedicalConditions = createAsyncThunk(
  'kid/getKidMedicalCondition',
  async () => {
    const response = (
      await makeApiRequest(ApiVerbs.GET, '/registration/medicalConditions')
    ).data;

    return response;
  },
);

export const CreateKid = createAsyncThunk(
  'kid/createKid',
  async (payload: {
    kidRegistration: IKid;
    kidGuardianRegistration: IKidGuardian;
  }) => {
    const { kidRegistration, kidGuardianRegistration } = payload;

    const response = (
      await makeApiRequest(ApiVerbs.POST, `/registration/kids`, {
        data: {
          ...kidRegistration,
          firstName: removeAccentsAndFormat(kidRegistration.firstName),
          lastName: removeAccentsAndFormat(kidRegistration.lastName),
          birthday: kidRegistration.birthday,
          gender: kidRegistration.gender,
          staticGroup: kidRegistration.staticGroup,
          group: kidRegistration.group,
          observations: kidRegistration.observations,
          photoUrl: kidRegistration.photoUrl,
          medicalCondition: kidRegistration.medicalCondition?.id,
          healthSecurityEntity: kidRegistration.healthSecurityEntity,
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

export const RegisterKid = createAsyncThunk(
  'kid/registerKid',
  async (
    payload: {
      kidId: string;
      guardianId: string;
      observation: string;
    },
    { getState },
  ) => {
    const state = getState() as RootState;
    const church = state.churchSlice.current;
    const churchPrinter = state.churchSlice.currentPrinter;

    const churchMeeting = state.churchMeetingSlice.current;
    const { kidId, guardianId, observation } = payload;

    const response = (
      await makeApiRequest(ApiVerbs.POST, `/registration`, {
        data: {
          kidId,
          churchMeetingId: churchMeeting?.id,
          churchId: church?.id,
          churchPrinterId: churchPrinter?.name,
          guardianId,
          observation,
        },
      })
    ).data;

    return response;
  },
);

export const UpdateKid = createAsyncThunk(
  'kid/updatedKid',
  async (payload: { kidRegistration: IKid }) => {
    const { kidRegistration } = payload;

    const kidRegistrationData = {
      ...kidRegistration,
      firstName: removeAccentsAndFormat(kidRegistration.firstName),
      lastName: removeAccentsAndFormat(kidRegistration.lastName),
      birthday: kidRegistration.birthday,
      gender: kidRegistration.gender,
      staticGroup: kidRegistration.staticGroup,
      group: kidRegistration.group,
      observations: kidRegistration.observations?.trim(),
      photoUrl: kidRegistration.photoUrl,
      medicalCondition: kidRegistration.medicalCondition?.id,
      healthSecurityEntity: kidRegistration.healthSecurityEntity,
    } as IKid;

    await makeApiRequest(
      ApiVerbs.PUT,
      `/registration/kids/${kidRegistration.id}`,
      {
        data: {
          ...kidRegistrationData,
        },
      },
    );

    return kidRegistrationData;
  },
);
