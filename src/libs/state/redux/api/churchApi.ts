import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import {
  IMinistry,
  GetMinistryWorkspaceArgs,
  GetMinistryAnalyticsArgs,
  IMinistryAnalyticsResponse,
  IChurch,
  CreateChurchPayload,
  UpdateChurchPayload,
  IChurchMember,
  IChurchStaff,
  UpdateChurchStaffRolesPayload,
  DeleteChurchStaffPayload,
  IChurchCampus,
  IChurchMeeting,
  IChurchPrinter,
  IMinistryWorkspaceOverview,
  IVolunteerAttendance,
  IVolunteerAttendanceSummary,
  GetVolunteerAttendancePayload,
  CreateVolunteerAttendancePayload,
  BatchCreateVolunteerAttendancePayload,
  IVolunteer,
  IVolunteerAssignment,
  GetVolunteerAssignmentsPayload,
  IChurchReport,
  CreateChurchReportPayload,
  UpdateChurchReportStatusPayload,
  AddChurchReportNotePayload,
  QueryChurchReportsArgs,
  RequestPresignedReportUploadUrlPayload,
  PresignedUploadUrlResponse,
  ICalendarMeetingInstance,
  GetCalendarMeetingsArgs,
  IChurchMeetingTag,
  IChurchMeetingException,
  IMinistryMeetingGroupAssignment,
  MinistryMeetingGroupAssignmentKind,
  UpsertMinistryMeetingGroupAssignmentPayload,
  UpsertChurchMeetingExceptionPayload,
  ChurchMeetingTagStateEnum,
  ChurchMeetingKind,
  ChurchMeetingStateEnum,
} from '@/libs/models';
import { getActiveTenantChurchId } from '@/libs/utils/tenant';

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

export interface ResolveChurchTenantArgs {
  slug?: string;
  host?: string;
  churchId?: string;
}

export interface GetChurchesArgs {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  search?: string;
  state?: string;
}

