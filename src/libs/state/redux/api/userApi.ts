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

    getVapidPublicKey: builder.query<{ publicKey: string }, { token?: string } | void>({
      query: (args) => ({
        microservice: MicroserviceEnum.User,
        url: '/push/vapid-public-key',
        method: HttpRequestMethod.GET,
        headers: args?.token ? { Authorization: `Bearer ${args.token}` } : undefined,
      }),
    }),

    subscribePushNotification: builder.mutation<
      { success: boolean },
      { subscription: unknown; token?: string }
    >({
      query: (payload) => ({
        microservice: MicroserviceEnum.User,
        url: '/push/subscribe',
        method: HttpRequestMethod.POST,
        data: { subscription: payload.subscription },
        headers: payload.token ? { Authorization: `Bearer ${payload.token}` } : undefined,
      }),
    }),

    unsubscribePushNotification: builder.mutation<
      { success: boolean },
      { endpoint: string }
    >({
      query: (payload) => ({
        microservice: MicroserviceEnum.User,
        url: '/push/unsubscribe',
        method: HttpRequestMethod.DELETE,
        data: payload,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyOverviewQuery,
  useLazyGetMyOverviewQuery,
  useGetVapidPublicKeyQuery,
  useLazyGetVapidPublicKeyQuery,
  useSubscribePushNotificationMutation,
  useUnsubscribePushNotificationMutation,
} = userApi;
