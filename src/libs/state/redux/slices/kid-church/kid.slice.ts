import { IApiErrorResponse, IKid, IKids, IUpdateKid } from '@/libs/models';
import { PAGINATION_REGISTRATION_LIMIT } from '@/libs/common-types/constants';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  CreateKid,
  DeleteKid,
  GetKid,
  GetKids,
  GetMoreKids,
  UpdateKid,
} from '../../thunks/kid-church/kid.thunk';
import {
  CreateKidRegistration,
  RemoveKidRegistration,
} from '../../thunks/kid-church/kid-registration.thunk';
import { DeleteKidGuardianRelation } from '../../thunks/kid-church/kid-guardian.thunk';

const initialState: IKids = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
  currentPage: 1,
  totalPages: 0,
  needsRefresh: false,
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
    markKidsNeedsRefresh: (state) => {
      state.needsRefresh = true;
    },
    resetKidsNeedsRefresh: (state) => {
      state.needsRefresh = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetKids.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(GetKids.fulfilled, (state, action) => {
      const items = action.payload.data || [];
      state.data = items;
      state.error = undefined;
      state.loading = false;
      state.currentPage = action.payload.currentPage || 1;
      // If returned items are fewer than page limit, we reached the end
      if (items.length < PAGINATION_REGISTRATION_LIMIT) {
        state.totalPages = state.currentPage;
      } else {
        state.totalPages = action.payload.totalPages || state.currentPage;
      }
      state.needsRefresh = false;
    });
    builder.addCase(GetKids.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
      state.currentPage = initialState.currentPage;
      state.totalPages = initialState.totalPages;
    });
    builder.addCase(GetMoreKids.pending, (state) => {
      state.loading = false;
    });
    builder.addCase(GetMoreKids.fulfilled, (state, action) => {
      const newItems = action.payload.data || [];
      state.data = Array.from(state.data).concat(newItems);
      state.loading = false;
      state.currentPage = state.currentPage + 1;
      if (newItems.length < PAGINATION_REGISTRATION_LIMIT) {
        state.totalPages = state.currentPage;
      } else {
        state.totalPages = action.payload.totalPages || state.currentPage;
      }
    });
    builder.addCase(GetMoreKids.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
      // Prevent infinite loops on failure
      state.totalPages = state.currentPage;
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
      state.needsRefresh = true;
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
    builder.addCase(UpdateKid.fulfilled, (state, action: PayloadAction<IUpdateKid>) => {
      state.current = {
        ...state.current,
        ...action.payload,
      };
      state.error = undefined;
      state.loading = false;
      state.needsRefresh = true;
    });
    builder.addCase(UpdateKid.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(DeleteKid.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(DeleteKid.fulfilled, (state) => {
      state.error = undefined;
      state.loading = false;
      state.needsRefresh = true;
    });
    builder.addCase(DeleteKid.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(CreateKidRegistration.fulfilled, (state) => {
      state.needsRefresh = true;
    });
    builder.addCase(RemoveKidRegistration.fulfilled, (state) => {
      state.needsRefresh = true;
    });
    builder.addCase(DeleteKidGuardianRelation.fulfilled, (state, action) => {
      if (state.current?.relations) {
        state.current.relations = state.current.relations.filter(
          (rel: any) => (rel?.guardian?.id || rel?.guardianId || rel?.id) !== action.meta.arg.guardianId,
        );
      }
      state.needsRefresh = true;
    });
  },
});

export const { loadingKidEnable, loadingKidDisable, updateCurrentKid, markKidsNeedsRefresh, resetKidsNeedsRefresh } = kidSlice.actions;
export default kidSlice.reducer;
