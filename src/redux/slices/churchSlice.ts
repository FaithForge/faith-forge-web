import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IChurches } from '../../models/Church';
import { GetChurches, GetPrinters } from '../../services/churchService';

const initialState: IChurches = {
  data: [],
  current: {
    id: 'cdb65506-933f-4328-9690-131837db76da',
    name: 'Sede Principal',
  },
  printers: [],
  currentPrinter: undefined,
  error: undefined,
  loading: false,
};

const churchSlice = createSlice({
  name: 'church',
  initialState: initialState,
  reducers: {
    updateCurrentChurch: (state, action: PayloadAction<string>) => {
      state.current =
        state.data.find((church) => church.id === action.payload) ??
        state.current;
    },
    updateCurrentPrinter: (state, action: PayloadAction<string>) => {
      state.currentPrinter = state.printers.find(
        (printer) => printer.id === action.payload,
      );
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurches.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurches.fulfilled, (state, action) => {
      state.data = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetChurches.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
    });
    builder.addCase(GetPrinters.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetPrinters.fulfilled, (state, action) => {
      state.printers = action.payload;
      state.error = undefined;
      state.loading = false;
    });
    builder.addCase(GetPrinters.rejected, (state, action) => {
      state.printers = [];
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurch, updateCurrentPrinter } =
  churchSlice.actions;
export default churchSlice.reducer;
