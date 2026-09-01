import { IVolunteerAttendance, PaginationResponse } from '@/libs/models';
import { GetVolunteerAttendance } from '@/libs/state/redux/thunks/church/volunteerAttendance.thunk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VolunteerAttendanceSliceState {
  data: IVolunteerAttendance[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: VolunteerAttendanceSliceState = {
  data: [],
  currentPage: 1,
  totalPages: 0,
  loading: false,
  error: null,
};

export const volunteerAttendanceSlice = createSlice({
  name: 'volunteerAttendance',
  initialState,
  reducers: {
    resetVolunteerAttendance: (state) => {
      state.data = [];
      state.currentPage = 1;
      state.totalPages = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(GetVolunteerAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        GetVolunteerAttendance.fulfilled,
        (state, action: PayloadAction<PaginationResponse<IVolunteerAttendance>>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.currentPage = action.payload.currentPage;
          state.totalPages = action.payload.totalPages;
        },
      )
      .addCase(GetVolunteerAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Error al obtener asistencias de voluntarios';
      });
  },
});

export const { resetVolunteerAttendance } = volunteerAttendanceSlice.actions;
export default volunteerAttendanceSlice.reducer;
