import { IChurchPrinter, IChurchPrinters } from '@/libs/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetChurchPrinters } from '../../thunks/church/church.thunk';

export interface ChurchPrinterSliceState extends IChurchPrinters {
  loadedCampusId?: string;
  printersByCampus: Record<string, IChurchPrinter[]>;
}

const initialState: ChurchPrinterSliceState = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
  loadedCampusId: undefined,
  printersByCampus: {},
};

const churchPrinterSlice = createSlice({
  name: 'churchPrinter',
  initialState: initialState,
  reducers: {
    updateCurrentChurchPrinter: (state, action: PayloadAction<string>) => {
      let match = state.data.find(
        (churchPrinter: any) => churchPrinter.id === action.payload,
      );
      if (!match && state.printersByCampus) {
        for (const list of Object.values(state.printersByCampus)) {
          match = list.find((p: any) => p.id === action.payload);
          if (match) break;
        }
      }
      if (match) {
        state.current = match;
      }
    },
    resetChurchPrinterState: (state) => {
      state.data = initialState.data;
      state.current = initialState.current;
      state.error = initialState.error;
      state.loading = initialState.loading;
      state.loadedCampusId = undefined;
      state.printersByCampus = {};
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchPrinters.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchPrinters.fulfilled, (state, action) => {
      const incoming = action.payload || [];
      const campusId =
        typeof action.meta.arg === 'string'
          ? action.meta.arg
          : action.meta.arg?.churchCampusId;

      if (!state.printersByCampus) {
        state.printersByCampus = {};
      }
      if (campusId) {
        state.printersByCampus[campusId] = incoming;
      }

      state.data = incoming;
      state.error = initialState.error;
      state.loading = false;
      state.loadedCampusId = campusId;

      if (!state.current && incoming.length > 0) {
        state.current = incoming[0];
      } else if (state.current) {
        const match = incoming.find((p: any) => p.id === state.current?.id);
        if (match) {
          state.current = match;
        } else if (incoming.length === 1) {
          state.current = incoming[0];
        }
      }
    });
    builder.addCase('auth/logout', (state) => {
      state.current = undefined;
      state.loadedCampusId = undefined;
    });

    builder.addCase(GetChurchPrinters.rejected, (state, action) => {
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurchPrinter, resetChurchPrinterState } =
  churchPrinterSlice.actions;
export default churchPrinterSlice.reducer;
