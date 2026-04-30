import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { getModelOutputText } from "@/agents/utils";
import type {
  DocumentSection,
  DocumentTone,
  DocumentType,
} from "@/lib/contracts/document";

const continuePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You extend an existing formal document with new sections for the next "page" of content.
Return only valid minified JSON: {{"sections":[{{"title":"...","body":"...","bullets":?[]}}]}} 
Include 1–2 new sections only. Titles must be distinct from existing section titles.
No markdown fences. Do not repeat prior section bodies verbatim. New content must be consistent with prior sections — no contradictions of facts, tone, or decisions already stated. Keep language clear and human; no promotional filler.`,
  ],
  [
    "human",
    `Document type: {docType}
Tone: {tone}
Document title: {title}

Original user brief:
{prompt}

Optional user hint for continuation:
{hint}

Existing sections (titles and excerpts):
{existingExcerpt}

JSON only.`,
  ],
]);

function parseContinueJson(
  raw: string
): { sections: DocumentSection[] } | null {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  if (fence) {
    t = fence[1].trim();
  }
  try {
    const o = JSON.parse(t) as { sections?: unknown };
    if (!Array.isArray(o.sections) || o.sections.length === 0) {
      return null;
    }
    const sections = o.sections.filter((s): s is DocumentSection => {
      return (
        Boolean(s && typeof s === "object") &&
        typeof (s as DocumentSection).title === "string" &&
        typeof (s as DocumentSection).body === "string"
      );
    });
    return sections.length ? { sections } : null;
  } catch {
    return null;
  }
}

function fallbackContinue(): DocumentSection[] {
  return [
    {
      title: "Continuation",
      body: "Additional analysis and next steps will be expanded in a follow-up revision based on the brief and prior sections.",
    },
  ];
}

export type ContinueDocumentInput = {
  title: string;
  prompt: string;
  hint: string;
  tone: DocumentTone;
  docType: DocumentType;
  existingSections: DocumentSection[];
};

export async function runContinueDocumentTool(
  input: ContinueDocumentInput
): Promise<DocumentSection[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  const existingExcerpt = input.existingSections
    .map((s) => `- ${s.title}: ${s.body.slice(0, 400)}`)
    .join("\n");

  if (!apiKey) {
    return fallbackContinue();
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.35,
  });

  try {
    const messages = await continuePrompt.invoke({
      docType: input.docType,
      tone: input.tone,
      title: input.title,
      prompt: input.prompt || "(none)",
      hint: input.hint.trim() || "(none)",
      existingExcerpt,
    });
    const response = await llm.invoke(messages.messages);
    const parsed = parseContinueJson(getModelOutputText(response.content));
    return parsed?.sections ?? fallbackContinue();
  } catch {
    return fallbackContinue();
  }
}
