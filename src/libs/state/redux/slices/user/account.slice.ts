import { IAccount } from '@/libs/models';
import { createSlice } from '@reduxjs/toolkit';

const initialState: IAccount = {
  churchGroup: 'Grupo X',
  error: undefined,
  loading: false,
};

const accountSlice = createSlice({
  name: 'account',
  initialState: initialState,
  reducers: {},
});

export default accountSlice.reducer;
