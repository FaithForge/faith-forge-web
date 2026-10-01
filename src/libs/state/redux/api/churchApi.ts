import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import {
  GetMinistryWorkspaceArgs,
  IChurchCampus,
  IChurchMeeting,
  IChurchPrinter,
  IMinistryWorkspaceOverview,
  IVolunteerAttendance,
  IVolunteerAttendanceSummary,
  GetVolunteerAttendancePayload,
  CreateVolunteerAttendancePayload,
  BatchCreateVolunteerAttendancePayload,
} from '@/libs/models';
import { baseApi } from './baseApi';

export interface GetChurchMeetingsArgs {
  churchCampusId?: string;
}

export interface GetChurchPrintersArgs {
  churchCampusId?: string;
}

export interface GetChurchCampusesArgs {
  churchId?: string;
}

export type CacheScope = 'all' | 'printers' | 'services' | 'registrations';

export interface ClearCacheArgs {
  scope?: CacheScope;
}

/**
 * RTK Query endpoints for the Church microservice.
 * Injected modularly into the baseApi with declarative cache tag management.
 */
export const churchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMinistryWorkspaceOverview: builder.query<
      IMinistryWorkspaceOverview,
      GetMinistryWorkspaceArgs | void
    >({
      query: (args) => {
        const params: Record<string, string> = {};
        if (args?.churchCampusId) params.churchCampusId = args.churchCampusId;
        if (args?.ministryId) params.ministryId = args.ministryId;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/ministry/workspace',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      providesTags: (result) => [
        { type: 'Ministry', id: 'WORKSPACE' },
        ...(result?.ministry ? [{ type: 'Ministry' as const, id: result.ministry.id }] : []),
        { type: 'VolunteerAssignment', id: 'LIST' },
      ],
    }),

    getChurchMeetings: builder.query<IChurchMeeting[], GetChurchMeetingsArgs | void>({
      query: (args) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-meeting',
        method: HttpRequestMethod.GET,
        params: args?.churchCampusId ? { churchCampusId: args.churchCampusId } : {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ChurchMeeting' as const, id })),
              { type: 'ChurchMeeting', id: 'LIST' },
            ]
          : [{ type: 'ChurchMeeting', id: 'LIST' }],
    }),

    getChurchCampuses: builder.query<IChurchCampus[], GetChurchCampusesArgs | void>({
      query: (args) => {
        const churchId = args?.churchId || import.meta.env.VITE_CHURCH_ID;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/church-campus',
          method: HttpRequestMethod.GET,
          params: churchId ? { churchId } : {},
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ChurchCampus' as const, id })),
              { type: 'ChurchCampus', id: 'LIST' },
            ]
          : [{ type: 'ChurchCampus', id: 'LIST' }],
    }),

    getChurchPrinters: builder.query<IChurchPrinter[], GetChurchPrintersArgs | void>({
      query: (args) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-printers',
        method: HttpRequestMethod.GET,
        params: args?.churchCampusId ? { churchCampusId: args.churchCampusId } : {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ChurchPrinter' as const, id })),
              { type: 'ChurchPrinter', id: 'LIST' },
            ]
          : [{ type: 'ChurchPrinter', id: 'LIST' }],
    }),

    deleteVolunteerAssignment: builder.mutation<void, string>({
      query: (assignmentId) => ({
        microservice: MicroserviceEnum.Church,
        url: `/volunteer-assignment/${assignmentId}`,
        method: HttpRequestMethod.DELETE,
      }),
      invalidatesTags: [
        { type: 'Ministry', id: 'WORKSPACE' },
        { type: 'VolunteerAssignment', id: 'LIST' },
      ],
    }),

    clearCache: builder.mutation<{ success: boolean; scope: CacheScope }, ClearCacheArgs | void>({
      query: (args) => ({
        microservice: MicroserviceEnum.Church,
        url: '/admin/clear-cache',
        method: HttpRequestMethod.POST,
        data: { scope: args?.scope || 'all' },
      }),
      invalidatesTags: (_result, _error, args) => {
        const scope = args?.scope || 'all';
        switch (scope) {
          case 'printers':
            return [{ type: 'ChurchPrinter', id: 'LIST' }];
          case 'services':
            return [
              { type: 'ChurchMeeting', id: 'LIST' },
              { type: 'ChurchCampus', id: 'LIST' },
              { type: 'Volunteer', id: 'LIST' },
              { type: 'VolunteerAssignment', id: 'LIST' },
              { type: 'Ministry', id: 'WORKSPACE' },
            ];
          case 'registrations':
            return [
              { type: 'Kid', id: 'LIST' },
              { type: 'KidGroup', id: 'LIST' },
              { type: 'KidRegistered', id: 'LIST' },
              { type: 'KidGuardian', id: 'LIST' },
              { type: 'KidMedicalCondition', id: 'LIST' },
            ];
          case 'all':
          default:
            return [
              { type: 'ChurchPrinter', id: 'LIST' },
              { type: 'ChurchMeeting', id: 'LIST' },
              { type: 'ChurchCampus', id: 'LIST' },
              { type: 'Volunteer', id: 'LIST' },
              { type: 'VolunteerAssignment', id: 'LIST' },
              { type: 'Ministry', id: 'WORKSPACE' },
              { type: 'Kid', id: 'LIST' },
              { type: 'KidGroup', id: 'LIST' },
              { type: 'KidRegistered', id: 'LIST' },
              { type: 'KidGuardian', id: 'LIST' },
              { type: 'KidMedicalCondition', id: 'LIST' },
            ];
        }
      },
    }),

    getVolunteerAttendance: builder.query<
      IVolunteerAttendance[],
      GetVolunteerAttendancePayload | void
    >({
      query: (args) => {
        const params: Record<string, string | number> = {};
        if (args?.churchMeetingId) params.churchMeetingId = args.churchMeetingId;
        if (args?.ministryGroupConfigId) params.ministryGroupConfigId = args.ministryGroupConfigId;
        if (args?.attendanceDate) params.attendanceDate = args.attendanceDate;
        if (args?.page) params.page = args.page;
        params.limit = args?.limit ?? 500;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/volunteer-attendance',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      transformResponse: (response: { data: IVolunteerAttendance[] } | IVolunteerAttendance[]) => {
        if (response && 'data' in response && Array.isArray(response.data)) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'VolunteerAttendance' as const, id })),
              { type: 'VolunteerAttendance', id: 'LIST' },
            ]
          : [{ type: 'VolunteerAttendance', id: 'LIST' }],
    }),

    getVolunteerAttendanceSummary: builder.query<
      IVolunteerAttendanceSummary,
      { churchMeetingId: string; ministryGroupConfigId?: string; attendanceDate?: string }
    >({
      query: (args) => {
        const params: Record<string, string> = { churchMeetingId: args.churchMeetingId };
        if (args.ministryGroupConfigId) params.ministryGroupConfigId = args.ministryGroupConfigId;
        if (args.attendanceDate) params.attendanceDate = args.attendanceDate;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/volunteer-attendance/summary',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      providesTags: [{ type: 'VolunteerAttendance', id: 'SUMMARY' }],
    }),

    recordVolunteerAttendance: builder.mutation<
      IVolunteerAttendance,
      CreateVolunteerAttendancePayload
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/volunteer-attendance',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: [
        { type: 'VolunteerAttendance', id: 'LIST' },
        { type: 'VolunteerAttendance', id: 'SUMMARY' },
      ],
    }),

    recordBatchVolunteerAttendance: builder.mutation<
      { successful: IVolunteerAttendance[] },
      BatchCreateVolunteerAttendancePayload
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/volunteer-attendance/batch',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: [
        { type: 'VolunteerAttendance', id: 'LIST' },
        { type: 'VolunteerAttendance', id: 'SUMMARY' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMinistryWorkspaceOverviewQuery,
  useLazyGetMinistryWorkspaceOverviewQuery,
  useGetChurchMeetingsQuery,
  useLazyGetChurchMeetingsQuery,
  useGetChurchCampusesQuery,
  useLazyGetChurchCampusesQuery,
  useGetChurchPrintersQuery,
  useLazyGetChurchPrintersQuery,
  useDeleteVolunteerAssignmentMutation,
  useClearCacheMutation,
  useGetVolunteerAttendanceQuery,
  useLazyGetVolunteerAttendanceQuery,
  useGetVolunteerAttendanceSummaryQuery,
  useLazyGetVolunteerAttendanceSummaryQuery,
  useRecordVolunteerAttendanceMutation,
  useRecordBatchVolunteerAttendanceMutation,
} = churchApi;

