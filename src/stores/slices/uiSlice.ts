import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DateRange, DateRangePreset, Role, UserRole } from "@/types";
import { subDays, startOfDay, endOfDay } from "date-fns";

interface UiState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  selectedBranchId: string | null;
  dateRange: DateRange;
  dateRangePreset: DateRangePreset;
  currentRole: Role | null;
  assignedBranchId: string | null;
  devMode: boolean;
}

const getDefaultDateRange = (preset: DateRangePreset): DateRange => {
  const today = new Date();
  switch (preset) {
    case "today":
    case "24h":
      return { from: startOfDay(today), to: endOfDay(today) };
    case "30d":
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    case "12m":
      return { from: startOfDay(subDays(today, 365)), to: endOfDay(today) };
    case "7d":
    default:
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
  }
};

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  selectedBranchId: null,
  dateRange: getDefaultDateRange("7d"),
  dateRangePreset: "7d",
  currentRole: null,
  assignedBranchId: null,
  devMode: true,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setMobileMenuOpen(state, action: PayloadAction<boolean>) {
      state.mobileMenuOpen = action.payload;
    },
    setSelectedBranchId(state, action: PayloadAction<string | null>) {
      state.selectedBranchId = action.payload;
    },
    setDateRange(state, action: PayloadAction<DateRange>) {
      state.dateRange = action.payload;
      state.dateRangePreset = "custom";
    },
    setDateRangePreset(state, action: PayloadAction<DateRangePreset>) {
      state.dateRangePreset = action.payload;
      if (action.payload !== "custom") {
        state.dateRange = getDefaultDateRange(action.payload);
      }
    },
    setRole(state, action: PayloadAction<Role | null>) {
      state.currentRole = action.payload;
    },
    setAssignedBranchId(state, action: PayloadAction<string | null>) {
      state.assignedBranchId = action.payload;
    },
    setDevMode(state, action: PayloadAction<boolean>) {
      state.devMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("auth/setAuthSuccess", (state, action: any) => {
        state.currentRole = action.payload.user.role;
      })
      .addCase("auth/logout", (state) => {
        state.currentRole = null;
      });
  },
});

export const {
  setSidebarCollapsed,
  setMobileMenuOpen,
  setSelectedBranchId,
  setDateRange,
  setDateRangePreset,
  setRole,
  setAssignedBranchId,
  setDevMode,
} = uiSlice.actions;

export default uiSlice.reducer;
