import {
  asPlainText,
  exportToDocxBuffer,
  exportToPdfBuffer,
  exportToPptxBuffer,
} from "@/agents/exportAgent";

describe("export agent", () => {
  const payload = {
    title: "Paperly Validation Report",
    docType: "report" as const,
    theme: "corporate" as const,
    tone: "professional" as const,
    sections: [
      {
        title: "Executive Summary",
        body: "This report validates export generation for PDF DOCX and PPTX.",
        bullets: ["Objective defined", "Workflow validated", "Outputs downloadable"],
      },
      {
        title: "Metrics",
        body: "Performance metrics are summarized below.",
        table: {
          columns: ["Metric", "Value"],
          rows: [
            ["Generation Success", "100%"],
            ["Average Runtime", "Under 5s"],
          ],
        },
      },
      {
        title: "Charts",
        body: "The report includes chart-friendly data.",
        chart: {
          type: "bar" as const,
          title: "Monthly Documents",
          labels: ["Jan", "Feb", "Mar"],
          values: [12, 18, 27],
        },
      },
    ],
  };

  it("numbers section headings in plain text export to match TOC order", () => {
    const text = asPlainText(payload);
    expect(text).toContain("1. Executive Summary");
    expect(text).toContain("2. Metrics");
    expect(text).toContain("3. Charts");
  });

  it("produces non-empty PDF buffer", async () => {
    const buffer = await exportToPdfBuffer(payload);
    expect(buffer.byteLength).toBeGreaterThan(500);
  });

  it("produces non-empty DOCX buffer", async () => {
    const buffer = await exportToDocxBuffer(payload);
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it("produces non-empty PPTX buffer", async () => {
    const buffer = await exportToPptxBuffer(payload);
    expect(buffer.byteLength).toBeGreaterThan(10000);
  });
});