export interface GetChurchMembersArgs {
  churchId?: string;
  search?: string;
  page?: number;
  limit?: number;
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
    resolveChurchTenant: builder.query<IChurch | null, ResolveChurchTenantArgs | void>({
      query: (args) => {
        const params: Record<string, string> = {};
        if (args?.slug) params.slug = args.slug;
        if (args?.host) params.host = args.host;
        if (args?.churchId) params.churchId = args.churchId;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/church/public/resolve',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      providesTags: (result) =>
        result ? [{ type: 'Church', id: result.id }, { type: 'Church', id: 'CURRENT' }] : [{ type: 'Church', id: 'CURRENT' }],
    }),

    getChurches: builder.query<
      { data: IChurch[]; total: number; totalPages?: number; page?: number },
      GetChurchesArgs | void
    >({
      query: (args) => {
        const params: Record<string, string | number> = {};
        if (args?.page) params.page = args.page;
        if (args?.limit) params.limit = args.limit;
        if (args?.order) params.order = args.order;
        if (args?.search) params.search = args.search;
        if (args?.state) params.state = args.state;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/church',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      transformResponse: (
        response: { data?: IChurch[]; total?: number; totalPages?: number; page?: number } | IChurch[],
      ) => {
        if (Array.isArray(response)) {
          return { data: response, total: response.length, totalPages: 1, page: 1 };
        }
        return {
          data: response?.data || [],
          total: response?.total ?? (response?.data?.length || 0),
          totalPages: response?.totalPages ?? 1,
          page: response?.page ?? 1,
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Church' as const, id })),
              { type: 'Church', id: 'LIST' },
            ]
          : [{ type: 'Church', id: 'LIST' }],
    }),

    createChurch: builder.mutation<IChurch, CreateChurchPayload>({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: [{ type: 'Church', id: 'LIST' }],
    }),

    updateChurch: builder.mutation<IChurch, UpdateChurchPayload>({
      query: ({ id, ...data }) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church/${id}`,
        method: HttpRequestMethod.PATCH,
        data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Church', id: 'LIST' },
        { type: 'Church', id: arg.id },
        { type: 'Church', id: 'CURRENT' },
      ],
    }),

    uploadChurchBrandingLogo: builder.mutation<
      IChurch,
      { churchId: string; file: File }
    >({
      query: ({ churchId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          microservice: MicroserviceEnum.Church,
          url: `/church/${churchId}/branding/logo`,
          method: HttpRequestMethod.POST,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Church', id: 'LIST' },
        { type: 'Church', id: arg.churchId },
        { type: 'Church', id: 'CURRENT' },
      ],
    }),

    getChurchMembers: builder.query<
      { data: IChurchMember[]; total: number },
      GetChurchMembersArgs | void
    >({
      query: (args) => {
        const params: Record<string, string | number> = {
          page: args?.page ?? 1,
          limit: args?.limit ?? 100,
        };
        if (args?.churchId) params.churchId = args.churchId;
        if (args?.search) params.search = args.search;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/church-member',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      transformResponse: (response: { data?: IChurchMember[]; total?: number } | IChurchMember[]) => {
        if (Array.isArray(response)) {
          return { data: response, total: response.length };
        }
        return {
          data: response?.data || [],
          total: response?.total ?? (response?.data?.length || 0),
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'ChurchMember' as const, id })),
              { type: 'ChurchMember', id: 'LIST' },
            ]
          : [{ type: 'ChurchMember', id: 'LIST' }],
    }),

    getChurchStaff: builder.query<IChurchStaff[], { churchId: string }>({
      query: ({ churchId }) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-staff',
        method: HttpRequestMethod.GET,
        params: { churchId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ChurchStaff' as const, id })),
              { type: 'ChurchStaff', id: 'LIST' },
            ]
          : [{ type: 'ChurchStaff', id: 'LIST' }],
    }),

    updateChurchStaffRoles: builder.mutation<
      IChurchStaff,
      UpdateChurchStaffRolesPayload
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-staff/roles',
        method: HttpRequestMethod.PUT,
        data,
      }),
      invalidatesTags: [{ type: 'ChurchStaff', id: 'LIST' }, 'UserOverview'],
    }),

    deleteChurchStaff: builder.mutation<
      void,
      DeleteChurchStaffPayload
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-staff',
        method: HttpRequestMethod.DELETE,
        data,
      }),
      invalidatesTags: [{ type: 'ChurchStaff', id: 'LIST' }, 'UserOverview'],
    }),


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

    getMinistryAnalytics: builder.query<IMinistryAnalyticsResponse, GetMinistryAnalyticsArgs>({
      query: ({ id, churchCampusId, from, to, date, churchMeetingIds, tagId }) => {
        const params: Record<string, string> = {};
        if (churchCampusId) params.churchCampusId = churchCampusId;
        if (from) params.from = from;
        if (to) params.to = to;
        if (date) params.date = date;
        if (churchMeetingIds && churchMeetingIds.length > 0) {
          params.churchMeetingIds = churchMeetingIds.join(',');
        }
        if (tagId) {
          params.tagId = tagId;
        }
        return {
          microservice: MicroserviceEnum.Church,
          url: `/ministry/${id}/analytics`,
          method: HttpRequestMethod.GET,
          params,
        };
      },
      providesTags: (_result, _error, arg) => [
        { type: 'Ministry', id: `ANALYTICS_${arg.id}` },
        { type: 'VolunteerAttendance', id: 'LIST' },
      ],
    }),

    getMinistries: builder.query<IMinistry[], { churchCampusId?: string } | void>({
      query: (args) => ({
        microservice: MicroserviceEnum.Church,
        url: '/ministry',
        method: HttpRequestMethod.GET,
        params: args?.churchCampusId ? { churchCampusId: args.churchCampusId } : {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Ministry' as const, id })),
              { type: 'Ministry', id: 'LIST' },
            ]
          : [{ type: 'Ministry', id: 'LIST' }],
    }),

    getChurchMeetings: builder.query<
      IChurchMeeting[],
      { churchCampusId?: string; states?: ChurchMeetingStateEnum[] } | void
    >({
      query: (args) => {
        const searchParams = new URLSearchParams();
        if (args?.churchCampusId) {
          searchParams.append('churchCampusId', args.churchCampusId);
        }
        if (args?.states && args.states.length > 0) {
          args.states.forEach((s) => searchParams.append('states', s));
        }
        const queryString = searchParams.toString();
        return {
          microservice: MicroserviceEnum.Church,
          url: queryString ? `/church-meeting?${queryString}` : '/church-meeting',
          method: HttpRequestMethod.GET,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ChurchMeeting' as const, id })),
              { type: 'ChurchMeeting', id: 'LIST' },
            ]
          : [{ type: 'ChurchMeeting', id: 'LIST' }],
    }),

    createChurchMeeting: builder.mutation<
      void,
      {
        churchCampusId: string;
        name: string;
        description?: string;
        kind?: ChurchMeetingKind;
        day: string;
        specificDate?: string | null;
        endDate?: string | null;
        tagId?: string | null;
        tagName?: string | null;
        initialHour: string;
        finalHour: string;
        initialRegistrationHour: string;
        finalRegistrationHour: string;
        position?: number;
        state?: ChurchMeetingStateEnum;
      }
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-meeting',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'LIST' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
        { type: 'ChurchMeeting', id: 'TAGS' },
      ],
    }),

    updateChurchMeeting: builder.mutation<
      IChurchMeeting,
      {
        id: string;
        churchCampusId?: string;
        name?: string;
        description?: string;
        kind?: ChurchMeetingKind;
        day?: string;
        specificDate?: string | null;
        endDate?: string | null;
        tagId?: string | null;
        tagName?: string | null;
        initialHour?: string;
        finalHour?: string;
        initialRegistrationHour?: string;
        finalRegistrationHour?: string;
        position?: number;
        state?: ChurchMeetingStateEnum;
      }
    >({
      query: ({ id, churchCampusId: _ignoredCampusId, ...data }) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church-meeting/${id}`,
        method: HttpRequestMethod.PATCH,
        data,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'LIST' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
        { type: 'ChurchMeeting', id: 'TAGS' },
      ],
    }),

    deleteChurchMeeting: builder.mutation<void, { id: string; churchCampusId?: string }>({
      query: ({ id }) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church-meeting/${id}`,
        method: HttpRequestMethod.DELETE,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'LIST' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
      ],
    }),

    bulkUpdateChurchMeetingStates: builder.mutation<
      void,
      { id: string; state: ChurchMeetingStateEnum }[]
    >({
      query: (items) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-meeting/bulk-state',
        method: HttpRequestMethod.PATCH,
        data: { items },
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'LIST' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
      ],
    }),

    getCalendarMeetings: builder.query<ICalendarMeetingInstance[], GetCalendarMeetingsArgs>({
      query: ({ churchCampusId, ministryId, from, to, tagId }) => {
        const params: Record<string, string> = {
          churchCampusId,
          from,
          to,
        };
        if (ministryId) params.ministryId = ministryId;
        if (tagId) params.tagId = tagId;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/church-meeting/calendar',
          method: HttpRequestMethod.GET,
          params,
          cache: false,
        };
      },
      providesTags: [
        { type: 'ChurchMeeting', id: 'CALENDAR' },
        { type: 'ChurchMeeting', id: 'LIST' },
      ],
    }),

    getChurchMeetingTags: builder.query<
      IChurchMeetingTag[],
      { churchCampusId: string; suggestionsOnly?: boolean }
    >({
      query: ({ churchCampusId, suggestionsOnly }) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-meeting/tag',
        method: HttpRequestMethod.GET,
        params: {
          churchCampusId,
          ...(suggestionsOnly !== undefined ? { suggestionsOnly: String(suggestionsOnly) } : {}),
        },
      }),
      providesTags: [{ type: 'ChurchMeeting', id: 'TAGS' }],
    }),

    createChurchMeetingTag: builder.mutation<
      IChurchMeetingTag,
      { churchCampusId: string; name: string }
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-meeting/tag',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: [{ type: 'ChurchMeeting', id: 'TAGS' }],
    }),

    updateChurchMeetingTag: builder.mutation<
      IChurchMeetingTag,
      { id: string; name?: string; state?: ChurchMeetingTagStateEnum }
    >({
      query: ({ id, ...data }) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church-meeting/tag/${id}`,
        method: HttpRequestMethod.PATCH,
        data,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'TAGS' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
        { type: 'ChurchMeeting', id: 'LIST' },
      ],
    }),

