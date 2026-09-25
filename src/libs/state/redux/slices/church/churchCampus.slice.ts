import { IChurch, IChurchCampus, IChurchCampuses } from '@/libs/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetChurchById, GetChurchCampuses, UpdateChurch } from '../../thunks/church/church.thunk';

const initialState: IChurchCampuses = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const churchCampusSlice = createSlice({
  name: 'churchCampus',
  initialState: initialState,
  reducers: {
    updateCurrentChurchCampus: (state, action: PayloadAction<string>) => {
      state.current =
        state.data.find(
          (churchCampus: IChurchCampus) => churchCampus.id === action.payload,
        ) ?? state.current;
    },
    updateChurchTerminology: (state, action: PayloadAction<Record<string, string>>) => {
      state.churchTerminologyOverrides = {
        ...state.churchTerminologyOverrides,
        ...action.payload,
      };
      if (state.church) {
        state.church.terminologyOverrides = state.churchTerminologyOverrides;
      }
    },
    setChurch: (state, action: PayloadAction<IChurch>) => {
      state.church = action.payload;
      state.churchTerminologyOverrides = action.payload.terminologyOverrides || {};
      state.ministryTerminologyOverrides = action.payload.ministryTerminologyOverrides || {};
    },
    resetChurchCampusState: (state) => {
      state.data = initialState.data;
      state.current = initialState.current;
      state.church = undefined;
      state.churchTerminologyOverrides = undefined;
      state.ministryTerminologyOverrides = undefined;
      state.error = initialState.error;
      state.loading = initialState.loading;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchCampuses.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchCampuses.fulfilled, (state, action) => {
      const rawCampuses = action.payload || [];
      state.data = [...rawCampuses].sort((a, b) => {
        const posA = a.position ?? 0;
        const posB = b.position ?? 0;
        if (posA !== posB) return posA - posB;
        return (a.name || '').localeCompare(b.name || '');
      });
      state.error = initialState.error;
      state.loading = false;

      if (state.current) {
        const freshMatch = state.data.find(
          (c: IChurchCampus) => c.id === state.current?.id,
        );
        state.current = freshMatch ?? (state.data[0] ?? undefined);
      } else if (state.data.length > 0) {
        state.current = state.data[0];
      }
    });
    builder.addCase('auth/logout', (state) => {
      state.current = undefined;
    });

    builder.addCase(UpdateChurch.fulfilled, (state, action) => {
      if (action.payload) {
        state.church = action.payload;
        state.churchTerminologyOverrides = action.payload.terminologyOverrides || {};
        state.ministryTerminologyOverrides = action.payload.ministryTerminologyOverrides || {};
      }
    });

    builder.addCase(GetChurchById.fulfilled, (state, action) => {
      if (action.payload) {
        state.church = action.payload;
        state.churchTerminologyOverrides = action.payload.terminologyOverrides || {};
        state.ministryTerminologyOverrides = action.payload.ministryTerminologyOverrides || {};
      }
    });

    builder.addCase(GetChurchCampuses.rejected, (state, action) => {
      state.data = initialState.data;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const {
  updateCurrentChurchCampus,
  updateChurchTerminology,
  setChurch,
  resetChurchCampusState,
} = churchCampusSlice.actions;
export default churchCampusSlice.reducer;
