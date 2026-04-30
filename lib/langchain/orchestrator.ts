import {
  type OrchestratedDocument,
  type OrchestratorInput,
} from "@/lib/contracts/document";
import { runPrepDocumentContext } from "@/lib/langchain/prepDocumentContext";
import { runStructureTool } from "@/lib/tools/structureTool";
import { runSummarizerTool } from "@/lib/tools/summarizerTool";

export async function runDocumentOrchestrator(
  input: OrchestratorInput
): Promise<OrchestratedDocument> {
  const prep = await runPrepDocumentContext(input);
  const { docType, tone, prompt, normalizedPrompt, humanizedPrompt, template, styleTokens } =
    prep;
  const structured = await runStructureTool({
    prompt: humanizedPrompt,
    tone,
    docType,
    template,
  });
  const summary = await runSummarizerTool({
    title: structured.title,
    tone,
    sections: structured.sections,
  });

  return {
    title: structured.title,
    prompt,
    normalizedPrompt,
    humanizedPrompt,
    docType,
    tone,
    sections: structured.sections,
    summary,
    styleTokens,
    assets: [],
    generatedAt: new Date().toISOString(),
  };
}
