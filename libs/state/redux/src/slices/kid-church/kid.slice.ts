import {
  IApiErrorResponse,
  IKid,
  IKids,
  IUpdateKid,
} from '@faith-forge-web/models';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  CreateKid,
  GetKid,
  GetKids,
  GetMoreKids,
  UpdateKid,
} from '../../thunks/kid-church/kid.thunk';

const initialState: IKids = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
  currentPage: 1,
  totalPages: 0,
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
      state.loading = true;
    });
    builder.addCase(GetKids.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.error = undefined;
      state.loading = false;
      state.currentPage = action.payload.currentPage;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(GetKids.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
      state.currentPage = initialState.currentPage;
      state.totalPages = initialState.totalPages;
    });
    builder.addCase(GetMoreKids.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(GetMoreKids.fulfilled, (state, action) => {
      state.data = Array.from(state.data).concat(action.payload.data);
      state.loading = false;
      state.currentPage = state.currentPage + 1;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(GetMoreKids.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
      state.currentPage = initialState.currentPage;
      state.totalPages = initialState.totalPages;
    });
    builder.addCase(GetKid.pending, (state) => {
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
      state.current = undefined;
      state.loading = true;
    });
    builder.addCase(CreateKid.fulfilled, (state, action) => {
      state.current = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(CreateKid.rejected, (state, action) => {
      const apiError = action.payload as IApiErrorResponse;
      state.current = undefined;
      state.error = apiError.error.message;
      state.loading = false;
    });
    builder.addCase(UpdateKid.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      UpdateKid.fulfilled,
      (state, action: PayloadAction<IUpdateKid>) => {
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
