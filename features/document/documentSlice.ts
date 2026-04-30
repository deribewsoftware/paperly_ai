import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { DocumentImage, DocumentType, StyleTokens } from "@/lib/contracts/document";
import { DEFAULT_STYLE_TOKENS, normalizeStyleTokens } from "@/lib/styleTokensNormalize";

export type DocumentSection = {
  title: string;
  body: string;
  bullets?: string[];
  latex?: string;
  images?: DocumentImage[];
  table?: {
    columns: string[];
    rows: string[][];
  };
  chart?: {
    type: "bar" | "line" | "pie";
    title: string;
    labels: string[];
    values: number[];
  };
};

type DocumentState = {
  documentId?: string;
  prompt: string;
  liveDocHtml: string;
  title: string;
  docType: DocumentType;
  tone: "professional" | "academic" | "startup";
  isGenerating: boolean;
  sections: DocumentSection[];
  summary?: string;
  styleTokens: StyleTokens;
  lastGeneratedAt?: string;
  error?: string;
};

const initialState: DocumentState = {
  prompt: "",
  liveDocHtml:
    "<h1>Untitled Paperly Document</h1><p data-summary=\"true\">Generate with AI to start editing here.</p>",
  title: "Untitled Paperly Document",
  docType: "proposal",
  tone: "professional",
  isGenerating: false,
  sections: [],
  styleTokens: { ...DEFAULT_STYLE_TOKENS },
};

