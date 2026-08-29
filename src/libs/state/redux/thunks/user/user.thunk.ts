/* eslint-disable @typescript-eslint/no-explicit-any */
import { PAGINATION_REGISTRATION_LIMIT } from '@/libs/common-types/constants';
import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { IAssignUserRelationRole, ICreateUser, ICreateUserAccount, IUpdateUser, IUpdateUserAccount } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { parseEntitySearchParams } from '@/libs/utils/text';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

export const CreateUser = createAsyncThunk(
  'user/CreateUser',
  async (payload: ICreateUser, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.POST,
          url: `/user`,
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al crear usuario');
    }
  },
);

export const CreateUserAccount = createAsyncThunk(
  'user/CreateUserAccount',
  async (payload: ICreateUserAccount, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.POST,
          url: `/user/account`,
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al crear cuenta de usuario');
    }
  },
);

export const UpdateUserAccount = createAsyncThunk(
  'user/UpdateUserAccount',
  async (payload: IUpdateUserAccount, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.PUT,
          url: `/user/account`,
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al actualizar credenciales de usuario');
    }
  },
);

export const AssignUserRole = createAsyncThunk(
  'user/AssignUserRole',
  async (payload: IAssignUserRelationRole, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.POST,
          url: `/user/assign-role`,
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al asignar rol al usuario');
    }
  },
);

/**
 * Unassigns a role from a user via DELETE /user/unassign-role.
 *
 * @param {IAssignUserRelationRole} payload - User ID and role to unassign.
 * @returns {Promise<any>} The server response.
 */
export const UnassignUserRole = createAsyncThunk(
  'user/UnassignUserRole',
  async (payload: IAssignUserRelationRole, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.DELETE,
          url: `/user/unassign-role`,
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al eliminar rol del usuario');
    }
  },
);

/**
 * Fetches a single user by ID via GET /user/:id.
 *
 * @param {Object} payload - The payload containing the user ID.
 * @param {string} payload.id - The unique user UUID.
 * @returns {Promise<any>} The user object.
 */
export const GetUser = createAsyncThunk(
  'user/GetUser',
  async (payload: { id: string }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.GET,
          url: `/user/${payload.id}`,
          options: {
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Usuario no encontrado');
    }
  },
);

/**
 * Uploads a profile image for a user via POST /user/upload-image.
 *
 * @param {Object} payload - The form data containing the image file.
 * @returns {Promise<string>} The uploaded image key/URL.
 */
export const UploadUserImage = createAsyncThunk(
  'user/uploadUserImage',
  async (payload: { formData: any }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.POST,
        url: `/user/upload-image`,
        options: {
          data: payload.formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      })
    ).data;

    return response.key;
  },
);

/**
 * Searches a user by national ID / document number via GET /user/search-by-national-id.
 *
 * @param {string} nationalId - The national document number.
 * @returns {Promise<any>} The user object.
 */
export const GetUserByNationalId = createAsyncThunk(
  'user/GetUserByNationalId',
  async (nationalId: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.GET,
          url: `/user/search-by-national-id`,
          options: {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              nationalId,
            },
          },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Usuario no encontrado');
    }
  },
);

/**
 * Searches a user by first and last name via GET /user/search-by-full-name.
 *
 * @param {Object} payload - First name and last name.
 * @returns {Promise<any>} The user object.
 */
export const GetUserByFullName = createAsyncThunk(
  'user/GetUserByFullName',
  async (payload: { firstName: string; lastName: string }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/user/search-by-full-name`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...payload,
          },
        },
      })
    ).data;

    return response;
  },
);

/**
 * Updates user information via PUT /user/:id.
 *
 * @param {Object} payload - User ID and updated user data.
 * @returns {Promise<any>} The updated user object.
 */
export const UpdateUser = createAsyncThunk(
  'user/UpdateUser',
  async (payload: { id: string; updateUser: IUpdateUser }, { getState, rejectWithValue }) => {
    const { id, updateUser } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.User,
          method: HttpRequestMethod.PUT,
          url: `/user/${id}`,
          options: {
            data: {
              ...updateUser,
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response ?? updateUser;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al actualizar usuario');
    }
  },
);

/**
 * Helper function to extract search filter parameters from input search text.
 *
 * @param {string} [findText] - Raw search text.
 * @returns {Object} Search parameters object.
 */
const parseUserSearchParams = (findText?: string) => {
  const { filterByFirstName, filterByLastName, numericId } = parseEntitySearchParams(findText);
  return {
    filterByFirstName,
    filterByLastName,
    filterByNationalId: numericId,
  };
};

/**
 * Fetches the first page of users with optional search filtering via GET /users.
 *
 * @param {Object} payload - Search payload with findText.
 * @returns {Promise<any>} Paginated user data.
 */
export const GetUsers = createAsyncThunk(
  'user/GetUsers',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const filters = parseUserSearchParams(payload.findText);

    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/users`,
        options: {
          params: {
            limit: PAGINATION_REGISTRATION_LIMIT,
            page: 1,
            ...filters,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
);

/**
 * Fetches additional pages of users for infinite scrolling via GET /users.
 *
 * @param {Object} payload - Search payload with findText.
 * @returns {Promise<any>} Paginated user data.
 */
export const GetMoreUsers = createAsyncThunk(
  'user/GetMoreUsers',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const user = state.userSlice;
    const { token } = state.authSlice;
    const filters = parseUserSearchParams(payload.findText);

    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/users`,
        options: {
          params: {
            limit: PAGINATION_REGISTRATION_LIMIT,
            page: user.currentPage + 1,
            ...filters,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    return response;
  },
);
