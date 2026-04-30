import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { getModelOutputText } from "@/agents/utils";
import type { DocumentTone, DocumentType } from "@/lib/contracts/document";
import type { DocumentTemplate } from "@/lib/templates/catalog";

const titlePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You produce a specific, professional document title (not generic marketing language). Return only valid minified JSON: {{"title":"..."}}. No markdown fences.`,
  ],
  [
    "human",
    `Document type: {docType}
Tone: {tone}
User brief:
{humanizedPrompt}

JSON only.`,
  ],
]);

function fallbackTitle(template: DocumentTemplate, humanizedPrompt: string) {
  return `${template.titlePrefix}: ${humanizedPrompt.slice(0, 48)}`.trim();
}

function parseTitleJson(raw: string): string | null {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  if (fence) {
    t = fence[1].trim();
  }
  try {
    const o = JSON.parse(t) as { title?: unknown };
    return typeof o.title === "string" && o.title.trim() ?
        o.title.trim().slice(0, 200)
      : null;
  } catch {
    return null;
  }
}

type TitleToolInput = {
  humanizedPrompt: string;
  tone: DocumentTone;
  docType: DocumentType;
  template: DocumentTemplate;
};

export async function runDocumentTitleTool(input: TitleToolInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackTitle(input.template, input.humanizedPrompt);
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.2,
  });

  try {
    const messages = await titlePrompt.invoke({
      docType: input.docType,
      tone: input.tone,
      humanizedPrompt: input.humanizedPrompt,
    });
    const response = await llm.invoke(messages.messages);
    const parsed = parseTitleJson(getModelOutputText(response.content));
    return parsed ?? fallbackTitle(input.template, input.humanizedPrompt);
  } catch {
    return fallbackTitle(input.template, input.humanizedPrompt);
  }
}
