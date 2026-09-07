import { ChurchPrinterStateEnum, IChurchPrinter, IChurchPrinters } from '@/libs/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetChurchPrinters, GetChurchPrintersAdmin } from '../../thunks/church/church.thunk';

export interface ChurchPrinterSliceState extends IChurchPrinters {
  loadedCampusId?: string;
  printersByCampus: Record<string, IChurchPrinter[]>;
  adminPrintersByCampus: Record<string, IChurchPrinter[]>;
}

const initialState: ChurchPrinterSliceState = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
  loadedCampusId: undefined,
  printersByCampus: {},
  adminPrintersByCampus: {},
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
      state.adminPrintersByCampus = {};
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchPrinters.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchPrinters.fulfilled, (state, action) => {
      const incoming: IChurchPrinter[] = action.payload || [];
      const campusId =
        typeof action.meta.arg === 'string'
          ? action.meta.arg
          : action.meta.arg?.churchCampusId;

      if (!state.printersByCampus) {
        state.printersByCampus = {};
      }
      // Ensure only ACTIVE printers are stored in operational cache
      const activeIncoming = incoming.filter(
        (p) => p.state === ChurchPrinterStateEnum.ACTIVE,
      );
      if (campusId) {
        state.printersByCampus[campusId] = activeIncoming;
      }

      state.data = activeIncoming;
      state.error = initialState.error;
      state.loading = false;
      state.loadedCampusId = campusId;

      if (!state.current && activeIncoming.length > 0) {
        state.current = activeIncoming[0];
      } else if (state.current) {
        const match = activeIncoming.find((p: any) => p.id === state.current?.id);
        if (match) {
          state.current = match;
        } else if (activeIncoming.length === 1) {
          state.current = activeIncoming[0];
        } else {
          state.current = undefined;
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
    builder.addCase(GetChurchPrintersAdmin.fulfilled, (state, action) => {
      const { churchCampusId, printers } = action.payload;
      if (!state.adminPrintersByCampus) {
        state.adminPrintersByCampus = {};
      }
      state.adminPrintersByCampus[churchCampusId] = printers;

      // Invalidate operational cache for this campus if admin data was fetched/updated
      if (state.printersByCampus?.[churchCampusId]) {
        state.printersByCampus[churchCampusId] = (printers as IChurchPrinter[]).filter(
          (p) => p.state === ChurchPrinterStateEnum.ACTIVE,
        );
      }

      // If current selected printer became inactive or deleted, deselect it
      if (state.current) {
        const currentInAdmin = (printers as IChurchPrinter[]).find(
          (p) => p.id === state.current?.id,
        );
        if (
          currentInAdmin &&
          currentInAdmin.state !== ChurchPrinterStateEnum.ACTIVE
        ) {
          state.current = undefined;
        }
      }
    });
  },

});

export const { updateCurrentChurchPrinter, resetChurchPrinterState } =
  churchPrinterSlice.actions;
export default churchPrinterSlice.reducer;
