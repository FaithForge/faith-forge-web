import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { IMinistry, IMinistryArea, IMinistryGroupConfig, IServiceAreaGroup } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

/**
 * Fetches ministries filtered by churchCampusId or churchId via GET /ministry.
 *
 * @param {Object} [payload] - Search payload.
 * @param {string} [payload.churchCampusId] - The campus identifier.
 * @param {string} [payload.churchId] - The church identifier.
 * @param {boolean} [payload.force] - Force refresh flag.
 * @returns {Promise<IMinistry[]>} List of ministries.
 */
export const GetMinistries = createAsyncThunk(
  'church/GetMinistries',
  async (
    payload: { churchCampusId?: string; churchId?: string; force?: boolean } = {},
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string> = {};
    if (payload.churchCampusId) params.churchCampusId = payload.churchCampusId;
    if (payload.churchId) params.churchId = payload.churchId;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/ministry',
          options: {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IMinistry[];
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al obtener los ministerios');
    }
  },
);

/**
 * Creates a new ministry for a specific campus via POST /ministry.
 *
 * @param {Object} payload - Ministry creation payload.
 * @param {string} payload.churchCampusId - The campus identifier.
 * @param {string} payload.churchId - The church identifier.
 * @param {string} payload.name - Name of the ministry.
 * @param {string} [payload.description] - Optional description.
 * @returns {Promise<IMinistry>} The created ministry.
 */
export const CreateMinistry = createAsyncThunk(
  'church/CreateMinistry',
  async (
    payload: { churchCampusId: string; churchId: string; name: string; description?: string },
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: '/ministry',
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IMinistry;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al crear el ministerio');
    }
  },
);

/**
 * Updates an existing ministry via PUT /ministry/:id.
 *
 * @param {Object} payload - Update parameters.
 * @param {string} payload.id - Ministry identifier.
 * @param {string} [payload.name] - Updated name.
 * @param {string} [payload.description] - Updated description.
 * @param {boolean} [payload.active] - Active status flag.
 * @returns {Promise<IMinistry>} The updated ministry.
 */
export const UpdateMinistry = createAsyncThunk(
  'church/UpdateMinistry',
  async (
    payload: { id: string; name?: string; description?: string; active?: boolean },
    { getState, rejectWithValue },
  ) => {
    const { id, ...data } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PUT,
          url: `/ministry/${id}`,
          options: {
            data,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IMinistry;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al actualizar el ministerio');
    }
  },
);

/**
 * Fetches areas for a specific ministry via GET /ministry-area?ministryId=.
 *
 * @param {Object} payload - Payload containing ministryId.
 * @param {string} payload.ministryId - The ministry identifier.
 * @param {boolean} [payload.force] - Force refresh bypassing cache.
 * @returns {Promise<{ ministryId: string; data: IMinistryArea[] }>} List of ministry areas with ministryId.
 */
export const GetMinistryAreas = createAsyncThunk(
  'church/GetMinistryAreas',
  async (payload: { ministryId: string; force?: boolean }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/ministry-area',
          options: {
            params: { ministryId: payload.ministryId },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return { ministryId: payload.ministryId, data: response as IMinistryArea[] };
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al obtener las áreas del ministerio');
    }
  },
);

/**
 * Creates a new service area within a ministry via POST /ministry-area.
 *
 * @param {Object} payload - Ministry area payload.
 * @param {string} payload.ministryId - Ministry ID.
 * @param {string} payload.name - Area name.
 * @param {string} [payload.description] - Optional description.
 * @returns {Promise<IMinistryArea>} The created ministry area.
 */
export const CreateMinistryArea = createAsyncThunk(
  'church/CreateMinistryArea',
  async (
    payload: { ministryId: string; name: string; description?: string },
    { getState, dispatch, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: '/ministry-area',
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      // Backend returns void on POST /ministry-area. Refresh the areas list from server immediately.
      await dispatch(GetMinistryAreas({ ministryId: payload.ministryId, force: true }));

      return (response || { ...payload }) as IMinistryArea;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al crear el área de servicio');
    }
  },
);

/**
 * Updates a ministry area via PUT /ministry-area/:id.
 *
 * @param {Object} payload - Update parameters.
 * @param {string} payload.id - Area identifier.
 * @param {string} [payload.name] - Area name.
 * @param {string} [payload.description] - Area description.
 * @param {boolean} [payload.active] - Active status flag.
 * @param {string} [payload.ministryId] - Optional ministryId to trigger fresh query.
 * @returns {Promise<IMinistryArea>} The updated ministry area.
 */
export const UpdateMinistryArea = createAsyncThunk(
  'church/UpdateMinistryArea',
  async (
    payload: { id: string; name?: string; description?: string; active?: boolean; ministryId?: string },
    { getState, dispatch, rejectWithValue },
  ) => {
    const { id, ministryId, ...data } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PUT,
          url: `/ministry-area/${id}`,
          options: {
            data,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      if (ministryId) {
        await dispatch(GetMinistryAreas({ ministryId, force: true }));
      }

      return response as IMinistryArea;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al actualizar el área de servicio');
    }
  },
);

