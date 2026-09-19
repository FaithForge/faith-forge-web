import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import { IInAppNotificationsResponse, IUserOverviewResponse } from '@/libs/models';
import { UserExperienceEnum } from '@/libs/utils/auth';
import { baseApi } from './baseApi';

/**
 * RTK Query endpoints for the User microservice.
 * Provides user identity, notification center, and holistic overview of system experiences and permissions.
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

    getInAppNotifications: builder.query<
      IInAppNotificationsResponse,
      { experience?: UserExperienceEnum } | void
    >({
      query: (args) => ({
        microservice: MicroserviceEnum.User,
        url: '/user/notifications',
        method: HttpRequestMethod.GET,
        params: args?.experience ? { experience: args.experience } : undefined,
      }),
      providesTags: ['Notification'],
    }),

    markInAppNotificationAsRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        microservice: MicroserviceEnum.User,
        url: `/user/notifications/${id}/read`,
        method: HttpRequestMethod.PATCH,
      }),
      invalidatesTags: ['Notification'],
    }),

    respondInAppNotification: builder.mutation<
      { success: boolean; message: string },
      { notificationId: string; response: string; message?: string }
    >({
      query: ({ notificationId, ...data }) => ({
        microservice: MicroserviceEnum.User,
        url: `/user/notifications/${notificationId}/respond`,
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteInAppNotification: builder.mutation<{ success: boolean; message?: string }, string>({
      query: (id) => ({
        microservice: MicroserviceEnum.User,
        url: `/user/notifications/${id}`,
        method: HttpRequestMethod.DELETE,
      }),
      invalidatesTags: ['Notification'],
    }),

    clearReadInAppNotifications: builder.mutation<
      { success: boolean; deletedCount: number },
      void
    >({
      query: () => ({
        microservice: MicroserviceEnum.User,
        url: '/user/notifications/read',
        method: HttpRequestMethod.DELETE,
      }),
      invalidatesTags: ['Notification'],
    }),

    getPendingTerms: builder.query<
      {
        hasPending: boolean;
        pendingTerms: Array<{
          termsType: string;
          requiredVersion: string;
          title: string;
          mandatory: boolean;
          accepted: boolean;
          acceptedVersion?: string;
          acceptedAt?: string;
        }>;
      },
      void
    >({
      query: () => ({
        microservice: MicroserviceEnum.User,
        url: '/user/terms/pending',
        method: HttpRequestMethod.GET,
      }),
      providesTags: ['UserTerms'],
    }),

    acceptTerms: builder.mutation<
      { success: boolean; id: string; acceptedAt: string },
      {
        termsType: string;
        version: string;
        channel?: string;
        churchId?: string;
        metadata?: Record<string, any>;
      }
    >({
      query: (data) => ({
        microservice: MicroserviceEnum.User,
        url: '/user/terms/accept',
        method: HttpRequestMethod.POST,
        data,
      }),
      invalidatesTags: ['UserTerms'],
    }),

    getMyTermsAcceptances: builder.query<any[], void>({
      query: () => ({
        microservice: MicroserviceEnum.User,
        url: '/user/terms/my-acceptances',
        method: HttpRequestMethod.GET,
      }),
      providesTags: ['UserTerms'],
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
  useGetInAppNotificationsQuery,
  useLazyGetInAppNotificationsQuery,
  useMarkInAppNotificationAsReadMutation,
  useRespondInAppNotificationMutation,
  useDeleteInAppNotificationMutation,
  useClearReadInAppNotificationsMutation,
  useGetPendingTermsQuery,
  useLazyGetPendingTermsQuery,
  useAcceptTermsMutation,
  useGetMyTermsAcceptancesQuery,
} = userApi;
