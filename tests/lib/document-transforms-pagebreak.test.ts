import { describe, expect, it } from "vitest";

import { sectionsToEditorHtml } from "@/lib/editor/documentTransforms";

describe("sectionsToEditorHtml page breaks", () => {
  it("inserts page-break marker before listed section indexes", () => {
    const html = sectionsToEditorHtml(
      {
        title: "T",
        sections: [
          { title: "A", body: "a" },
          { title: "B", body: "b" },
        ],
      },
      { pageBreakBeforeSectionIndexes: [1] }
    );
    expect(html).toContain("data-page-break");
    expect(html.indexOf("data-page-break")).toBeLessThan(html.indexOf("<h2>B</h2>"));
  });
});