/**
 * Fetches group configurations for a ministry via GET /ministry-group-config?ministryId=.
 *
 * @param {Object} payload - Payload containing ministryId.
 * @param {string} payload.ministryId - The ministry identifier.
 * @param {boolean} [payload.force] - Force refresh flag.
 * @returns {Promise<{ ministryId: string; data: IMinistryGroupConfig[] }>} List of group configs with ministryId.
 */
export const GetMinistryGroupConfigs = createAsyncThunk(
  'church/GetMinistryGroupConfigs',
  async (payload: { ministryId: string; force?: boolean }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/ministry-group-config',
          options: {
            params: { ministryId: payload.ministryId },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return { ministryId: payload.ministryId, data: response as IMinistryGroupConfig[] };
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al obtener los grupos configurados');
    }
  },
);

/**
 * Creates a new ministry group configuration via POST /ministry-group-config.
 *
 * @param {Object} payload - Group configuration payload.
 * @param {string} payload.ministryId - Ministry ID.
 * @param {string} payload.name - Group name.
 * @param {number} [payload.position] - Order position.
 * @returns {Promise<IMinistryGroupConfig>} The created group config.
 */
export const CreateMinistryGroupConfig = createAsyncThunk(
  'church/CreateMinistryGroupConfig',
  async (
    payload: { ministryId: string; name: string; position?: number },
    { getState, dispatch, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: '/ministry-group-config',
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      await dispatch(GetMinistryGroupConfigs({ ministryId: payload.ministryId, force: true }));

      return response as IMinistryGroupConfig;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al crear la configuración de grupo');
    }
  },
);

/**
 * Updates a ministry group configuration via PUT /ministry-group-config/:id.
 *
 * @param {Object} payload - Group config update data.
 * @param {string} payload.id - Group config identifier.
 * @param {string} [payload.name] - Group name.
 * @param {number} [payload.position] - Position order.
 * @param {boolean} [payload.active] - Active status flag.
 * @returns {Promise<IMinistryGroupConfig>} The updated group config.
 */
export const UpdateMinistryGroupConfig = createAsyncThunk(
  'church/UpdateMinistryGroupConfig',
  async (
    payload: { id: string; name?: string; position?: number; active?: boolean; ministryId?: string },
    { getState, dispatch, rejectWithValue },
  ) => {
    const { id, ministryId, ...data } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PUT,
          url: `/ministry-group-config/${id}`,
          options: {
            data,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      if (ministryId) {
        await dispatch(GetMinistryGroupConfigs({ ministryId, force: true }));
      }

      return response as IMinistryGroupConfig;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data ?? 'Error al actualizar la configuración de grupo',
      );
    }
  },
);

/**
 * Fetches service area group combinations via GET /service-area-group.
 *
 * @param {Object} [payload] - Search query parameters.
 * @param {string} [payload.ministryAreaId] - Area identifier filter.
 * @param {string} [payload.groupConfigId] - Group config identifier filter.
 * @returns {Promise<IServiceAreaGroup[]>} List of service area groups.
 */
export const GetServiceAreaGroups = createAsyncThunk(
  'church/GetServiceAreaGroups',
  async (
    payload: {
      ministryAreaId?: string;
      groupConfigId?: string;
    } = {},
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string> = {};
    if (payload.ministryAreaId) params.ministryAreaId = payload.ministryAreaId;
    if (payload.groupConfigId) params.groupConfigId = payload.groupConfigId;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/service-area-group',
          options: {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IServiceAreaGroup[];
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al obtener los equipos de servicio');
    }
  },
);

/**
 * Creates a new service area group (Campus × Area × Group combination) via POST /service-area-group.
 *
 * @param {Object} payload - Service area group creation parameters.
 * @param {string} payload.ministryAreaId - Area ID.
 * @param {string} payload.ministryGroupConfigId - Group Config ID.
 * @param {string} payload.churchCampusId - Church Campus ID.
 * @returns {Promise<IServiceAreaGroup>} The created service area group.
 */
export const CreateServiceAreaGroup = createAsyncThunk(
  'church/CreateServiceAreaGroup',
  async (
    payload: { ministryAreaId: string; ministryGroupConfigId: string; churchCampusId: string },
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: '/service-area-group',
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IServiceAreaGroup;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al crear el equipo de servicio');
    }
  },
);

/**
 * Updates a service area group active state via PUT /service-area-group/:id.
 *
 * @param {Object} payload - Update parameters.
 * @param {string} payload.id - Service area group identifier.
 * @param {boolean} payload.active - Active status flag.
 * @returns {Promise<IServiceAreaGroup>} The updated service area group.
 */
export const UpdateServiceAreaGroup = createAsyncThunk(
  'church/UpdateServiceAreaGroup',
  async (payload: { id: string; active: boolean }, { getState, rejectWithValue }) => {
    const { id, active } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PUT,
          url: `/service-area-group/${id}`,
          options: {
            data: { active },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IServiceAreaGroup;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al actualizar el equipo de servicio');
    }
  },
);
