import { IKidMedicalConditions } from '@/libs/models';
import { createSlice } from '@reduxjs/toolkit';
import { GetKidMedicalConditions } from '../../thunks/kid-church/kid-medical-condition.thunk';

const initialState: IKidMedicalConditions = {
  data: [],
  current: undefined,
  error: undefined,
  loading: false,
};

const kidMedicalConditionSlice = createSlice({
  name: 'kidMedicalCondition',
  initialState: initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(GetKidMedicalConditions.pending, (state) => {
      state.error = undefined;
      state.loading = true;
    });
    builder.addCase(GetKidMedicalConditions.fulfilled, (state, action) => {
      state.data = action.payload;
      state.error = initialState.error;
      state.loading = false;
    });
    builder.addCase(GetKidMedicalConditions.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
    });
  },
});

// export const {} = kidMedicalConditionSlice.actions;
export default kidMedicalConditionSlice.reducer;
