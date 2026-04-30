import fixtures from "@/tests/fixtures/prompts/document-types.json";
import type { DocumentType } from "@/lib/contracts/document";
import { runDocumentOrchestrator } from "@/lib/langchain/orchestrator";
import { runIntentTool } from "@/lib/tools/intentTool";

describe("document orchestrator", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "";
  });

  it("infers document type from prompt fixtures", async () => {
    for (const fixture of fixtures as {
      prompt: string;
      expectedDocType: DocumentType;
    }[]) {
      const inferred = await runIntentTool(fixture.prompt);
      expect(inferred).toBe(fixture.expectedDocType);
    }
  });

  it("returns standardized orchestrated contract", async () => {
    const result = await runDocumentOrchestrator({
      prompt: "Create a business proposal for a coffee export startup.",
      tone: "professional",
      docType: "proposal",
    });

    expect(result.docType).toBe("proposal");
    expect(result.title.length).toBeGreaterThan(8);
    expect(result.sections.length).toBeGreaterThanOrEqual(4);
    expect(result.styleTokens.theme).toBe("corporate");
    expect(result.summary.length).toBeGreaterThan(10);
    expect(result.generatedAt).toBeTruthy();
  });
});
