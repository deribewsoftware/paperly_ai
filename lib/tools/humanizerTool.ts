import { ChatOpenAI } from "@langchain/openai";

import { getModelOutputText } from "@/agents/utils";
import { humanizerPrompt } from "@/lib/langchain/prompts/pipeline";
import type { DocumentTone } from "@/lib/contracts/document";

type HumanizerToolInput = {
  text: string;
  tone: DocumentTone;
};

export async function runHumanizerTool({
  text,
  tone,
}: HumanizerToolInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return text.trim();
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.4,
  });

  try {
    const promptMessages = await humanizerPrompt.invoke({ tone, text });
    const response = await llm.invoke(promptMessages.messages);
    const humanized = getModelOutputText(response.content).trim();
    return humanized || text.trim();
  } catch {
    return text.trim();
  }
}
