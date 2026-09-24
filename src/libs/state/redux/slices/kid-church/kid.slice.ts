import { IKid, IKids } from '@/libs/models';
import { PAGINATION_REGISTRATION_LIMIT } from '@/libs/common-types/constants';
import { PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';
import {
  GetKids,
  GetMoreKids,
} from '../../thunks/kid-church/kid.thunk';
import { kidChurchApi } from '../../api/kidChurchApi';

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
    builder.addMatcher(
      isAnyOf(
        kidChurchApi.endpoints.createKid.matchFulfilled,
        kidChurchApi.endpoints.updateKid.matchFulfilled,
        kidChurchApi.endpoints.deleteKid.matchFulfilled,
        kidChurchApi.endpoints.createKidRegistration.matchFulfilled,
        kidChurchApi.endpoints.deleteKidRegistration.matchFulfilled,
      ),
      (state) => {
        state.needsRefresh = true;
      },
    );
    builder.addMatcher(
      kidChurchApi.endpoints.deleteKidGuardianRelation.matchFulfilled,
      (state, action) => {
        if (state.current?.relations) {
          const guardianId = action.meta.arg.originalArgs.guardianId;
          state.current.relations = state.current.relations.filter(
            (rel) => rel.id !== guardianId,
          );
        }
        state.needsRefresh = true;
      },
    );

  },
});

export const { loadingKidEnable, loadingKidDisable, updateCurrentKid, markKidsNeedsRefresh, resetKidsNeedsRefresh } = kidSlice.actions;
export default kidSlice.reducer;
