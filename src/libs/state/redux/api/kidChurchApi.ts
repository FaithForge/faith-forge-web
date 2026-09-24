import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import {
  ICreateKid,
  ICreateKidGuardian,
  ICreateKidRegistration,
  IKid,
  IKidGroup,
  IKidGuardian,
  IKidGuardianAssignedKidsResponse,
  IKidLiveTrackingItem,
  IKidLiveTrackingResponse,
  IKidMedicalCondition,
  IKidRegistration,
  IUpdateKid,
  KidAttendanceFlowModeEnum,
  KidAttendanceStatusEnum,
  KidGroupType,
  KidGuardianRelationCodeEnum,
} from '@/libs/models';

import { PAGINATION_REGISTRATION_LIMIT } from '@/libs/common-types/constants';
import { baseApi } from './baseApi';

export interface IUpdateKidGuardian {
  id: string;
  phone: string;
  dialCodePhone?: string;
  relation?: KidGuardianRelationCodeEnum | string;
  kidId?: string;
}

export interface IDeleteKidGuardianRelation {
  kidId: string;
  guardianId: string;
}

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
  nationalId: string;
}

export interface CreateKidRegistrationApiPayload extends ICreateKidRegistration {
  churchPrinterId?: string;
}

export interface GetKidLiveTrackingArgs {
  churchMeetingId: string;
  date: string;
  groupId?: string;
  status?: KidAttendanceStatusEnum;
  search?: string;
}

