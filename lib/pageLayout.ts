import type { PageSize } from "@/lib/contracts/document";

/** CSS pixel size at ~96dpi, portrait, for preview frame width (height from aspect ratio). */
const PAGE_PX: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 794, height: 1123 },
  letter: { width: 816, height: 1056 },
  a3: { width: 1123, height: 1587 },
};

export function getPreviewPageDimensions(pageSize: PageSize) {
  return PAGE_PX[pageSize];
}

/** Estimated content column height inside the scroll area (for “page X of Y” heuristics). */
export function estimatePreviewSliceHeightPx(pageSize: PageSize): number {
  const { height } = PAGE_PX[pageSize];
  const chrome = 48 + 48;
  return Math.max(320, height - chrome - 24);
}
