import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ExportFormat = "pdf" | "docx" | "pptx";

type ExportState = {
  isExporting: boolean;
  lastFormat?: ExportFormat;
  error?: string;
};

const initialState: ExportState = {
  isExporting: false,
};

const exportSlice = createSlice({
  name: "export",
  initialState,
  reducers: {
    startExport(state) {
      state.isExporting = true;
      state.error = undefined;
    },
    setExportSuccess(state, action: PayloadAction<ExportFormat>) {
      state.lastFormat = action.payload;
      state.isExporting = false;
    },
    setExportError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isExporting = false;
    },
  },
});

export const { startExport, setExportSuccess, setExportError } =
  exportSlice.actions;

export default exportSlice.reducer;
