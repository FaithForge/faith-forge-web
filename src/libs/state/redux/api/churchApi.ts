import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import { IChurchCampus, IChurchMeeting, IChurchPrinter } from '@/libs/models';
import { baseApi } from './baseApi';

export interface GetChurchMeetingsArgs {
  churchCampusId?: string;
}

export interface GetChurchPrintersArgs {
  churchCampusId?: string;
}

/**
 * RTK Query endpoints for the Church microservice.
 * Injected modularly into the baseApi with declarative cache tag management.
 */
export const churchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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

    getChurchCampuses: builder.query<IChurchCampus[], void>({
      query: () => ({
        microservice: MicroserviceEnum.Church,
        url: '/church-campuses',
        method: HttpRequestMethod.GET,
      }),
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
  }),
  overrideExisting: false,
});

export const {
  useGetChurchMeetingsQuery,
  useLazyGetChurchMeetingsQuery,
  useGetChurchCampusesQuery,
  useLazyGetChurchCampusesQuery,
  useGetChurchPrintersQuery,
  useLazyGetChurchPrintersQuery,
} = churchApi;

