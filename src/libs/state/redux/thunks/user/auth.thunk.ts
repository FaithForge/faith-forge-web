import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { logout, setExperiences } from '../../slices/user/auth.slice';
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

    // Fetch user experiences, permissions and church volunteer context
    let experiences: any[] = [];
    if (response?.token) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const overviewResponse = (
            await microserviceApiRequest({
              microservice: MS.User,
              method: HttpRequestMethod.GET,
              url: `/user/me/overview`,
              options: {
                headers: {
                  Authorization: `Bearer ${response.token}`,
                },
              },
            })
          ).data;

          if (overviewResponse) {
            experiences = overviewResponse.experiences || [];
            const vContext = overviewResponse.volunteerContext || overviewResponse;
            dispatch(
              setVolunteerContext({
                isChurchVolunteer: !!vContext.isChurchVolunteer,
                campuses: vContext.campuses || [],
                userMsRoles,
                hasActiveGrants: !!vContext.hasActiveGrants,
              })
            );

            if (
              overviewResponse.permissions &&
              Array.isArray(overviewResponse.permissions)
            ) {
              response.user.roles = Array.from(
                new Set([
                  ...(response.user.roles || []),
                  ...overviewResponse.permissions,
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
      experiences,
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
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/user/me/overview`,
        options: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
    ).data;

    if (response) {
      const vContext = response.volunteerContext || response;
      dispatch(
        setVolunteerContext({
          isChurchVolunteer: !!vContext.isChurchVolunteer,
          campuses: vContext.campuses || [],
          userMsRoles: state.authSlice.userMsRoles || [],
          hasActiveGrants: !!vContext.hasActiveGrants,
        })
      );
      if (response.experiences && Array.isArray(response.experiences)) {
        dispatch(setExperiences(response.experiences));
      }
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
