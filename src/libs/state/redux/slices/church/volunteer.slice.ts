import {
  IVolunteer,
  IVolunteerAssignment,
  IVolunteerPermissionGrant,
  PaginationResponse,
  VolunteerRole,
} from '@/libs/models';
import {
  CreateVolunteer,
  CreateVolunteerAssignment,
  CreateVolunteerPermissionGrant,
  DeleteVolunteerAssignment,
  GetMoreVolunteers,
  GetUserPermissionGrants,
  GetVolunteerAssignments,
  GetVolunteerByUserId,
  GetVolunteers,
  GetVolunteerWithAssignments,
  RevokeVolunteerPermissionGrant,
  UpdateVolunteerAssignment,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VolunteersState {
  data: IVolunteer[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

export interface VolunteerSliceState {
  volunteers: VolunteersState;

  assignments: IVolunteerAssignment[];
  assignmentsByPartition: Record<string, IVolunteerAssignment[]>;
  loadingByPartition: Record<string, boolean>;
  loadingAssignments: boolean;
  errorAssignments: string | null;

  currentVolunteerAssignments: IVolunteerAssignment[];
  loadingCurrentAssignments: boolean;
  errorCurrentAssignments: string | null;

  activeUserVolunteer: IVolunteer | null;
  loadingUserVolunteer: boolean;

  userPermissionGrants: IVolunteerPermissionGrant[];
  loadingUserPermissionGrants: boolean;

  loadingAction: boolean;
  errorAction: string | null;
}

const initialState: VolunteerSliceState = {
  volunteers: {
    data: [],
    currentPage: 1,
    totalPages: 0,
    loading: false,
    loadingMore: false,
    error: null,
  },

  assignments: [],
  assignmentsByPartition: {},
  loadingByPartition: {},
  loadingAssignments: false,
  errorAssignments: null,

  currentVolunteerAssignments: [],
  loadingCurrentAssignments: false,
  errorCurrentAssignments: null,

  activeUserVolunteer: null,
  loadingUserVolunteer: false,

  userPermissionGrants: [],
  loadingUserPermissionGrants: false,

  loadingAction: false,
  errorAction: null,
};

export const volunteerSlice = createSlice({
  name: 'volunteer',
  initialState,
  reducers: {
    clearCurrentVolunteerAssignments: (state) => {
      state.currentVolunteerAssignments = [];
      state.errorCurrentAssignments = null;
    },
    clearActiveUserVolunteer: (state) => {
      state.activeUserVolunteer = null;
      state.userPermissionGrants = [];
    },
    clearPartitionAssignments: (state, action: PayloadAction<string>) => {
      delete state.assignmentsByPartition[action.payload];
      delete state.loadingByPartition[action.payload];
    },
    resetVolunteerErrors: (state) => {
      state.volunteers.error = null;
      state.errorAssignments = null;
      state.errorCurrentAssignments = null;
      state.errorAction = null;
    },
  },
  extraReducers: (builder) => {
    // -------------------------------------------------------------------------
    // Volunteers
    // -------------------------------------------------------------------------
    builder
      .addCase(GetVolunteers.pending, (state) => {
        state.volunteers.loading = true;
        state.volunteers.error = null;
      })
      .addCase(
        GetVolunteers.fulfilled,
        (state, action: PayloadAction<PaginationResponse<IVolunteer>>) => {
          state.volunteers.loading = false;
          state.volunteers.data = action.payload.data;
          state.volunteers.currentPage = action.payload.currentPage;
          state.volunteers.totalPages = action.payload.totalPages;
        },
      )
      .addCase(GetVolunteers.rejected, (state, action) => {
        state.volunteers.loading = false;
        state.volunteers.error = (action.payload as string) || 'Error al obtener voluntarios';
      });

    builder
      .addCase(GetMoreVolunteers.pending, (state) => {
        state.volunteers.loadingMore = true;
      })
      .addCase(
        GetMoreVolunteers.fulfilled,
        (state, action: PayloadAction<PaginationResponse<IVolunteer>>) => {
          state.volunteers.loadingMore = false;
          const existingIds = new Set(state.volunteers.data.map((v) => v.id));
          const newVolunteers = action.payload.data.filter((v) => !existingIds.has(v.id));
          state.volunteers.data.push(...newVolunteers);
          state.volunteers.currentPage = action.payload.currentPage;
          state.volunteers.totalPages = action.payload.totalPages;
        },
      )
      .addCase(GetMoreVolunteers.rejected, (state) => {
        state.volunteers.loadingMore = false;
      });

    builder
      .addCase(CreateVolunteer.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(CreateVolunteer.fulfilled, (state, action: PayloadAction<IVolunteer>) => {
        state.loadingAction = false;
        const index = state.volunteers.data.findIndex(
          (v) => v.id === action.payload.id || (v.userId && v.userId === action.payload.userId),
        );
        if (index !== -1) {
          state.volunteers.data[index] = action.payload;
        } else {
          state.volunteers.data.unshift(action.payload);
        }
      })
      .addCase(CreateVolunteer.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al registrar voluntario';
      });

    // -------------------------------------------------------------------------
    // Volunteer Assignments
    // -------------------------------------------------------------------------
    builder
      .addCase(GetVolunteerAssignments.pending, (state, action) => {
        const partitionKey = (action.meta as any)?.arg?.partitionKey;
        if (partitionKey) {
          state.loadingByPartition[partitionKey] = true;
        }
        state.loadingAssignments = true;
        state.errorAssignments = null;
      })
      .addCase(GetVolunteerAssignments.fulfilled, (state, action) => {
        const partitionKey = action.meta?.arg?.partitionKey || action.payload?.partitionKey;
        if (partitionKey) {
          state.loadingByPartition[partitionKey] = false;
        }
          state.loadingAssignments = false;

          const items: IVolunteerAssignment[] = Array.isArray(action.payload)
            ? action.payload
            : action.payload?.data || [];

          if (partitionKey) {
            state.assignmentsByPartition[partitionKey] = items;
          }

          // Merge into unified assignments state ensuring no duplicates
          const incomingIds = new Set(items.map((i) => i.id));
          const remaining = state.assignments.filter((a) => !incomingIds.has(a.id));
          state.assignments = [...remaining, ...items];
        },
      )
      .addCase(GetVolunteerAssignments.rejected, (state, action) => {
        const partitionKey = (action.meta as any)?.arg?.partitionKey;
        if (partitionKey) {
          state.loadingByPartition[partitionKey] = false;
        }
        state.loadingAssignments = false;
        state.errorAssignments =
          (action.payload as string) || 'Error al obtener asignaciones de voluntarios';
      });

    builder
      .addCase(CreateVolunteerAssignment.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(
        CreateVolunteerAssignment.fulfilled,
        (state, action: PayloadAction<IVolunteerAssignment>) => {
          state.loadingAction = false;
          if (!state.assignments.some((a) => a.id === action.payload.id)) {
            state.assignments.push(action.payload);
          }
          if (!state.currentVolunteerAssignments.some((a) => a.id === action.payload.id)) {
            state.currentVolunteerAssignments.push(action.payload);
          }

          // Update ONLY relevant partitions matching the assignment's role and scope
          Object.keys(state.assignmentsByPartition).forEach((key) => {
            const isMinistryCoord = key.startsWith('ministry_coords_');
            const isAreaCoord = key.startsWith('area_coords_');
            const isGroupCoord = key.startsWith('group_coords_');
            const isCampusTeams = key.startsWith('campus_teams_');

            let matches = false;
            if (
              isMinistryCoord &&
              action.payload.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR
            ) {
              matches = true;
            } else if (
              isAreaCoord &&
              action.payload.role === VolunteerRole.AREA_GENERAL_COORDINATOR
            ) {
              matches = true;
            } else if (
              isGroupCoord &&
              action.payload.role === VolunteerRole.GROUP_COORDINATOR
            ) {
              matches = true;
            } else if (
              isCampusTeams &&
              (action.payload.role === VolunteerRole.VOLUNTEER ||
                action.payload.role === VolunteerRole.SUPERVISOR)
            ) {
              const sagCampusId = action.payload.serviceAreaGroup?.churchCampusId;
              if (!sagCampusId || key.includes(sagCampusId)) {
                matches = true;
              }
            }

            if (matches) {
              const list = state.assignmentsByPartition[key];
              if (list && !list.some((a) => a.id === action.payload.id)) {
                state.assignmentsByPartition[key] = [...list, action.payload];
              }
            }
          });
        },
      )
      .addCase(CreateVolunteerAssignment.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al crear asignación';
      });

    builder
      .addCase(UpdateVolunteerAssignment.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(
        UpdateVolunteerAssignment.fulfilled,
        (state, action: PayloadAction<IVolunteerAssignment>) => {
          state.loadingAction = false;
          const idx = state.assignments.findIndex((a) => a.id === action.payload.id);
          if (idx !== -1) {
            state.assignments[idx] = action.payload;
          }
          const cIdx = state.currentVolunteerAssignments.findIndex(
            (a) => a.id === action.payload.id,
          );
          if (cIdx !== -1) {
            state.currentVolunteerAssignments[cIdx] = action.payload;
          }
          Object.keys(state.assignmentsByPartition).forEach((key) => {
            const pIdx = state.assignmentsByPartition[key].findIndex(
              (a) => a.id === action.payload.id,
            );
            if (pIdx !== -1) {
              state.assignmentsByPartition[key][pIdx] = action.payload;
            }
          });
        },
      )
      .addCase(UpdateVolunteerAssignment.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al actualizar asignación';
      });

    builder
      .addCase(DeleteVolunteerAssignment.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(DeleteVolunteerAssignment.fulfilled, (state, action: PayloadAction<string>) => {
        state.loadingAction = false;
        state.assignments = state.assignments.filter((a) => a.id !== action.payload);
        state.currentVolunteerAssignments = state.currentVolunteerAssignments.filter(
          (a) => a.id !== action.payload,
        );
        Object.keys(state.assignmentsByPartition).forEach((key) => {
          state.assignmentsByPartition[key] = state.assignmentsByPartition[key].filter(
            (a) => a.id !== action.payload,
          );
        });
      })
      .addCase(DeleteVolunteerAssignment.rejected, (state, action) => {
        state.loadingAction = false;
        state.errorAction = (action.payload as string) || 'Error al eliminar asignación';
      });

    // -------------------------------------------------------------------------
    // Volunteer with Assignments
    // -------------------------------------------------------------------------
    builder
      .addCase(GetVolunteerWithAssignments.pending, (state) => {
        state.loadingCurrentAssignments = true;
        state.errorCurrentAssignments = null;
      })
      .addCase(
        GetVolunteerWithAssignments.fulfilled,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state, action: PayloadAction<any>) => {
          state.loadingCurrentAssignments = false;
          state.currentVolunteerAssignments = Array.isArray(action.payload)
            ? action.payload
            : action.payload?.assignments || [];
        },
      )
      .addCase(GetVolunteerWithAssignments.rejected, (state, action) => {
        state.loadingCurrentAssignments = false;
        state.errorCurrentAssignments =
          (action.payload as string) || 'Error al obtener asignaciones del voluntario';
      });

    // -------------------------------------------------------------------------
    // Volunteer by User ID
    // -------------------------------------------------------------------------
    builder
      .addCase(GetVolunteerByUserId.pending, (state) => {
        state.loadingUserVolunteer = true;
      })
      .addCase(GetVolunteerByUserId.fulfilled, (state, action) => {
        state.loadingUserVolunteer = false;
        state.activeUserVolunteer = action.payload;
      })
      .addCase(GetVolunteerByUserId.rejected, (state) => {
        state.loadingUserVolunteer = false;
        state.activeUserVolunteer = null;
      });

    // -------------------------------------------------------------------------
    // User Temporary Permission Grants
    // -------------------------------------------------------------------------
    builder
      .addCase(GetUserPermissionGrants.pending, (state) => {
        state.loadingUserPermissionGrants = true;
      })
      .addCase(GetUserPermissionGrants.fulfilled, (state, action) => {
        state.loadingUserPermissionGrants = false;
        state.userPermissionGrants = action.payload;
      })
      .addCase(GetUserPermissionGrants.rejected, (state) => {
        state.loadingUserPermissionGrants = false;
        state.userPermissionGrants = [];
      });

    builder
      .addCase(CreateVolunteerPermissionGrant.fulfilled, (state, action) => {
        state.userPermissionGrants.unshift(action.payload);
      })
      .addCase(RevokeVolunteerPermissionGrant.fulfilled, (state, action) => {
        state.userPermissionGrants = state.userPermissionGrants.filter(
          (g) => g.id !== action.payload,
        );
      });
  },
});

export const {
  clearCurrentVolunteerAssignments,
  clearActiveUserVolunteer,
  clearPartitionAssignments,
  resetVolunteerErrors,
} = volunteerSlice.actions;
export default volunteerSlice.reducer;


