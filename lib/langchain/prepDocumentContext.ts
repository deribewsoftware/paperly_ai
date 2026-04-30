import type {
  DocumentType,
  DocumentTone,
  OrchestratorInput,
  StyleTokens,
} from "@/lib/contracts/document";
import type { DocumentTemplate } from "@/lib/templates/catalog";
import { runGrammarTool } from "@/lib/tools/grammarTool";
import { runHumanizerTool } from "@/lib/tools/humanizerTool";
import { runIntentTool } from "@/lib/tools/intentTool";
import { runTemplateSelectorTool } from "@/lib/tools/templateSelector";

export function resolveDocType(
  explicitDocType: DocumentType | undefined,
  inferredDocType: DocumentType
) {
  return explicitDocType ?? inferredDocType;
}

export type DocumentPrepContext = {
  docType: DocumentType;
  tone: DocumentTone;
  prompt: string;
  normalizedPrompt: string;
  humanizedPrompt: string;
  template: DocumentTemplate;
  styleTokens: StyleTokens;
};

export async function runPrepDocumentContext(
  input: OrchestratorInput
): Promise<DocumentPrepContext> {
  const inferredDocType = await runIntentTool(input.prompt);
  const docType = resolveDocType(input.docType, inferredDocType);
  const normalizedPrompt = await runGrammarTool({
    prompt: input.prompt,
    tone: input.tone,
    docType,
  });
  const humanizedPrompt = await runHumanizerTool({
    text: normalizedPrompt,
    tone: input.tone,
  });
  const { template, styleTokens } = runTemplateSelectorTool(docType, input.tone);

  return {
    docType,
    tone: input.tone,
    prompt: input.prompt,
    normalizedPrompt,
    humanizedPrompt,
    template,
    styleTokens,
  };
}
