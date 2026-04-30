import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UserPlan = "free" | "pro" | "team" | "enterprise";

type UsageSnapshot = {
  generateCount: number;
  exportCount: number;
  uploadCount: number;
};

type UserState = {
  name: string;
  plan: UserPlan;
  documentsGeneratedThisMonth: number;
  usage: UsageSnapshot;
};

const initialState: UserState = {
  name: "Guest",
  plan: "free",
  documentsGeneratedThisMonth: 0,
  usage: {
    generateCount: 0,
    exportCount: 0,
    uploadCount: 0,
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setPlan(state, action: PayloadAction<UserPlan>) {
      state.plan = action.payload;
    },
    incrementDocumentsGenerated(state) {
      state.documentsGeneratedThisMonth += 1;
    },
    setUsageSnapshot(state, action: PayloadAction<UsageSnapshot>) {
      state.usage = action.payload;
    },
  },
});

export const { setUserName, setPlan, incrementDocumentsGenerated, setUsageSnapshot } =
  userSlice.actions;

export default userSlice.reducer;
