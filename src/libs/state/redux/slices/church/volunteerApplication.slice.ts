import {
  IPublicVolunteerCatalog,
  IVolunteerApplication,
  PaginationResponse,
  VolunteerApplicationStatus,
} from '@/libs/models';
import {
  ApproveVolunteerApplication,
  CreateVolunteerApplication,
  GetPublicVolunteerCatalog,
  GetVolunteerApplications,
  RejectVolunteerApplication,
} from '@/libs/state/redux/thunks/church/volunteerApplication.thunk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VolunteerApplicationSliceState {
  catalog: IPublicVolunteerCatalog | null;
  loadingCatalog: boolean;
  errorCatalog: string | null;

  pendingCount: number;

  applications: {
    data: IVolunteerApplication[];
    currentPage: number;
    totalPages: number;
    loading: boolean;
    error: string | null;
  };

  submitting: boolean;
  errorSubmitting: string | null;

  actionLoadingId: string | null;
  errorAction: string | null;
}

const initialState: VolunteerApplicationSliceState = {
  catalog: null,
  loadingCatalog: false,
  errorCatalog: null,

  pendingCount: 0,

  applications: {
    data: [],
    currentPage: 1,
    totalPages: 0,
    loading: false,
    error: null,
  },

  submitting: false,
  errorSubmitting: null,

  actionLoadingId: null,
  errorAction: null,
};

export const volunteerApplicationSlice = createSlice({
  name: 'volunteerApplication',
  initialState,
  reducers: {
    resetApplicationsState: (state) => {
      state.applications = {
        data: [],
        currentPage: 1,
        totalPages: 0,
        loading: false,
        error: null,
      };
    },
    setPendingApplicationsCount: (state, action: PayloadAction<number>) => {
      state.pendingCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // --- Public Catalog ---
    builder.addCase(GetPublicVolunteerCatalog.pending, (state) => {
      state.loadingCatalog = true;
      state.errorCatalog = null;
    });
    builder.addCase(
      GetPublicVolunteerCatalog.fulfilled,
      (state, action: PayloadAction<IPublicVolunteerCatalog>) => {
        state.loadingCatalog = false;
        state.catalog = action.payload;
      },
    );
    builder.addCase(GetPublicVolunteerCatalog.rejected, (state, action) => {
      state.loadingCatalog = false;
      state.errorCatalog = (action.payload as string) || 'Error al cargar el catálogo';
    });

    // --- Create Application ---
    builder.addCase(CreateVolunteerApplication.pending, (state) => {
      state.submitting = true;
      state.errorSubmitting = null;
    });
    builder.addCase(CreateVolunteerApplication.fulfilled, (state) => {
      state.submitting = false;
    });
    builder.addCase(CreateVolunteerApplication.rejected, (state, action) => {
      state.submitting = false;
      state.errorSubmitting = (action.payload as string) || 'Error al registrar la postulación';
    });

    // --- Get Volunteer Applications ---
    builder.addCase(GetVolunteerApplications.pending, (state, action) => {
      const page = action.meta.arg?.page ?? 1;
      if (page <= 1) {
        state.applications.loading = true;
      }
      state.applications.error = null;
    });
    builder.addCase(
      GetVolunteerApplications.fulfilled,
      (state, action: any) => {
        state.applications.loading = false;
        const page = action.meta.arg?.page ?? 1;

        if (page > 1) {
          const existingIds = new Set(state.applications.data.map((item) => item.id));
          const newItems = (action.payload.data || []).filter(
            (item: IVolunteerApplication) => !existingIds.has(item.id)
          );
          state.applications.data.push(...newItems);
          if (newItems.length === 0) {
            state.applications.totalPages = state.applications.currentPage;
          } else {
            state.applications.totalPages = action.payload.totalPages || state.applications.currentPage;
          }
        } else {
          state.applications.data = action.payload.data || [];
          state.applications.totalPages = action.payload.totalPages || 1;
        }

        state.applications.currentPage = action.payload.currentPage || page;

        const requestedStatus = action.meta.arg?.status;
        if (requestedStatus === VolunteerApplicationStatus.PENDING) {
          state.pendingCount = action.payload.totalItems ?? action.payload.data?.length ?? 0;
        }
      },
    );
    builder.addCase(GetVolunteerApplications.rejected, (state, action) => {
      state.applications.loading = false;
      state.applications.error = (action.payload as string) || 'Error al obtener postulaciones';
    });

    // --- Approve Application ---
    builder.addCase(ApproveVolunteerApplication.pending, (state, action) => {
      state.actionLoadingId = action.meta.arg;
      state.errorAction = null;
    });
    builder.addCase(
      ApproveVolunteerApplication.fulfilled,
      (state, action: PayloadAction<IVolunteerApplication>) => {
        state.actionLoadingId = null;
        state.pendingCount = Math.max(0, state.pendingCount - 1);
        const index = state.applications.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.applications.data[index] = action.payload;
        }
      },
    );
    builder.addCase(ApproveVolunteerApplication.rejected, (state, action) => {
      state.actionLoadingId = null;
      state.errorAction = (action.payload as string) || 'Error al aprobar la postulación';
    });

    // --- Reject Application ---
    builder.addCase(RejectVolunteerApplication.pending, (state, action) => {
      state.actionLoadingId = action.meta.arg.id;
      state.errorAction = null;
    });
    builder.addCase(
      RejectVolunteerApplication.fulfilled,
      (state, action: PayloadAction<IVolunteerApplication>) => {
        state.actionLoadingId = null;
        state.pendingCount = Math.max(0, state.pendingCount - 1);
        const index = state.applications.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.applications.data[index] = action.payload;
        }
      },
    );
    builder.addCase(RejectVolunteerApplication.rejected, (state, action) => {
      state.actionLoadingId = null;
      state.errorAction = (action.payload as string) || 'Error al rechazar la postulación';
    });
  },
});

export const { resetApplicationsState, setPendingApplicationsCount } = volunteerApplicationSlice.actions;
export default volunteerApplicationSlice.reducer;
