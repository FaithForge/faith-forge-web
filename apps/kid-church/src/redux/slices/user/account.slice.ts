import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { IAccount } from '../../../models/KidChurch';

const initialState: IAccount = {
  churchGroup: undefined,
  error: undefined,
  loading: false,
};

const accountSlice = createSlice({
  name: 'account',
  initialState: initialState,
  reducers: {
    updateUserChurchGroup: (state, action: PayloadAction<string>) => {
      state.churchGroup = action.payload;
    },
  },
});

export const { updateUserChurchGroup } = accountSlice.actions;
export default accountSlice.reducer;
