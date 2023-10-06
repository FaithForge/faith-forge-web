import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../models/Uset';

const initialState: IUser = {
  firstName: undefined,
  lastName: undefined,
  churchGroup: undefined,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.churchGroup = action.payload.churchGroup;
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
