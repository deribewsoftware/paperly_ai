import type { DocumentTone, ThemePreset } from "@/lib/contracts/document";

export type ExportTheme = {
  theme: ThemePreset;
  titleColor: string;
  headingColor: string;
  bodyColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
};

export function resolveExportTheme(
  theme: ThemePreset | undefined,
  tone: DocumentTone
): ExportTheme {
  if (theme === "academic") {
    return {
      theme: "academic",
      titleColor: "#0F172A",
      headingColor: "#1E3A8A",
      bodyColor: "#111827",
      accentColor: "#1E3A8A",
      headingFont: "TimesRoman",
      bodyFont: "TimesRoman",
    };
  }

  if (theme === "startup" || tone === "startup") {
    return {
      theme: "startup",
      titleColor: "#0B1022",
      headingColor: "#4338CA",
      bodyColor: "#1E293B",
      accentColor: "#4F46E5",
      headingFont: "Helvetica",
      bodyFont: "Helvetica",
    };
  }

  return {
    theme: "corporate",
    titleColor: "#0F172A",
    headingColor: "#0F172A",
    bodyColor: "#111827",
    accentColor: "#1D4ED8",
    headingFont: "Helvetica",
    bodyFont: "Helvetica",
  };
}
