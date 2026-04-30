import { ChatOpenAI } from "@langchain/openai";

import { getModelOutputText } from "@/agents/utils";
import { summarizerPrompt } from "@/lib/langchain/prompts/pipeline";
import type { DocumentSection, DocumentTone } from "@/lib/contracts/document";

type SummarizerInput = {
  title: string;
  tone: DocumentTone;
  sections: DocumentSection[];
};

function fallbackSummary({ title, sections }: SummarizerInput) {
  const firstSection = sections[0]?.body ?? "";
  return `${title}. ${firstSection}`.trim().slice(0, 220);
}

export async function runSummarizerTool(
  input: SummarizerInput
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackSummary(input);
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.2,
  });

  try {
    const sectionText = input.sections
      .map((section) => `${section.title}: ${section.body}`)
      .join("\n");
    const promptMessages = await summarizerPrompt.invoke({
      tone: input.tone,
      title: input.title,
      sectionText,
    });
    const response = await llm.invoke(promptMessages.messages);
    const summary = getModelOutputText(response.content).trim();
    return summary || fallbackSummary(input);
  } catch {
    return fallbackSummary(input);
  }
}
