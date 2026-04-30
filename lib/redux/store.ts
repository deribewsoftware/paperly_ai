import { configureStore } from "@reduxjs/toolkit";

import documentReducer from "@/features/document/documentSlice";
import exportReducer from "@/features/export/exportSlice";
import userReducer from "@/features/user/userSlice";

export const store = configureStore({
  reducer: {
    document: documentReducer,
    export: exportReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
