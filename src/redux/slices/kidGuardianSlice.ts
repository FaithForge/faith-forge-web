import { createSlice } from '@reduxjs/toolkit';
import { PAGINATION_REGISTRATION_LIMIT } from '../../constants/pagination';
import { IKidGuardians } from '../../models/KidGuardian';
import { GetKidGuardian } from '../../services/kidGuardianService';

const initialState: IKidGuardians = {
  data: [],
  current: undefined,
  currentPage: 1,
  itemsPerPage: PAGINATION_REGISTRATION_LIMIT,
  totalItems: 0,
  totalPages: 0,
  error: undefined,
  loading: false,
};

const kidGuardianSlice = createSlice({
  name: 'kidGuardian',
  initialState: initialState,
  reducers: {
    cleanCurrentKidGuardian: (state) => {
      state.current = undefined;
      state.loading = false;
      state.error = undefined;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetKidGuardian.pending, (state) => {
      state.current = undefined;
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidGuardian.fulfilled, (state, action) => {
      state.current = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKidGuardian.rejected, (state, action) => {
      state.current = undefined;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { cleanCurrentKidGuardian } =
  kidGuardianSlice.actions;
export default kidGuardianSlice.reducer;
