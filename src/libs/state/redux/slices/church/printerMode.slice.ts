import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PrinterModeType = 'NETWORK' | 'BLUETOOTH';

export interface IPrinterModeState {
  mode: PrinterModeType;
  bluetoothDevice: {
    name: string | null;
    isConnected: boolean;
    error: string | null;
  };
}

const initialState: IPrinterModeState = {
  mode: 'NETWORK',
  bluetoothDevice: {
    name: null,
    isConnected: false,
    error: null,
  },
};

const printerModeSlice = createSlice({
  name: 'printerMode',
  initialState,
  reducers: {
    setPrinterMode: (state, action: PayloadAction<PrinterModeType>) => {
      state.mode = action.payload;
    },
    setBluetoothStatus: (
      state,
      action: PayloadAction<{
        name: string | null;
        isConnected: boolean;
        error?: string | null;
      }>,
    ) => {
      state.bluetoothDevice.name = action.payload.name;
      state.bluetoothDevice.isConnected = action.payload.isConnected;
      state.bluetoothDevice.error = action.payload.error || null;
    },
    resetPrinterMode: (state) => {
      state.mode = 'NETWORK';
      state.bluetoothDevice = {
        name: null,
        isConnected: false,
        error: null,
      };
    },
  },
});

export const { setPrinterMode, setBluetoothStatus, resetPrinterMode } =
  printerModeSlice.actions;
export default printerModeSlice.reducer;
