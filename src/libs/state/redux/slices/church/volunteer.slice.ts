import { IVolunteer, IVolunteerAssignment } from '@/libs/models';
import {
  CreateVolunteer,
  CreateVolunteerAssignment,
  DeleteVolunteerAssignment,
  GetVolunteerAssignments,
  GetVolunteers,
  GetVolunteerWithAssignments,
  UpdateVolunteerAssignment,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VolunteerSliceState {
  volunteers: IVolunteer[];
  loadingVolunteers: boolean;
  errorVolunteers: string | null;

  assignments: IVolunteerAssignment[];
  loadingAssignments: boolean;
  errorAssignments: string | null;

  currentVolunteerAssignments: IVolunteerAssignment[];
  loadingCurrentAssignments: boolean;
  errorCurrentAssignments: string | null;

  loadingAction: boolean;
  errorAction: string | null;
}

const initialState: VolunteerSliceState = {
  volunteers: [],
  loadingVolunteers: false,
  errorVolunteers: null,

  assignments: [],
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
    resetVolunteerErrors: (state) => {
      state.errorVolunteers = null;
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
        state.loadingVolunteers = true;
        state.errorVolunteers = null;
      })
      .addCase(GetVolunteers.fulfilled, (state, action: PayloadAction<IVolunteer[]>) => {
        state.loadingVolunteers = false;
        state.volunteers = action.payload;
      })
      .addCase(GetVolunteers.rejected, (state, action) => {
        state.loadingVolunteers = false;
        state.errorVolunteers = (action.payload as string) || 'Error al obtener voluntarios';
      });

    builder
      .addCase(CreateVolunteer.pending, (state) => {
        state.loadingAction = true;
        state.errorAction = null;
      })
      .addCase(CreateVolunteer.fulfilled, (state, action: PayloadAction<IVolunteer>) => {
        state.loadingAction = false;
        const index = state.volunteers.findIndex(
          (v) => v.id === action.payload.id || (v.userId && v.userId === action.payload.userId),
        );
        if (index !== -1) {
          state.volunteers[index] = action.payload;
        } else {
          state.volunteers.push(action.payload);
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
      .addCase(GetVolunteerAssignments.pending, (state) => {
        state.loadingAssignments = true;
        state.errorAssignments = null;
      })
      .addCase(
        GetVolunteerAssignments.fulfilled,
        (state, action: PayloadAction<IVolunteerAssignment[]>) => {
          state.loadingAssignments = false;
          state.assignments = action.payload;
        },
      )
      .addCase(GetVolunteerAssignments.rejected, (state, action) => {
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

export const { clearCurrentVolunteerAssignments, resetVolunteerErrors } = volunteerSlice.actions;
export default volunteerSlice.reducer;
