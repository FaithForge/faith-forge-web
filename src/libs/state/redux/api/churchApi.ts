import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import {
  GetMinistryWorkspaceArgs,
  IChurchCampus,
  IChurchMeeting,
  IChurchPrinter,
  IMinistryWorkspaceOverview,
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
} = churchApi;