export interface ConfirmKidCheckoutApiPayload {
  id: string;
  guardianId?: string;
  observation?: string;
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
      query: ({ nationalId }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid-guardian/${encodeURIComponent(nationalId)}`,
        method: HttpRequestMethod.GET,
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
      invalidatesTags: (_result, _error, arg) => [
        { type: 'KidGuardian', id: 'CURRENT' },
        { type: 'Kid', id: 'LIST' },
        ...(arg.kidId ? [{ type: 'Kid' as const, id: arg.kidId }] : []),
      ],
    }),

    updateKidGuardian: builder.mutation<unknown, IUpdateKidGuardian>({
      query: ({ id, phone, dialCodePhone, relation, kidId }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid-guardian/${id}`,
        method: HttpRequestMethod.PUT,
        data: {
          phone,
          dialCodePhone,
          relation,
          kidId,
        },
        queueIfOffline: true,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'KidGuardian', id: arg.id },
        { type: 'KidGuardian', id: 'CURRENT' },
        ...(arg.kidId ? [{ type: 'Kid' as const, id: arg.kidId }] : []),
      ],
    }),

    deleteKidGuardianRelation: builder.mutation<unknown, IDeleteKidGuardianRelation>({
      query: ({ kidId, guardianId }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid/${kidId}/guardian/${guardianId}`,
        method: HttpRequestMethod.DELETE,
        queueIfOffline: true,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Kid', id: arg.kidId },
        { type: 'KidGuardian', id: arg.guardianId },
      ],
    }),

    uploadQRCodeImage: builder.mutation<string, FormData>({
      query: (formData) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/user/upload-qr-code',
        method: HttpRequestMethod.POST,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
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
        { type: 'KidAttendanceTracking', id: 'LIST' },
        { type: 'KidGroup', id: 'LIST' },
        { type: 'Kid', id: 'LIST' },
      ],
    }),

    deleteKid: builder.mutation<void, { id: string; targetKidId?: string }>({
      query: ({ id, targetKidId }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid/${id}`,
        method: HttpRequestMethod.DELETE,
        params: targetKidId ? { targetKidId } : undefined,
        queueIfOffline: true,
      }),
      invalidatesTags: [
        { type: 'Kid', id: 'LIST' },
        { type: 'KidRegistered', id: 'LIST' },
      ],
    }),

    deleteKidRegistration: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid-registration/${id}`,
        method: HttpRequestMethod.DELETE,
        queueIfOffline: true,
      }),
      invalidatesTags: [
        { type: 'KidRegistered', id: 'LIST' },
        { type: 'KidAttendanceTracking', id: 'LIST' },
        { type: 'KidGroup', id: 'LIST' },
        { type: 'Kid', id: 'LIST' },
      ],
    }),

    reprintKidRegistration: builder.mutation<
      unknown,
      { id: string; churchPrinterId?: string; skipServerPrint?: boolean }
    >({
      query: ({ id, churchPrinterId, skipServerPrint }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-registration/reprint',
        method: HttpRequestMethod.POST,
        data: {
          id,
          churchPrinterId,
          skipServerPrint,
        },
      }),
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
      { guardianId: string; kidId: string; reason?: string; vibrate?: number[] }
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-registration/guardian-urgent-notice',
        method: HttpRequestMethod.POST,
        data,
      }),
    }),

    getKidLiveTracking: builder.query<IKidLiveTrackingResponse, GetKidLiveTrackingArgs>({
      query: (args) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: '/kid-registration/live-tracking',
        method: HttpRequestMethod.GET,
        params: {
          churchMeetingId: args.churchMeetingId,
          date: args.date,
          ...(args.groupId ? { kidGroupId: args.groupId } : {}),
        },
      }),
      transformResponse: (raw: any): IKidLiveTrackingResponse => {
        if (!raw) {
          return {
            flowMode: KidAttendanceFlowModeEnum.ONLY_CHECK_IN,
            summary: { totalRegistered: 0, pendingEntry: 0, inArea: 0, checkedOut: 0 },
            data: [],
          };
        }

        const mapKidToItem = (k: any, defaultStatus: KidAttendanceStatusEnum): IKidLiveTrackingItem => {
          const reg = k.currentKidRegistration;
          const stages = reg?.attendanceStages || {};
          const checkIn = stages[KidAttendanceStatusEnum.CHECKED_IN];
          const inArea = stages[KidAttendanceStatusEnum.IN_AREA];
          const checkedOut = stages[KidAttendanceStatusEnum.CHECKED_OUT];

          const primaryGuardian = k.relations?.[0] || k.guardians?.[0];
          const guardianFullName =
            reg?.additionalInfo?.guardianFullName ||
            (primaryGuardian ? `${primaryGuardian.firstName || ''} ${primaryGuardian.lastName || ''}`.trim() : '');
          const guardianPhone = primaryGuardian
            ? `${primaryGuardian.dialCodePhone || ''}${primaryGuardian.phone || ''}`
            : undefined;

          return {
            id: reg?.id || k.id,
            kidId: k.id,
            kidFullName: `${k.firstName || ''} ${k.lastName || ''}`.trim(),
            faithForgeId: k.faithForgeId,
            gender: k.gender,
            photoUrl: k.photoUrl,
            birthday: k.birthday,
            age: k.age,
            ageInMonths: k.ageInMonths,
            groupId: reg?.groupId || k.kidGroup?.id || '',
            groupName: reg?.additionalInfo?.groupName || k.kidGroup?.name || '',
            guardianId: reg?.guardianId || primaryGuardian?.id || '',
            guardianFullName,
            guardianPhone,
            attendanceStatus: reg?.attendanceStatus || defaultStatus,
            date: reg?.date || new Date(),
            registeredAt: checkIn?.timestamp || reg?.date || new Date(),
            enteredAt: inArea?.timestamp,
            checkedOutAt: checkedOut?.timestamp,
            checkedOutGuardianId: checkedOut?.deliveredToGuardianId,
            checkedOutGuardianName: reg?.additionalInfo?.checkedOutGuardianFullName,
            observation: checkIn?.observation || reg?.observation,
            checkOutObservation: checkedOut?.observation,
            attendanceStages: stages,
          };
        };

        const pendingItems = (raw.pendingEntry || []).map((k: any) => mapKidToItem(k, KidAttendanceStatusEnum.CHECKED_IN));
        const inAreaItems = (raw.inArea || []).map((k: any) => mapKidToItem(k, KidAttendanceStatusEnum.IN_AREA));
        const checkedOutItems = (raw.checkedOut || []).map((k: any) => mapKidToItem(k, KidAttendanceStatusEnum.CHECKED_OUT));
        const allItems = [...pendingItems, ...inAreaItems, ...checkedOutItems];

        return {
          flowMode: raw.flowMode || KidAttendanceFlowModeEnum.FULL_FLOW,
          summary: {
            totalRegistered: raw.summary?.totalRegistered ?? allItems.length,
            pendingEntry: raw.summary?.totalPendingEntry ?? pendingItems.length,
            inArea: raw.summary?.totalInArea ?? inAreaItems.length,
            checkedOut: raw.summary?.totalCheckedOut ?? checkedOutItems.length,
          },
          data: allItems,
        };
      },
      providesTags: () => [{ type: 'KidAttendanceTracking', id: 'LIST' }],
    }),

    confirmKidEntry: builder.mutation<IKidRegistration, string>({
      query: (id) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid-registration/${id}/confirm-entry`,
        method: HttpRequestMethod.PATCH,
      }),
      invalidatesTags: [
        { type: 'KidAttendanceTracking', id: 'LIST' },
        { type: 'KidRegistered', id: 'LIST' },
        { type: 'KidGroup', id: 'LIST' },
      ],
    }),

    confirmKidCheckout: builder.mutation<IKidRegistration, ConfirmKidCheckoutApiPayload>({
      query: ({ id, ...data }) => ({
        microservice: MicroserviceEnum.KidChurch,
        url: `/kid-registration/${id}/confirm-checkout`,
        method: HttpRequestMethod.PATCH,
        data,
      }),
      invalidatesTags: [
        { type: 'KidAttendanceTracking', id: 'LIST' },
        { type: 'KidRegistered', id: 'LIST' },
        { type: 'KidGroup', id: 'LIST' },
      ],
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
  useDeleteKidMutation,
  useGetKidGuardianQuery,
  useLazyGetKidGuardianQuery,
  useCreateKidGuardianMutation,
  useUpdateKidGuardianMutation,
  useDeleteKidGuardianRelationMutation,
  useUploadQRCodeImageMutation,
  useCreateKidRegistrationMutation,
  useDeleteKidRegistrationMutation,
  useReprintKidRegistrationMutation,
  useGetMyGuardianAssignedKidsQuery,
  useLazyGetMyGuardianAssignedKidsQuery,
  useSendUrgentGuardianNoticeMutation,
  useGetKidLiveTrackingQuery,
  useLazyGetKidLiveTrackingQuery,
  useConfirmKidEntryMutation,
  useConfirmKidCheckoutMutation,
} = kidChurchApi;

