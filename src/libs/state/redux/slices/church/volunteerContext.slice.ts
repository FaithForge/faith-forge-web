import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  IVolunteerCampusContext,
  IVolunteerGroupConfigContext,
  VolunteerRole,
} from '@/libs/models/Volunteer';
import { AppRole } from '@/libs/utils/auth';

export interface VolunteerContextState {
  isChurchVolunteer: boolean;
  campuses: IVolunteerCampusContext[];
  userMsRoles: AppRole[];
  hasActiveGrants?: boolean;
  activeCampusId: string | null;
  activeCampusName: string | null;
  activeGroupConfigId: string | null;
  activeGroupConfigName: string | null;
  activeVolunteerRole: VolunteerRole | null;
  isOnboardingCompleted: boolean;
}

const initialState: VolunteerContextState = {
  isChurchVolunteer: false,
  campuses: [],
  userMsRoles: [],
  hasActiveGrants: false,
  activeCampusId: null,
  activeCampusName: null,
  activeGroupConfigId: null,
  activeGroupConfigName: null,
  activeVolunteerRole: null,
  isOnboardingCompleted: false,
};

export const volunteerContextSlice = createSlice({
  name: 'volunteerContext',
  initialState,
  reducers: {
    setVolunteerContext: (
      state,
      action: PayloadAction<{
        isChurchVolunteer: boolean;
        campuses: IVolunteerCampusContext[];
        userMsRoles?: AppRole[];
        hasActiveGrants?: boolean;
      }>,
    ) => {
      state.isChurchVolunteer = action.payload.isChurchVolunteer;
      state.campuses = action.payload.campuses;
      if (action.payload.userMsRoles) {
        state.userMsRoles = action.payload.userMsRoles;
      }
      if (action.payload.hasActiveGrants !== undefined) {
        state.hasActiveGrants = action.payload.hasActiveGrants;
      }
      const isCurrentActiveValid = state.activeCampusId
        ? action.payload.campuses.some((c) => c.id === state.activeCampusId)
        : false;

      if (!isCurrentActiveValid) {
        if (action.payload.campuses.length === 1) {
          state.activeCampusId = action.payload.campuses[0].id;
          state.activeCampusName = action.payload.campuses[0].name;
        } else {
          state.activeCampusId = null;
          state.activeCampusName = null;
        }
      }
    },
    setUserMsRoles: (state, action: PayloadAction<AppRole[]>) => {
      state.userMsRoles = action.payload;
    },
    setActiveCampus: (
      state,
      action: PayloadAction<{ campusId: string; campusName: string }>,
    ) => {
      state.activeCampusId = action.payload.campusId;
      state.activeCampusName = action.payload.campusName;
      // Reset group when campus changes unless it still exists
      const campus = state.campuses.find((c) => c.id === action.payload.campusId);
      if (campus) {
        const stillHasGroup = campus.groups.some(
          (g: IVolunteerGroupConfigContext) => g.id === state.activeGroupConfigId,
        );
        if (!stillHasGroup) {
          state.activeGroupConfigId = null;
          state.activeGroupConfigName = null;
          state.activeVolunteerRole = null;
        }
      }
    },
    setActiveGroupConfig: (
      state,
      action: PayloadAction<{
        groupConfigId: string;
        groupConfigName: string;
        role?: VolunteerRole | null;
      }>,
    ) => {
      state.activeGroupConfigId = action.payload.groupConfigId;
      state.activeGroupConfigName = action.payload.groupConfigName;
      if (action.payload.role !== undefined) {
        state.activeVolunteerRole = action.payload.role;
      }
    },
    setActiveVolunteerRole: (
      state,
      action: PayloadAction<VolunteerRole | null>,
    ) => {
      state.activeVolunteerRole = action.payload;
    },
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.isOnboardingCompleted = action.payload;
    },
    resetVolunteerContext: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase('auth/logout', () => initialState);
  },
});

export const {
  setVolunteerContext,
  setUserMsRoles,
  setActiveCampus,
  setActiveGroupConfig,
  setActiveVolunteerRole,
  setOnboardingCompleted,
  resetVolunteerContext,
} = volunteerContextSlice.actions;

export default volunteerContextSlice.reducer;
