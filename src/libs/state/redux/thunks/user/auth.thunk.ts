import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { logout } from '../../slices/user/auth.slice';
import { setVolunteerContext } from '../../slices/church/volunteerContext.slice';

export const UserLogin = createAsyncThunk(
  'user/UserLogin',
  async (payload: { username: string; password: string }, { dispatch }) => {
    const { username, password } = payload;
    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.POST,
        url: `/user/login`,
        options: {
          data: {
            username,
            password,
          },
        },
      })
    ).data;

    const userMsRoles = [...(response?.user?.roles || [])];

    // Fetch dynamic church volunteer permissions with retry logic
    if (response?.token) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const churchPermsResponse = (
            await microserviceApiRequest({
              microservice: MS.Church,
              method: HttpRequestMethod.GET,
              url: `/volunteer/me/permissions`,
              options: {
                headers: {
                  Authorization: `Bearer ${response.token}`,
                },
              },
            })
          ).data;

          if (churchPermsResponse) {
            dispatch(
              setVolunteerContext({
                isChurchVolunteer: !!churchPermsResponse.isChurchVolunteer,
                campuses: churchPermsResponse.campuses || [],
                userMsRoles,
                hasActiveGrants: !!churchPermsResponse.hasActiveGrants,
              })
            );

            if (
              churchPermsResponse.permissions &&
              Array.isArray(churchPermsResponse.permissions)
            ) {
              response.user.roles = Array.from(
                new Set([
                  ...(response.user.roles || []),
                  ...churchPermsResponse.permissions,
                ])
              );
            }
            break;
          }
        } catch {
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        }
      }
    }

    return {
      ...response,
      userMsRoles,
    };
  },
);

export const FetchMyVolunteerPermissions = createAsyncThunk(
  'user/FetchMyVolunteerPermissions',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const token = state.authSlice.token;
    if (!token) return [];

    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/volunteer/me/permissions`,
        options: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
    ).data;

    if (response) {
      dispatch(
        setVolunteerContext({
          isChurchVolunteer: !!response.isChurchVolunteer,
          campuses: response.campuses || [],
          userMsRoles: state.authSlice.userMsRoles || [],
          hasActiveGrants: !!response.hasActiveGrants,
        })
      );
    }

    return response?.permissions || [];
  },
);

export const UserLogout = createAsyncThunk(
  'user/UserLogout',
  async (_, { getState, dispatch }) => {
    const refreshToken = (getState() as RootState).authSlice.refreshToken;
    try {
      if (refreshToken) {
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.POST,
          url: `/user/logout`,
          options: {
            data: { refreshToken },
          },
        });
      }
    } finally {
      dispatch(logout());
    }
  },
);
