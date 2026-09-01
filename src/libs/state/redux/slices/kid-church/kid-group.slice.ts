import { createSlice } from '@reduxjs/toolkit';
import { GetKidGroups } from '../../thunks/kid-church/kid-group.thunk';
import { IKidGroups } from '@/libs/models';

const initialState: IKidGroups = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const kidGroupSlice = createSlice({
  name: 'kidGroup',
  initialState: initialState,
  reducers: {
    resetKidGroupState: (state) => {
      state.data = [];
      state.current = undefined;
      state.error = undefined;
      state.loading = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetKidGroups.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidGroups.fulfilled, (state, action) => {
      const incoming = action.payload || [];
      if (action.meta.arg?.type) {
        // Merge only when specifically requesting a sub-type (e.g. SPECIAL)
        if (!state.data || state.data.length === 0) {
          state.data = incoming;
        } else {
          incoming.forEach((newGroup: any) => {
            const index = state.data.findIndex((g: any) => g.id === newGroup.id);
            if (index >= 0) {
              state.data[index] = newGroup;
            } else {
              state.data.push(newGroup);
            }
          });
        }
      } else {
        // Direct assignment to reflect current user RBAC permissions returned by backend
        state.data = incoming;
      }
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetKidGroups.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { resetKidGroupState } = kidGroupSlice.actions;
export default kidGroupSlice.reducer;
