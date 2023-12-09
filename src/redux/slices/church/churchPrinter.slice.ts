import { IChurchPrinters } from '@/models/Church';
import { GetChurchPrinters } from '@/redux/thunks/church/church.thunk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
        (churchPrinter) => churchPrinter.id === action.payload,
      );
    },
  },
  extraReducers(builder) {
    builder.addCase(GetChurchPrinters.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetChurchPrinters.fulfilled, (state, action) => {
      state.current = action.payload;
      state.error = initialState.error;
      state.loading = false;
    });
    builder.addCase(GetChurchPrinters.rejected, (state, action) => {
      state.current = initialState.current;
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

export const { updateCurrentChurchPrinter } = churchPrinterSlice.actions;
export default churchPrinterSlice.reducer;
