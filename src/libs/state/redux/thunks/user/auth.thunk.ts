import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { logout } from '../../slices/user/auth.slice';

export const UserLogin = createAsyncThunk(
  'user/UserLogin',
  async (payload: { username: string; password: string }) => {
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

          if (churchPermsResponse?.permissions && Array.isArray(churchPermsResponse.permissions)) {
            response.user.roles = Array.from(
              new Set([...(response.user.roles || []), ...churchPermsResponse.permissions])
            );
            break;
          }
        } catch {
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        }
      }
    }

    return response;
  },
);

export const FetchMyVolunteerPermissions = createAsyncThunk(
  'user/FetchMyVolunteerPermissions',
  async (_, { getState }) => {
    const token = (getState() as RootState).authSlice.token;
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
