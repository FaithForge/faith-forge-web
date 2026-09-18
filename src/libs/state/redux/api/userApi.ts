import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import { IUserOverviewResponse } from '@/libs/models';
import { baseApi } from './baseApi';

/**
 * RTK Query endpoints for the User microservice.
 * Provides user identity and holistic overview of system experiences and permissions.
 */
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyOverview: builder.query<IUserOverviewResponse, void>({
      query: () => ({
        microservice: MicroserviceEnum.User,
        url: '/user/me/overview',
        method: HttpRequestMethod.GET,
      }),
      providesTags: ['UserOverview'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyOverviewQuery,
  useLazyGetMyOverviewQuery,
} = userApi;
