import { IVolunteer, IVolunteerAssignment, PaginationResponse } from '@/libs/models';
import {
  CreateVolunteer,
  CreateVolunteerAssignment,
  DeleteVolunteerAssignment,
  GetMoreVolunteers,
  GetVolunteerAssignments,
  GetVolunteers,
  GetVolunteerWithAssignments,
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
          state.assignments.push(action.payload);
          state.currentVolunteerAssignments.push(action.payload);

          // Update any relevant partitions
          Object.keys(state.assignmentsByPartition).forEach((key) => {
            const list = state.assignmentsByPartition[key];
            if (list && !list.some((a) => a.id === action.payload.id)) {
              state.assignmentsByPartition[key] = [...list, action.payload];
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
  },
});

export const {
  clearCurrentVolunteerAssignments,
  clearPartitionAssignments,
  resetVolunteerErrors,
} = volunteerSlice.actions;
export default volunteerSlice.reducer;

