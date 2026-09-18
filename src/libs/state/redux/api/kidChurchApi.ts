import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import {
  ICreateKid,
  ICreateKidGuardian,
  ICreateKidRegistration,
  IKid,
  IKidGroup,
  IKidGuardian,
  IKidGuardianAssignedKidsResponse,
  IKidMedicalCondition,
  IUpdateKid,
  KidGroupType,
} from '@/libs/models';

import { PAGINATION_REGISTRATION_LIMIT } from '@/libs/common-types/constants';
import { baseApi } from './baseApi';

export interface GetKidGroupsArgs {
  type?: KidGroupType;
}

export interface GetKidGroupAttendanceArgs {
  kidGroupId?: string;
  date: string;
  churchMeetingId?: string;
}

/**
 * @deprecated Legacy endpoint args. Use GetKidGroupAttendanceArgs instead.
 */
export interface GetKidGroupRegisteredArgs extends GetKidGroupAttendanceArgs {}

export interface GetKidsArgs {
  page?: number;
  limit?: number;
  registrationChurchMeetingId?: string;
  filterByFirstName?: string;
  filterByLastName?: string;
  filterByFaithForge?: string;
}

export interface GetKidsResponse {
  data: IKid[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface GetKidArgs {
  id: string;
  registrationChurchMeetingId?: string;
}

export interface GetKidGuardianArgs {
  nationalId?: string;
  phone?: string;
}

export interface CreateKidRegistrationApiPayload extends ICreateKidRegistration {
  churchId?: string;
  churchMeetingId?: string;
  churchPrinterId?: string;
  log?: string;
}

/**
 * RTK Query endpoints for the Kids Ministry microservice.
 * Injected modularly into the baseApi with declarative cache tag management.
 */
export const kidChurchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKidGroups: builder.query<IKidGroup[], GetKidGroupsArgs | void>({
      query: (args) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-groups',
        method: HttpRequestMethod.GET,
        params: args?.type ? { type: args.type } : {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'KidGroup' as const, id })),
              { type: 'KidGroup', id: 'LIST' },
            ]
          : [{ type: 'KidGroup', id: 'LIST' }],
    }),

    getKidGroupAttendance: builder.query<IKid[], GetKidGroupAttendanceArgs>({
      query: ({ kidGroupId, date, churchMeetingId }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-group/attendance',
        method: HttpRequestMethod.GET,
        params: {
          kidGroupId,
          date,
          churchMeetingId,
        },
      }),
      providesTags: (_result, _error, arg) => [
        { type: 'KidRegistered', id: arg.kidGroupId || 'ALL' },
        { type: 'KidRegistered', id: 'LIST' },
      ],
    }),

    /**
     * @deprecated Legacy heavy endpoint. Kept for backward compatibility. Use getKidGroupAttendance instead.
     */
    getKidGroupRegistered: builder.query<IKid[], GetKidGroupRegisteredArgs>({
      query: ({ kidGroupId, date, churchMeetingId }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-group/registered',
        method: HttpRequestMethod.GET,
        params: {
          kidGroupId,
          date,
          churchMeetingId,
        },
      }),
      providesTags: (_result, _error, arg) => [
        { type: 'KidRegistered', id: arg.kidGroupId || 'ALL' },
        { type: 'KidRegistered', id: 'LIST' },
      ],
    }),

    getKidMedicalConditions: builder.query<IKidMedicalCondition[], void>({
      query: () => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-medical-conditions',
        method: HttpRequestMethod.GET,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'KidMedicalCondition' as const, id })),
              { type: 'KidMedicalCondition', id: 'LIST' },
            ]
          : [{ type: 'KidMedicalCondition', id: 'LIST' }],
    }),

    getKids: builder.query<GetKidsResponse, GetKidsArgs | void>({
      query: (args) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kids',
        method: HttpRequestMethod.GET,
        params: {
          page: args?.page ?? 1,
          limit: args?.limit ?? PAGINATION_REGISTRATION_LIMIT,
          registrationChurchMeetingId: args?.registrationChurchMeetingId,
          filterByFirstName: args?.filterByFirstName,
          filterByLastName: args?.filterByLastName,
          filterByFaithForge: args?.filterByFaithForge,
        },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Kid' as const, id })),
              { type: 'Kid', id: 'LIST' },
            ]
          : [{ type: 'Kid', id: 'LIST' }],
    }),

    getKid: builder.query<IKid, GetKidArgs>({
      query: ({ id, registrationChurchMeetingId }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid/${id}`,
        method: HttpRequestMethod.GET,
        params: registrationChurchMeetingId ? { registrationChurchMeetingId } : {},
      }),
      providesTags: (_result, _error, arg) => [{ type: 'Kid', id: arg.id }],
    }),

    createKid: builder.mutation<IKid, ICreateKid>({
      query: (payload) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid',
        method: HttpRequestMethod.POST,
        data: payload,
        queueIfOffline: true,
      }),
      invalidatesTags: [{ type: 'Kid', id: 'LIST' }],
    }),

    updateKid: builder.mutation<void, { id: string; data: IUpdateKid }>({
      query: ({ id, data }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid/${id}`,
        method: HttpRequestMethod.PUT,
        data,
        queueIfOffline: true,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Kid', id: arg.id },
        { type: 'Kid', id: 'LIST' },
      ],
    }),

    getKidGuardian: builder.query<IKidGuardian, GetKidGuardianArgs>({
      query: (params) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-guardian',
        method: HttpRequestMethod.GET,
        params,
      }),
      providesTags: (result) =>
        result?.id ? [{ type: 'KidGuardian', id: result.id }] : [{ type: 'KidGuardian', id: 'CURRENT' }],
    }),

    createKidGuardian: builder.mutation<IKidGuardian, ICreateKidGuardian>({
      query: (payload) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-guardian',
        method: HttpRequestMethod.POST,
        data: payload,
        queueIfOffline: true,
      }),
      invalidatesTags: [{ type: 'KidGuardian', id: 'CURRENT' }, { type: 'Kid', id: 'LIST' }],
    }),

    createKidRegistration: builder.mutation<unknown, CreateKidRegistrationApiPayload>({
      query: (payload) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-registration',
        method: HttpRequestMethod.POST,
        data: payload,
        queueIfOffline: true,
      }),
      invalidatesTags: [
        { type: 'KidRegistered', id: 'LIST' },
        { type: 'KidGroup', id: 'LIST' },
        { type: 'Kid', id: 'LIST' },
      ],
    }),

    deleteKidRegistration: builder.mutation<void, string>({
      query: (id) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid-registration/${id}`,
        method: HttpRequestMethod.DELETE,
        queueIfOffline: true,
      }),
      invalidatesTags: [
        { type: 'KidRegistered', id: 'LIST' },
        { type: 'KidGroup', id: 'LIST' },
        { type: 'Kid', id: 'LIST' },
      ],
    }),

    getMyGuardianAssignedKids: builder.query<IKidGuardianAssignedKidsResponse, void>({
      query: () => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-guardian/assigned-kids',
        method: HttpRequestMethod.GET,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'KidGuardian', id: result.guardian.id },
              { type: 'KidGuardian', id: 'LIST' },
              { type: 'KidRegistered', id: 'LIST' },
            ]
          : [{ type: 'KidGuardian', id: 'ME' }, { type: 'KidGuardian', id: 'LIST' }],
    }),

    sendUrgentGuardianNotice: builder.mutation<
      { success: boolean; delivered: boolean; message?: string },
      { guardianId: string; kidId: string; reason?: string }
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-registration/guardian-urgent-notice',
        method: HttpRequestMethod.POST,
        data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetKidGroupsQuery,
  useLazyGetKidGroupsQuery,
  useGetKidGroupAttendanceQuery,
  useLazyGetKidGroupAttendanceQuery,
  useGetKidGroupRegisteredQuery,
  useLazyGetKidGroupRegisteredQuery,
  useGetKidMedicalConditionsQuery,
  useLazyGetKidMedicalConditionsQuery,
  useGetKidsQuery,
  useLazyGetKidsQuery,
  useGetKidQuery,
  useLazyGetKidQuery,
  useCreateKidMutation,
  useUpdateKidMutation,
  useGetKidGuardianQuery,
  useLazyGetKidGuardianQuery,
  useCreateKidGuardianMutation,
  useCreateKidRegistrationMutation,
  useDeleteKidRegistrationMutation,
  useGetMyGuardianAssignedKidsQuery,
  useLazyGetMyGuardianAssignedKidsQuery,
  useSendUrgentGuardianNoticeMutation,
} = kidChurchApi;

