import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PAGINATION_REGISTRATION_LIMIT } from '../../constants/pagination';
import { IKid, IKids } from '../../models/Kid';
import {
  CreateKid,
  GetKid,
  GetKidGroups,
  GetKidMedicalConditions,
  GetKids,
  GetMoreKids,
  UpdateKid,
} from '../../services/kidService';

const initialState: IKids = {
  data: [],
  groups: [],
  medicalConditions: [],
  current: undefined,
  currentPage: 1,
  itemsPerPage: PAGINATION_REGISTRATION_LIMIT,
  totalItems: 0,
  totalPages: 0,
  error: undefined,
  loading: false,
};

const kidSlice = createSlice({
  name: 'kid',
  initialState: initialState,
  reducers: {
    loadingKidEnable: (state) => {
      state.loading = true;
    },
    loadingKidDisable: (state) => {
      state.loading = true;
    },
    updateCurrentKid: (state, action: PayloadAction<IKid>) => {
      state.current = action.payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetKids.pending, (state) => {
      state.data = [];
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKids.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.currentPage = 1;
      state.totalItems = action.payload.totalItems;
      state.totalPages = action.payload.totalPages;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKids.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(GetMoreKids.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetMoreKids.fulfilled, (state, action) => {
      state.data = Array.from(state.data).concat(action.payload.data);
      state.currentPage = state.currentPage + 1;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetMoreKids.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(GetKidGroups.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidGroups.fulfilled, (state, action) => {
      state.groups = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKidGroups.rejected, (state, action) => {
      state.groups = [];
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(GetKidMedicalConditions.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidMedicalConditions.fulfilled, (state, action) => {
      state.medicalConditions = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKidMedicalConditions.rejected, (state, action) => {
      state.medicalConditions = [];
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(GetKid.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKid.fulfilled, (state, action) => {
      state.current = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKid.rejected, (state, action) => {
      state.current = undefined;
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(CreateKid.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(CreateKid.fulfilled, (state) => {
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(CreateKid.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(UpdateKid.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(
      UpdateKid.fulfilled,
      (state, action: PayloadAction<IKid>) => {
        state.current = {
          ...state.current,
          ...action.payload,
        };
        state.error = undefined;
        state.loading = false;
      },
    );
    builder.addCase(UpdateKid.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { loadingKidEnable, loadingKidDisable, updateCurrentKid } =
  kidSlice.actions;
export default kidSlice.reducer;
