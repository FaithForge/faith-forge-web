import { IUsers } from '@/models/KidChurch';
import { IUser } from '@/models/User';
import { GetMoreUsers, GetUsers } from '@/redux/thunks/user/user.thunk';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState: IUsers = {
  data: [],
  current: undefined,
  loading: false,
  currentPage: 1,
  totalPages: 0,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialState,
  reducers: {
    loadingUserEnable: (state) => {
      state.loading = true;
    },
    loadingUserDisable: (state) => {
      state.loading = true;
    },
    updateCurrentUser: (state, action: PayloadAction<IUser>) => {
      state.current = action.payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(GetUsers.pending, (state) => {
      state.data = [];
      state.loading = true;
    });
    builder.addCase(GetUsers.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.error = undefined;
      state.loading = false;
      state.currentPage = action.payload.currentPage;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(GetUsers.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
      state.currentPage = initialState.currentPage;
      state.totalPages = initialState.totalPages;
    });
    builder.addCase(GetMoreUsers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(GetMoreUsers.fulfilled, (state, action) => {
      state.data = Array.from(state.data).concat(action.payload.data);
      state.loading = false;
      state.currentPage = state.currentPage + 1;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(GetMoreUsers.rejected, (state, action) => {
      state.data = [];
      state.error = action.error.message;
      state.loading = false;
      state.currentPage = initialState.currentPage;
      state.totalPages = initialState.totalPages;
    });
    // builder.addCase(GetKid.pending, (state) => {
    //   state.loading = true;
    // });
    // builder.addCase(GetKid.fulfilled, (state, action) => {
    //   state.current = action.payload;
    //   state.error = undefined;
    //   state.loading = false;
    // });
    // builder.addCase(GetKid.rejected, (state, action) => {
    //   state.current = undefined;
    //   state.error = action.error.message;
    //   state.loading = false;
    // });
    // builder.addCase(CreateKid.pending, (state) => {
    //   state.error = undefined;
    //   state.current = undefined;
    //   state.loading = true;
    // });
    // builder.addCase(CreateKid.fulfilled, (state, action) => {
    //   state.current = action.payload;
    //   state.error = undefined;
    //   state.loading = false;
    // });
    // builder.addCase(CreateKid.rejected, (state, action) => {
    //   const apiError = action.payload as IApiErrorResponse;
    //   state.current = undefined;
    //   state.error = apiError.error.message;
    //   state.loading = false;
    // });
    // builder.addCase(UpdateKid.pending, (state) => {
    //   state.loading = true;
    // });
    // builder.addCase(
    //   UpdateKid.fulfilled,
    //   (state, action: PayloadAction<IUpdateKid>) => {
    //     state.current = {
    //       ...state.current,
    //       ...action.payload,
    //     };
    //     state.error = undefined;
    //     state.loading = false;
    //   },
    // );
    // builder.addCase(UpdateKid.rejected, (state, action) => {
    //   state.error = action.error.message;
    //   state.loading = false;
    // });
  },
});

export const { loadingUserEnable, loadingUserDisable, updateCurrentUser } =
  userSlice.actions;
export default userSlice.reducer;
