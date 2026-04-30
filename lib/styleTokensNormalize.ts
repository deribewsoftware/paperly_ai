import type { StyleTokens } from "@/lib/contracts/document";

export const DEFAULT_STYLE_TOKENS: StyleTokens = {
  theme: "corporate",
  accentColor: "#0F172A",
  headingFont: "Arial",
  bodyFont: "Calibri",
  headingSize: 30,
  bodySize: 13,
  lineHeight: 1.6,
  contentWidth: "normal",
  includeCoverPage: true,
  includeToc: true,
  showRunningHeader: false,
  showRunningFooter: false,
  headerText: "{title}",
  footerText: "",
  showPageNumbers: true,
  pageNumberPosition: "footer",
  pageSize: "a3",
  headingFontWeight: 600,
  bodyFontWeight: 400,
  bodyColor: "#1e293b",
  headingColor: "",
};

function isPageSize(x: unknown): x is StyleTokens["pageSize"] {
  return x === "a4" || x === "letter" || x === "a3";
}

function isPageNumberPosition(x: unknown): x is StyleTokens["pageNumberPosition"] {
  return x === "footer";
}

function clampWeight(n: unknown, fallback: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) {
    return fallback;
  }
  return Math.min(900, Math.max(100, Math.round(n)));
}

/**
 * Merges persisted / API style token objects with defaults (older docs omit new keys).
 */
export function normalizeStyleTokens(
  raw: Partial<StyleTokens> | Record<string, unknown> | null | undefined
): StyleTokens {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_STYLE_TOKENS };
  }
  const r = raw as Record<string, unknown>;
  return {
    ...DEFAULT_STYLE_TOKENS,
    theme:
      r.theme === "corporate" || r.theme === "academic" || r.theme === "startup" ?
        r.theme
      : DEFAULT_STYLE_TOKENS.theme,
    accentColor: typeof r.accentColor === "string" ? r.accentColor : DEFAULT_STYLE_TOKENS.accentColor,
    headingFont: typeof r.headingFont === "string" ? r.headingFont : DEFAULT_STYLE_TOKENS.headingFont,
    bodyFont: typeof r.bodyFont === "string" ? r.bodyFont : DEFAULT_STYLE_TOKENS.bodyFont,
    headingSize:
      typeof r.headingSize === "number" ? r.headingSize : DEFAULT_STYLE_TOKENS.headingSize,
    bodySize: typeof r.bodySize === "number" ? r.bodySize : DEFAULT_STYLE_TOKENS.bodySize,
    lineHeight:
      typeof r.lineHeight === "number" ? r.lineHeight : DEFAULT_STYLE_TOKENS.lineHeight,
    contentWidth:
      r.contentWidth === "narrow" || r.contentWidth === "normal" || r.contentWidth === "wide" ?
        r.contentWidth
      : DEFAULT_STYLE_TOKENS.contentWidth,
    includeCoverPage:
      typeof r.includeCoverPage === "boolean" ?
        r.includeCoverPage
      : DEFAULT_STYLE_TOKENS.includeCoverPage,
    includeToc:
      typeof r.includeToc === "boolean" ? r.includeToc : DEFAULT_STYLE_TOKENS.includeToc,
    showRunningHeader:
      typeof r.showRunningHeader === "boolean" ?
        r.showRunningHeader
      : DEFAULT_STYLE_TOKENS.showRunningHeader,
    showRunningFooter:
      typeof r.showRunningFooter === "boolean" ?
        r.showRunningFooter
      : DEFAULT_STYLE_TOKENS.showRunningFooter,
    headerText: typeof r.headerText === "string" ? r.headerText : DEFAULT_STYLE_TOKENS.headerText,
    footerText: typeof r.footerText === "string" ? r.footerText : DEFAULT_STYLE_TOKENS.footerText,
    showPageNumbers:
      typeof r.showPageNumbers === "boolean" ?
        r.showPageNumbers
      : DEFAULT_STYLE_TOKENS.showPageNumbers,
    pageNumberPosition:
      isPageNumberPosition(r.pageNumberPosition) ?
        r.pageNumberPosition
      : DEFAULT_STYLE_TOKENS.pageNumberPosition,
    pageSize: isPageSize(r.pageSize) ? r.pageSize : DEFAULT_STYLE_TOKENS.pageSize,
    headingFontWeight: clampWeight(r.headingFontWeight, DEFAULT_STYLE_TOKENS.headingFontWeight),
    bodyFontWeight: clampWeight(r.bodyFontWeight, DEFAULT_STYLE_TOKENS.bodyFontWeight),
    bodyColor: typeof r.bodyColor === "string" ? r.bodyColor : DEFAULT_STYLE_TOKENS.bodyColor,
    headingColor:
      typeof r.headingColor === "string" ? r.headingColor : DEFAULT_STYLE_TOKENS.headingColor,
  };
}
