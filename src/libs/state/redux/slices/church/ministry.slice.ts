import { IMinistry, IMinistryArea, IMinistryGroupConfig, IServiceAreaGroup } from '@/libs/models';
import {
  CreateMinistry,
  CreateMinistryArea,
  CreateMinistryGroupConfig,
  CreateServiceAreaGroup,
  GetMinistries,
  GetMinistryAreas,
  GetMinistryGroupConfigs,
  GetServiceAreaGroups,
  UpdateMinistry,
  UpdateMinistryArea,
  UpdateMinistryGroupConfig,
  UpdateServiceAreaGroup,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MinistrySliceState {
  ministries: IMinistry[];
  loadingMinistries: boolean;
  errorMinistries: string | null;

  areasByMinistry: Record<string, IMinistryArea[]>;
  loadingAreas: boolean;
  errorAreas: string | null;

  groupsByMinistry: Record<string, IMinistryGroupConfig[]>;
  loadingGroups: boolean;
  errorGroups: string | null;

  serviceAreaGroups: IServiceAreaGroup[];
  loadingServiceAreaGroups: boolean;
  errorServiceAreaGroups: string | null;

  selectedMinistryId: string | null;
  loadingAction: boolean;
  errorAction: string | null;
}

const initialState: MinistrySliceState = {
  ministries: [],
  loadingMinistries: false,
  errorMinistries: null,

  areasByMinistry: {},
  loadingAreas: false,
  errorAreas: null,

  groupsByMinistry: {},
  loadingGroups: false,
  errorGroups: null,

  serviceAreaGroups: [],
  loadingServiceAreaGroups: false,
  errorServiceAreaGroups: null,

  selectedMinistryId: null,
  loadingAction: false,
  errorAction: null,
};

export const ministrySlice = createSlice({
  name: 'ministry',
  initialState,
  reducers: {
    setSelectedMinistryId: (state, action: PayloadAction<string | null>) => {
      state.selectedMinistryId = action.payload;
    },
    resetMinistryErrors: (state) => {
      state.errorMinistries = null;
      state.errorAreas = null;
      state.errorGroups = null;
      state.errorServiceAreaGroups = null;
      state.errorAction = null;
    },
  },
  extraReducers: (builder) => {
    // -------------------------------------------------------------------------
    // Ministries
    // -------------------------------------------------------------------------
    builder
      .addCase(GetMinistries.pending, (state) => {
        state.loadingMinistries = true;
        state.errorMinistries = null;
      })
      .addCase(GetMinistries.fulfilled, (state, action) => {
        state.loadingMinistries = false;
        state.ministries = action.payload;
      })
      .addCase(GetMinistries.rejected, (state, action) => {
        state.loadingMinistries = false;
        state.errorMinistries = (action.payload as string) || 'Error al obtener ministerios';
      });

    builder
      .addCase(CreateMinistry.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(CreateMinistry.fulfilled, (state, action) => {
        state.loadingAction = false;
        // Backend returns void on POST /ministry. Only push if a full object was returned.
        if (action.payload && (action.payload as IMinistry).id) {
          const exists = state.ministries.some((m) => m.id === (action.payload as IMinistry).id);
          if (!exists) {
            state.ministries.push(action.payload as IMinistry);
          }
        }
      })
      .addCase(CreateMinistry.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al crear ministerio';
      });

    builder
      .addCase(UpdateMinistry.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(UpdateMinistry.fulfilled, (state, action) => {
        state.loadingAction = false;
        if (action.payload && (action.payload as IMinistry).id) {
          const index = state.ministries.findIndex((m) => m.id === (action.payload as IMinistry).id);
          if (index !== -1) {
            state.ministries[index] = action.payload as IMinistry;
          }
        }
      })
      .addCase(UpdateMinistry.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al actualizar ministerio';
      });

    // -------------------------------------------------------------------------
    // Ministry Areas
    // -------------------------------------------------------------------------
    builder
      .addCase(GetMinistryAreas.pending, (state) => {
        state.loadingAreas = true;
        state.errorAreas = null;
      })
      .addCase(GetMinistryAreas.fulfilled, (state, action) => {
        state.loadingAreas = false;
        state.areasByMinistry[action.payload.ministryId] = action.payload.data;
      })
      .addCase(GetMinistryAreas.rejected, (state, action) => {
        state.loadingAreas = false;
        state.errorAreas = (action.payload as string) || 'Error al obtener áreas';
      });

    builder
      .addCase(CreateMinistryArea.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(CreateMinistryArea.fulfilled, (state, action) => {
        state.loadingAction = false;
        const { ministryId } = action.payload;
        if (!state.areasByMinistry[ministryId]) {
          state.areasByMinistry[ministryId] = [];
        }
        state.areasByMinistry[ministryId].push(action.payload);
      })
      .addCase(CreateMinistryArea.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al crear área';
      });

    builder
      .addCase(UpdateMinistryArea.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(UpdateMinistryArea.fulfilled, (state, action) => {
        state.loadingAction = false;
        const { ministryId, id } = action.payload;
        const list = state.areasByMinistry[ministryId];
        if (list) {
          const index = list.findIndex((a) => a.id === id);
          if (index !== -1) {
            list[index] = action.payload;
          }
        }
      })
      .addCase(UpdateMinistryArea.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al actualizar área';
      });

    // -------------------------------------------------------------------------
    // Ministry Group Configs
    // -------------------------------------------------------------------------
    builder
      .addCase(GetMinistryGroupConfigs.pending, (state) => {
        state.loadingGroups = true;
        state.errorGroups = null;
      })
      .addCase(GetMinistryGroupConfigs.fulfilled, (state, action) => {
        state.loadingGroups = false;
        state.groupsByMinistry[action.payload.ministryId] = action.payload.data;
      })
      .addCase(GetMinistryGroupConfigs.rejected, (state, action) => {
        state.loadingGroups = false;
        state.errorGroups = (action.payload as string) || 'Error al obtener grupos';
      });

    builder
      .addCase(CreateMinistryGroupConfig.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(CreateMinistryGroupConfig.fulfilled, (state, action) => {
        state.loadingAction = false;
        const { ministryId } = action.payload;
        if (!state.groupsByMinistry[ministryId]) {
          state.groupsByMinistry[ministryId] = [];
        }
        state.groupsByMinistry[ministryId].push(action.payload);
      })
      .addCase(CreateMinistryGroupConfig.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al crear grupo';
      });

    builder
      .addCase(UpdateMinistryGroupConfig.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(UpdateMinistryGroupConfig.fulfilled, (state, action) => {
        state.loadingAction = false;
        const { ministryId, id } = action.payload;
        const list = state.groupsByMinistry[ministryId];
        if (list) {
          const index = list.findIndex((g) => g.id === id);
          if (index !== -1) {
            list[index] = action.payload;
          }
        }
      })
      .addCase(UpdateMinistryGroupConfig.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al actualizar grupo';
      });

    // -------------------------------------------------------------------------
    // Service Area Groups
    // -------------------------------------------------------------------------
    builder
      .addCase(GetServiceAreaGroups.pending, (state) => {
        state.loadingServiceAreaGroups = true;
        state.errorServiceAreaGroups = null;
      })
      .addCase(GetServiceAreaGroups.fulfilled, (state, action) => {
        state.loadingServiceAreaGroups = false;
        state.serviceAreaGroups = action.payload;
      })
      .addCase(GetServiceAreaGroups.rejected, (state, action) => {
        state.loadingServiceAreaGroups = false;
        state.errorServiceAreaGroups =
          (action.payload as string) || 'Error al obtener equipos de servicio';
      });

    builder
      .addCase(CreateServiceAreaGroup.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(CreateServiceAreaGroup.fulfilled, (state, action) => {
        state.loadingAction = false;
        state.serviceAreaGroups.push(action.payload);
      })
      .addCase(CreateServiceAreaGroup.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al crear equipo de servicio';
      });

    builder
      .addCase(UpdateServiceAreaGroup.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(UpdateServiceAreaGroup.fulfilled, (state, action) => {
        state.loadingAction = false;
        const index = state.serviceAreaGroups.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.serviceAreaGroups[index] = action.payload;
        }
      })
      .addCase(UpdateServiceAreaGroup.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al actualizar equipo de servicio';
      });
  },
});

export const { setSelectedMinistryId, resetMinistryErrors } = ministrySlice.actions;
export default ministrySlice.reducer;
