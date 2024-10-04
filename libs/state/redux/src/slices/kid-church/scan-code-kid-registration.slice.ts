/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from '@reduxjs/toolkit';
import { ScanCodeKidRegistration } from '../../thunks/kid-church/kid-registration.thunk';

const initialState: {
  kidGuardian: any;
  relations: any[];
  loading: boolean;
  error?: string;
} = {
  kidGuardian: undefined,
  relations: [],
  loading: false,
  error: undefined,
};

const scanQRKidGuardianSlice = createSlice({
  name: 'scanQRKidRegistration',
  initialState: initialState,
  reducers: {
    cleanScanQRSearch: (state) => {
      state.kidGuardian = undefined;
      state.relations = [];
      state.loading = false;
      state.error = undefined;
    },
  },
  extraReducers(builder) {
    builder.addCase(ScanCodeKidRegistration.pending, (state) => {
      state.kidGuardian = undefined;
      state.relations = [];
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(ScanCodeKidRegistration.fulfilled, (state, action) => {
      const payload = action.payload;
      if (payload) {
        state.kidGuardian = payload.kidGuardian;
        state.relations = payload.relations;
        state.error = undefined;
        state.loading = false;
      }
    });
    builder.addCase(ScanCodeKidRegistration.rejected, (state) => {
      state.error = 'Error en el Codigo QR. No existe en la base de datos';
      state.loading = false;
    });
  },
});

export const { cleanScanQRSearch } = scanQRKidGuardianSlice.actions;
export default scanQRKidGuardianSlice.reducer;