const documentSlice = createSlice({
  name: "document",
  initialState,
  reducers: {
    setPrompt(state, action: PayloadAction<string>) {
      state.prompt = action.payload;
    },
    setTone(state, action: PayloadAction<DocumentState["tone"]>) {
      state.tone = action.payload;
    },
    setDocType(state, action: PayloadAction<DocumentType>) {
      state.docType = action.payload;
    },
    startGeneration(state) {
      state.isGenerating = true;
      state.error = undefined;
    },
    setGeneratedDocument(
      state,
      action: PayloadAction<{
        documentId?: string;
        liveDocHtml?: string;
        title: string;
        docType: DocumentType;
        sections: DocumentSection[];
        summary?: string;
        styleTokens?: StyleTokens;
      }>
    ) {
      state.documentId = action.payload.documentId;
      state.title = action.payload.title;
      state.docType = action.payload.docType;
      state.sections = action.payload.sections;
      state.summary = action.payload.summary;
      state.styleTokens = normalizeStyleTokens({
        ...state.styleTokens,
        ...action.payload.styleTokens,
      });
      state.liveDocHtml = action.payload.liveDocHtml ?? state.liveDocHtml;
      state.lastGeneratedAt = new Date().toISOString();
      state.isGenerating = false;
    },
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
    },
    setLiveDocHtml(state, action: PayloadAction<string>) {
      state.liveDocHtml = action.payload;
    },
    setDocumentId(state, action: PayloadAction<string | undefined>) {
      state.documentId = action.payload;
    },
    setSummary(state, action: PayloadAction<string>) {
      state.summary = action.payload;
    },
    setStyleTokens(state, action: PayloadAction<StyleTokens>) {
      state.styleTokens = normalizeStyleTokens(action.payload);
    },
    patchStyleTokens(state, action: PayloadAction<Partial<StyleTokens>>) {
      state.styleTokens = normalizeStyleTokens({
        ...state.styleTokens,
        ...action.payload,
      });
    },
    addSection(state) {
      state.sections.push({
        title: "New Section",
        body: "",
        bullets: [],
        images: [],
      });
    },
    removeSection(state, action: PayloadAction<number>) {
      state.sections = state.sections.filter((_, index) => index !== action.payload);
    },
    moveSection(
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) {
      const { fromIndex, toIndex } = action.payload;
      if (
        fromIndex < 0 ||
        fromIndex >= state.sections.length ||
        toIndex < 0 ||
        toIndex >= state.sections.length
      ) {
        return;
      }
      const [item] = state.sections.splice(fromIndex, 1);
      state.sections.splice(toIndex, 0, item);
    },
    updateSection(
      state,
      action: PayloadAction<{
        index: number;
        section: Partial<DocumentSection>;
      }>
    ) {
      const current = state.sections[action.payload.index];
      if (!current) {
        return;
      }
      state.sections[action.payload.index] = {
        ...current,
        ...action.payload.section,
      };
    },
    applyLiveDraft(
      state,
      action: PayloadAction<{
        title: string;
        summary?: string;
        sections: DocumentSection[];
      }>
    ) {
      state.title = action.payload.title;
      state.summary = action.payload.summary;
      state.sections = action.payload.sections;
    },
    addSectionImage(
      state,
      action: PayloadAction<{ index: number; image: DocumentImage }>
    ) {
      const section = state.sections[action.payload.index];
      if (!section) {
        return;
      }
      section.images = [...(section.images ?? []), action.payload.image];
    },
    removeSectionImage(
      state,
      action: PayloadAction<{ index: number; imageIndex: number }>
    ) {
      const section = state.sections[action.payload.index];
      if (!section?.images) {
        return;
      }
      section.images = section.images.filter(
        (_, imageIndex) => imageIndex !== action.payload.imageIndex
      );
    },
    setGenerationError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isGenerating = false;
    },
    setStreamPartialDocument(
      state,
      action: PayloadAction<{
        title: string;
        sections: DocumentSection[];
        summary?: string;
        liveDocHtml: string;
        docType?: DocumentType;
        styleTokens?: StyleTokens;
      }>
    ) {
      state.title = action.payload.title;
      state.sections = action.payload.sections;
      state.liveDocHtml = action.payload.liveDocHtml;
      if (action.payload.summary !== undefined) {
        state.summary = action.payload.summary;
      }
      if (action.payload.docType !== undefined) {
        state.docType = action.payload.docType;
      }
      if (action.payload.styleTokens !== undefined) {
        state.styleTokens = normalizeStyleTokens({
          ...state.styleTokens,
          ...action.payload.styleTokens,
        });
      }
    },
    appendContinuedDocument(
      state,
      action: PayloadAction<{
        sections: DocumentSection[];
        liveDocHtml: string;
      }>
    ) {
      state.sections = action.payload.sections;
      state.liveDocHtml = action.payload.liveDocHtml;
      state.isGenerating = false;
      state.error = undefined;
    },
    clearDocument(state) {
      state.sections = [];
      state.error = undefined;
      state.lastGeneratedAt = undefined;
      state.summary = undefined;
      state.documentId = undefined;
      state.liveDocHtml =
        "<h1>Untitled Paperly Document</h1><p data-summary=\"true\">Generate with AI to start editing here.</p>";
    },
    loadStoredDocument(
      state,
      action: PayloadAction<{
        documentId: string;
        prompt: string;
        title: string;
        docType: DocumentType;
        tone: DocumentState["tone"];
        sections: DocumentSection[];
        liveDocHtml: string;
        summary?: string;
        styleTokens: StyleTokens;
      }>
    ) {
      state.documentId = action.payload.documentId;
      state.prompt = action.payload.prompt;
      state.title = action.payload.title;
      state.docType = action.payload.docType;
      state.tone = action.payload.tone;
      state.sections = action.payload.sections;
      state.summary = action.payload.summary;
      state.styleTokens = normalizeStyleTokens({
        ...state.styleTokens,
        ...action.payload.styleTokens,
      });
      state.liveDocHtml = action.payload.liveDocHtml;
      state.isGenerating = false;
      state.error = undefined;
      state.lastGeneratedAt = new Date().toISOString();
    },
  },
});

export const {
  setPrompt,
  setTone,
  setDocType,
  startGeneration,
  setGeneratedDocument,
  setTitle,
  setLiveDocHtml,
  setDocumentId,
  setSummary,
  setStyleTokens,
  patchStyleTokens,
  addSection,
  removeSection,
  moveSection,
  updateSection,
  applyLiveDraft,
  addSectionImage,
  appendContinuedDocument,
  setStreamPartialDocument,
  removeSectionImage,
  setGenerationError,
  clearDocument,
  loadStoredDocument,
} = documentSlice.actions;

export default documentSlice.reducer;
