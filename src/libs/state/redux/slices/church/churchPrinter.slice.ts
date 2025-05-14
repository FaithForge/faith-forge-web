import { IChurchPrinters } from '@/libs/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetChurchPrinters } from '../../thunks/church/church.thunk';

const initialState: IChurchPrinters = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const churchPrinterSlice = createSlice({
  name: 'churchPrinter',
  initialState: initialState,
  reducers: {
    updateCurrentChurchPrinter: (state, action: PayloadAction<string>) => {
      state.current = state.data.find(
        (churchPrinter: any) => churchPrinter.id === action.payload,
      );
    },
    resetChurchPrinterState: (state) => {
      state.data = initialState.data;
      state.current = initialState.current;
      state.error = initialState.error;
      state.loading = initialState.loading;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchPrinters.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchPrinters.fulfilled, (state, action) => {
      state.data = action.payload;
      state.error = initialState.error;
      state.loading = false;
    });
    builder.addCase(GetChurchPrinters.rejected, (state, action) => {
      state.data = initialState.data;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurchPrinter, resetChurchPrinterState } =
  churchPrinterSlice.actions;
export default churchPrinterSlice.reducer;
