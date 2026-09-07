import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { ChurchMeetingStateEnum, ChurchPrinterStateEnum } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../../store';

export const GetChurchCampuses = createAsyncThunk(
  'church/GetChurchCampuses',
  async (payload: { force?: boolean } | void, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-campus`,
        options: {
          params: { churchId: import.meta.env.VITE_CHURCH_ID },
          headers: { Authorization: `Bearer ${token}` },
          forceRefresh: true,
          cache: false,
        },
      })
    ).data;
    return response;
  },
  {
    condition: (payload, { getState }) => {
      if (payload && typeof payload === 'object' && payload.force) return true;
      const state = getState() as RootState;
      // Debounce: prevent duplicate parallel calls when a request is already in-flight
      if (state.churchCampusSlice.loading) return false;
      return true;
    },
  },
);

export const GetChurchMeetings = createAsyncThunk(
  'church/GetChurchMeetings',
  async (
    payload: { churchCampusId: string; state?: string; states?: string[]; force?: boolean },
    { getState },
  ) => {
    const { churchCampusId, state: stateMeeting, states: statesList } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const statesToSend =
      statesList && statesList.length > 0
        ? statesList
        : stateMeeting
          ? [stateMeeting]
          : [ChurchMeetingStateEnum.ACTIVE];

    const searchParams = new URLSearchParams();
    searchParams.append('churchCampusId', churchCampusId);
    statesToSend.forEach((s) => searchParams.append('states', s));

    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-meeting?${searchParams.toString()}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
  {
    condition: (payload, { getState }) => {
      if (payload.force) return true;
      const state = getState() as RootState;
      const meetingSlice = state.churchMeetingSlice as any;
      const campusMeetings = meetingSlice.meetingsByCampus?.[payload.churchCampusId];
      const hasMeetingsForCampus = campusMeetings && campusMeetings.length > 0;
      return !hasMeetingsForCampus;
    },
  },
);

/**
 * Fetches all church meetings for a given campus, including all states.
 * Intended for the admin view where all states must be visible.
 *
 * @param {string} churchCampusId - The ID of the campus to fetch meetings for.
 * @returns {Promise<IChurchMeeting[]>} - All meetings for the campus across all states.
 */
export const GetAllChurchMeetingsAdmin = createAsyncThunk(
  'church/GetAllChurchMeetingsAdmin',
  async (churchCampusId: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const adminStates = [
      ChurchMeetingStateEnum.ACTIVE,
      ChurchMeetingStateEnum.ACTIVE_WITHOUT_DISPLAY,
      ChurchMeetingStateEnum.DISABLE,
    ];

    const searchParams = new URLSearchParams();
    searchParams.append('churchCampusId', churchCampusId);
    adminStates.forEach((s) => searchParams.append('states', s));

    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-meeting?${searchParams.toString()}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
          forceRefresh: true,
        },
      })
    ).data;
    return response;
  },
);

/**
 * Sends a bulk state update for a list of church meetings.
 * Calls PATCH /church-meeting/bulk-state with the provided items.
 *
 * @param {{ id: string; state: ChurchMeetingStateEnum }[]} items - Array of meeting ID + new state pairs.
 * @returns {Promise<void>} - Resolves when the update is applied.
 */
export const BulkUpdateChurchMeetingStates = createAsyncThunk(
  'church/BulkUpdateChurchMeetingStates',
  async (items: { id: string; state: ChurchMeetingStateEnum }[], { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.PATCH,
        url: `/church-meeting/bulk-state`,
        options: {
          data: { items },
          headers: { Authorization: `Bearer ${token}` },
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al actualizar estados');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

export const GetChurchPrinters = createAsyncThunk(
  'church/GetChurchPrinters',
  async (payload: string | { churchCampusId: string; force?: boolean }, { getState }) => {
    const churchCampusId = typeof payload === 'string' ? payload : payload.churchCampusId;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-printers`,
        options: {
          params: { churchCampusId, states: ChurchPrinterStateEnum.ACTIVE },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
  {
    condition: (payload, { getState }) => {
      const churchCampusId = typeof payload === 'string' ? payload : payload.churchCampusId;
      const force = typeof payload === 'object' && payload.force;
      if (force) return true;
      const state = getState() as RootState;
      const printerSlice = state.churchPrinterSlice as any;
      const campusPrinters = printerSlice.printersByCampus?.[churchCampusId];
      const hasPrintersForCampus = campusPrinters && campusPrinters.length > 0;
      return !hasPrintersForCampus;
    },
  },
);

/**
 * Creates a new church campus.
 *
 * @param {object} payload - The campus creation data.
 * @returns {Promise<void>} Resolves when the campus is created.
 */
export const CreateChurchCampus = createAsyncThunk(
  'church/CreateChurchCampus',
  async (
    payload: { name: string; description?: string; position?: number; state?: string },
    { getState, rejectWithValue, dispatch },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.POST,
        url: `/church-campus`,
        options: {
          data: {
            ...payload,
            churchId: import.meta.env.VITE_CHURCH_ID,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      await dispatch(GetChurchCampuses({ force: true }));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al crear la sede');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Updates an existing church campus.
 *
 * @param {object} payload - The campus update data.
 * @returns {Promise<any>} Resolves with the updated campus.
 */
export const UpdateChurchCampus = createAsyncThunk(
  'church/UpdateChurchCampus',
  async (
    payload: { id: string; name?: string; description?: string; position?: number; state?: string },
    { getState, rejectWithValue, dispatch },
  ) => {
    const { id, ...data } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PATCH,
          url: `/church-campus/${id}`,
          options: {
            data,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;
      await dispatch(GetChurchCampuses({ force: true }));
      return response;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al actualizar la sede');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Soft deletes a church campus.
 *
 * @param {string} id - The ID of the campus to delete.
 * @returns {Promise<void>} Resolves when the campus is deleted.
 */
export const DeleteChurchCampus = createAsyncThunk(
  'church/DeleteChurchCampus',
  async (id: string, { getState, rejectWithValue, dispatch }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.DELETE,
        url: `/church-campus/${id}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      await dispatch(GetChurchCampuses({ force: true }));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al eliminar la sede');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Fetches all printers for a campus including inactive ones for administration.
 *
 * @param {string} churchCampusId - Campus ID.
 * @returns {Promise<{ churchCampusId: string; printers: any[] }>} List of printers.
 */
export const GetChurchPrintersAdmin = createAsyncThunk(
  'church/GetChurchPrintersAdmin',
  async (churchCampusId: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: `/church-printers?churchCampusId=${churchCampusId}&states=ACTIVE&states=INACTIVE`,
          options: {
            headers: { Authorization: `Bearer ${token}` },
            forceRefresh: true,
          },
        })
      ).data;
      return { churchCampusId, printers: response };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al obtener impresoras');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Creates a new church printer.
 *
 * @param {object} payload - Printer creation payload.
 * @returns {Promise<void>} Resolves when the printer is created.
 */
export const CreateChurchPrinter = createAsyncThunk(
  'church/CreateChurchPrinter',
  async (
    payload: { name: string; churchCampusId: string; state?: string },
    { getState, rejectWithValue, dispatch },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.POST,
        url: `/church-printer`,
        options: {
          data: payload,
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      if (payload.churchCampusId) {
        await dispatch(GetChurchPrintersAdmin(payload.churchCampusId));
        await dispatch(GetChurchPrinters({ churchCampusId: payload.churchCampusId, force: true }));
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al registrar la impresora');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Updates an existing church printer.
 *
 * @param {object} payload - Printer update payload.
 * @returns {Promise<any>} Updated printer.
 */
export const UpdateChurchPrinter = createAsyncThunk(
  'church/UpdateChurchPrinter',
  async (
    payload: { id: string; name?: string; state?: string; churchCampusId?: string },
    { getState, rejectWithValue, dispatch },
  ) => {
    const { id, ...data } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PATCH,
          url: `/church-printer/${id}`,
          options: {
            data,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;
      if (payload.churchCampusId) {
        await dispatch(GetChurchPrintersAdmin(payload.churchCampusId));
        await dispatch(GetChurchPrinters({ churchCampusId: payload.churchCampusId, force: true }));
      }
      return response;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al actualizar la impresora');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Soft deletes a church printer.
 *
 * @param {object} payload - Target printer id and campus id.
 * @returns {Promise<void>} Resolves when deleted.
 */
export const DeleteChurchPrinter = createAsyncThunk(
  'church/DeleteChurchPrinter',
  async (
    payload: { id: string; churchCampusId: string },
    { getState, rejectWithValue, dispatch },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.DELETE,
        url: `/church-printer/${payload.id}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      await dispatch(GetChurchPrintersAdmin(payload.churchCampusId));
      await dispatch(GetChurchPrinters({ churchCampusId: payload.churchCampusId, force: true }));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al eliminar la impresora');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Creates a new church meeting / service schedule.
 *
 * @param {object} payload - Meeting creation payload.
 * @returns {Promise<void>} Resolves when created.
 */
export const CreateChurchMeeting = createAsyncThunk(
  'church/CreateChurchMeeting',
  async (
    payload: {
      name: string;
      description?: string;
      day: string;
      initialHour: string;
      finalHour: string;
      initialRegistrationHour: string;
      finalRegistrationHour: string;
      position?: number;
      state?: string;
      churchCampusId: string;
    },
    { getState, rejectWithValue, dispatch },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.POST,
        url: `/church-meeting`,
        options: {
          data: payload,
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      await dispatch(GetAllChurchMeetingsAdmin(payload.churchCampusId));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al crear el servicio');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Updates an existing church meeting / service schedule.
 *
 * @param {object} payload - Meeting update payload.
 * @returns {Promise<any>} Updated meeting.
 */
export const UpdateChurchMeeting = createAsyncThunk(
  'church/UpdateChurchMeeting',
  async (
    payload: {
      id: string;
      name?: string;
      description?: string;
      day?: string;
      initialHour?: string;
      finalHour?: string;
      initialRegistrationHour?: string;
      finalRegistrationHour?: string;
      position?: number;
      state?: string;
      churchCampusId: string;
    },
    { getState, rejectWithValue, dispatch },
  ) => {
    const { id, churchCampusId, ...data } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PATCH,
          url: `/church-meeting/${id}`,
          options: {
            data,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;
      await dispatch(GetAllChurchMeetingsAdmin(churchCampusId));
      return response;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al actualizar el servicio');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

/**
 * Soft deletes a church meeting.
 *
 * @param {object} payload - Target meeting id and campus id.
 * @returns {Promise<void>} Resolves when deleted.
 */
export const DeleteChurchMeeting = createAsyncThunk(
  'church/DeleteChurchMeeting',
  async (
    payload: { id: string; churchCampusId: string },
    { getState, rejectWithValue, dispatch },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.DELETE,
        url: `/church-meeting/${payload.id}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      await dispatch(GetAllChurchMeetingsAdmin(payload.churchCampusId));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al eliminar el servicio');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

