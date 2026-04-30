export const documentTones = ["professional", "academic", "startup"] as const;
export type DocumentTone = (typeof documentTones)[number];

export const documentTypes = [
  "proposal",
  "research-paper",
  "resume-cv",
  "meeting-notes",
  "marketing-plan",
  "contract-letter",
  "report",
  "presentation",
] as const;
export type DocumentType = (typeof documentTypes)[number];

export const themePresets = ["corporate", "academic", "startup"] as const;
export type ThemePreset = (typeof themePresets)[number];

export const pageSizes = ["a4", "letter", "a3"] as const;
export type PageSize = (typeof pageSizes)[number];

export const pageNumberPositions = ["footer"] as const;
export type PageNumberPosition = (typeof pageNumberPositions)[number];

export type DocumentTable = {
  columns: string[];
  rows: string[][];
};

export type DocumentChart = {
  type: "bar" | "line" | "pie";
  title: string;
  labels: string[];
  values: number[];
};

export type DocumentImage = {
  url: string;
  alt?: string;
  caption?: string;
  widthPct?: number;
};

export type DocumentSection = {
  title: string;
  body: string;
  bullets?: string[];
  table?: DocumentTable;
  chart?: DocumentChart;
  latex?: string;
  images?: DocumentImage[];
};

export type StyleTokens = {
  theme: ThemePreset;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  headingSize: number;
  bodySize: number;
  lineHeight: number;
  contentWidth: "narrow" | "normal" | "wide";
  includeCoverPage: boolean;
  includeToc: boolean;
  showRunningHeader: boolean;
  showRunningFooter: boolean;
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  pageNumberPosition: PageNumberPosition;
  pageSize: PageSize;
  headingFontWeight: number;
  bodyFontWeight: number;
  bodyColor: string;
  /** Empty string: use accentColor for headings in preview/export chrome. */
  headingColor: string;
};

export type OrchestratorInput = {
  prompt: string;
  tone: DocumentTone;
  docType?: DocumentType;
};

export type OrchestratedDocument = {
  title: string;
  prompt: string;
  normalizedPrompt: string;
  humanizedPrompt: string;
  docType: DocumentType;
  tone: DocumentTone;
  sections: DocumentSection[];
  summary: string;
  styleTokens: StyleTokens;
  assets: string[];
  generatedAt: string;
};