    deleteChurchMeetingTag: builder.mutation<void, string>({
      query: (id) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church-meeting/tag/${id}`,
        method: HttpRequestMethod.DELETE,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'TAGS' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
        { type: 'ChurchMeeting', id: 'LIST' },
      ],
    }),

    upsertChurchMeetingException: builder.mutation<
      IChurchMeetingException,
      UpsertChurchMeetingExceptionPayload
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-meeting/exception',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'CALENDAR' },
        { type: 'ChurchMeeting', id: 'LIST' },
      ],
    }),

    deleteChurchMeetingException: builder.mutation<void, string>({
      query: (id) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church-meeting/exception/${id}`,
        method: HttpRequestMethod.DELETE,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'CALENDAR' },
        { type: 'ChurchMeeting', id: 'LIST' },
      ],
    }),

    getMinistryGroupAssignments: builder.query<
      IMinistryMeetingGroupAssignment[],
      { ministryId: string; churchMeetingId?: string; kind?: MinistryMeetingGroupAssignmentKind }
    >({
      query: ({ ministryId, churchMeetingId, kind }) => ({
        microservice: MicroserviceEnum.Church,
        url: '/ministry/group-assignment',
        method: HttpRequestMethod.GET,
        params: {
          ministryId,
          ...(churchMeetingId ? { churchMeetingId } : {}),
          ...(kind ? { kind } : {}),
        },
      }),
      providesTags: [{ type: 'ChurchMeeting', id: 'ASSIGNMENTS' }],
    }),

    upsertMinistryGroupAssignment: builder.mutation<
      IMinistryMeetingGroupAssignment,
      UpsertMinistryMeetingGroupAssignmentPayload
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.Church,
        url: '/ministry/group-assignment',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'ASSIGNMENTS' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
      ],
    }),

    deleteMinistryGroupAssignment: builder.mutation<void, string>({
      query: (id) => ({
        microservice: MicroserviceEnum.Church,
        url: `/ministry/group-assignment/${id}`,
        method: HttpRequestMethod.DELETE,
      }),
      invalidatesTags: [
        { type: 'ChurchMeeting', id: 'ASSIGNMENTS' },
        { type: 'ChurchMeeting', id: 'CALENDAR' },
      ],
    }),

    getChurchCampuses: builder.query<IChurchCampus[], GetChurchCampusesArgs | void>({
      query: (args) => {
        const churchId = args?.churchId || getActiveTenantChurchId();
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

    getVolunteerByUserId: builder.query<IVolunteer | null, { userId: string }>({
      query: ({ userId }) => ({
        microservice: MicroserviceEnum.Church,
        url: `/volunteer/by-user/${userId}`,
        method: HttpRequestMethod.GET,
      }),
      providesTags: (result) =>
        result ? [{ type: 'VolunteerAssignment', id: result.id }] : [],
    }),

    getChurchReports: builder.query<IChurchReport[], QueryChurchReportsArgs | void>({
      query: (args) => {
        const params: Record<string, unknown> = {};
        if (args?.churchCampusId) params.churchCampusId = args.churchCampusId;
        if (args?.churchMeetingId) params.churchMeetingId = args.churchMeetingId;
        if (args?.date) params.date = args.date;
        if (args?.ministryId) params.ministryId = args.ministryId;
        if (args?.serviceAreaGroupId) params.serviceAreaGroupId = args.serviceAreaGroupId;
        if (args?.type) params.type = args.type;
        if (args?.statuses && args.statuses.length > 0) params.statuses = args.statuses.join(',');
        if (args?.excludeClosed !== undefined) params.excludeClosed = args.excludeClosed;
        return {
          microservice: MicroserviceEnum.Church,
          url: '/church/reports',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      providesTags: (result) => [
        { type: 'ChurchReport', id: 'LIST' },
        ...(result || []).map((report) => ({
          type: 'ChurchReport' as const,
          id: report.id,
        })),
      ],
    }),

    createChurchReport: builder.mutation<IChurchReport, CreateChurchReportPayload>({
      query: (payload) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church/reports',
        method: HttpRequestMethod.POST,
        data: payload,
      }),
      invalidatesTags: [{ type: 'ChurchReport', id: 'LIST' }],
    }),

    updateChurchReportStatus: builder.mutation<
      IChurchReport,
      UpdateChurchReportStatusPayload
    >({
      query: ({ id, ...body }) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church/reports/${id}/status`,
        method: HttpRequestMethod.PATCH,
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChurchReport', id: 'LIST' },
        { type: 'ChurchReport', id: arg.id },
      ],
    }),

    addChurchReportNote: builder.mutation<IChurchReport, AddChurchReportNotePayload>({
      query: ({ id, ...body }) => ({
        microservice: MicroserviceEnum.Church,
        url: `/church/reports/${id}/notes`,
        method: HttpRequestMethod.POST,
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChurchReport', id: 'LIST' },
        { type: 'ChurchReport', id: arg.id },
      ],
    }),

    getPresignedReportUploadUrl: builder.mutation<
      PresignedUploadUrlResponse,
      RequestPresignedReportUploadUrlPayload
    >({
      query: (payload) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church/reports/presigned-upload-url',
        method: HttpRequestMethod.POST,
        data: payload,
      }),
    }),

    uploadReportPhoto: builder.mutation<PresignedUploadUrlResponse, FormData>({
      query: (formData) => ({
        microservice: MicroserviceEnum.Church,
        url: '/church/reports/upload-photo',
        method: HttpRequestMethod.POST,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    }),

    getVolunteerAssignments: builder.query<

      IVolunteerAssignment[],
      GetVolunteerAssignmentsPayload | void
    >({
      query: (args) => {
        const params: Record<string, string | number | boolean> = {};
        if (args?.order) params.order = args.order;
        if (args?.ministryId) params.ministryId = args.ministryId;
        if (args?.churchCampusId) params.churchCampusId = args.churchCampusId;
        if (args?.ministryAreaId) params.ministryAreaId = args.ministryAreaId;
        if (args?.ministryGroupConfigId) params.ministryGroupConfigId = args.ministryGroupConfigId;
        if (args?.serviceAreaGroupId) params.serviceAreaGroupId = args.serviceAreaGroupId;
        if (args?.volunteerId) params.volunteerId = args.volunteerId;
        if (args?.role) params.role = args.role;
        if (args?.state !== undefined) params.state = args.state;

        return {
          microservice: MicroserviceEnum.Church,
          url: '/volunteer-assignment',
          method: HttpRequestMethod.GET,
          params,
        };
      },
      transformResponse: (
        response: { data: IVolunteerAssignment[] } | IVolunteerAssignment[],
      ) => {
        const isArray = Array.isArray(response);
        const raw = (isArray ? response : response?.data || []) as any[];
        return raw.map((asg) => {
          const volunteer = asg.churchMember || asg.volunteer || asg.ministryVolunteer || {};
          const volunteerId =
            asg.churchMemberId || asg.volunteerId || asg.ministryVolunteerId || volunteer.id;
          const user = asg.churchMember?.user || asg.user || volunteer.user;

          return {
            ...asg,
            volunteerId,
            user,
            volunteer: {
              ...volunteer,
              id: volunteer.id || volunteerId,
              userId: volunteer.userId || user?.id,
              user,
            },
          } as IVolunteerAssignment;
        });
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'VolunteerAssignment' as const, id })),
              { type: 'VolunteerAssignment', id: 'LIST' },
            ]
          : [{ type: 'VolunteerAssignment', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useResolveChurchTenantQuery,
  useLazyResolveChurchTenantQuery,
  useGetChurchesQuery,
  useLazyGetChurchesQuery,
  useCreateChurchMutation,
  useUpdateChurchMutation,
  useUploadChurchBrandingLogoMutation,
  useGetChurchMembersQuery,
  useLazyGetChurchMembersQuery,
  useGetChurchStaffQuery,
  useLazyGetChurchStaffQuery,
  useUpdateChurchStaffRolesMutation,
  useDeleteChurchStaffMutation,
  useGetMinistryWorkspaceOverviewQuery,
  useLazyGetMinistryWorkspaceOverviewQuery,
  useGetChurchMeetingsQuery,
  useLazyGetChurchMeetingsQuery,
  useCreateChurchMeetingMutation,
  useUpdateChurchMeetingMutation,
  useDeleteChurchMeetingMutation,
  useBulkUpdateChurchMeetingStatesMutation,
  useGetChurchCampusesQuery,
  useLazyGetChurchCampusesQuery,
  useGetChurchPrintersQuery,
  useLazyGetChurchPrintersQuery,
  useDeleteVolunteerAssignmentMutation,
  useClearCacheMutation,
  useGetVolunteerAssignmentsQuery,
  useLazyGetVolunteerAssignmentsQuery,
  useGetVolunteerAttendanceQuery,
  useLazyGetVolunteerAttendanceQuery,
  useGetVolunteerAttendanceSummaryQuery,
  useLazyGetVolunteerAttendanceSummaryQuery,
  useRecordVolunteerAttendanceMutation,
  useRecordBatchVolunteerAttendanceMutation,
  useGetVolunteerByUserIdQuery,
  useLazyGetVolunteerByUserIdQuery,
  useGetChurchReportsQuery,
  useLazyGetChurchReportsQuery,
  useCreateChurchReportMutation,
  useUpdateChurchReportStatusMutation,
  useAddChurchReportNoteMutation,
  useGetPresignedReportUploadUrlMutation,
  useUploadReportPhotoMutation,
  useGetMinistriesQuery,
  useLazyGetMinistriesQuery,
  useGetMinistryAnalyticsQuery,
  useLazyGetMinistryAnalyticsQuery,
  useGetCalendarMeetingsQuery,
  useLazyGetCalendarMeetingsQuery,
  useGetChurchMeetingTagsQuery,
  useCreateChurchMeetingTagMutation,
  useUpdateChurchMeetingTagMutation,
  useDeleteChurchMeetingTagMutation,
  useUpsertChurchMeetingExceptionMutation,
  useDeleteChurchMeetingExceptionMutation,
  useGetMinistryGroupAssignmentsQuery,
  useUpsertMinistryGroupAssignmentMutation,
  useDeleteMinistryGroupAssignmentMutation,
} = churchApi;


