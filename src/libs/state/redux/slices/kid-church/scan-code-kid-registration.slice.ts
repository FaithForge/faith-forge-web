import { IKid, IKidGuardian } from '@/libs/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScanCodeKidRegistration } from '../../thunks/kid-church/kid-registration.thunk';

export interface IScanCodeKidRelation extends Partial<IKid> {
  kid?: IKid;
}

export interface ScanQRKidGuardianResponse {
  kidGuardian?: IKidGuardian;
  relations?: IScanCodeKidRelation[];
}

export interface ScanQRKidGuardianState {
  kidGuardian?: IKidGuardian;
  relations: IScanCodeKidRelation[];
  loading: boolean;
  error?: string;
}

const initialState: ScanQRKidGuardianState = {
  kidGuardian: undefined,
  relations: [],
  loading: false,
  error: undefined,
};

const scanQRKidGuardianSlice = createSlice({
  name: 'scanQRKidRegistration',
  initialState,
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
    builder.addCase(
      ScanCodeKidRegistration.fulfilled,
      (state, action: PayloadAction<ScanQRKidGuardianResponse | undefined>) => {
        const payload = action.payload;
        if (payload) {
          state.kidGuardian = payload.kidGuardian;
          state.relations = payload.relations || [];
          state.error = undefined;
          state.loading = false;
        }
      },
    );
    builder.addCase(ScanCodeKidRegistration.rejected, (state) => {
      state.error = 'Error en el Código QR. No existe en la base de datos';
      state.loading = false;
    });
  },
});

export const { cleanScanQRSearch } = scanQRKidGuardianSlice.actions;
export default scanQRKidGuardianSlice.reducer;
