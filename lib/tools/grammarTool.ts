import { ChatOpenAI } from "@langchain/openai";

import { getModelOutputText } from "@/agents/utils";
import { grammarPrompt } from "@/lib/langchain/prompts/pipeline";
import type { DocumentTone, DocumentType } from "@/lib/contracts/document";

type GrammarToolInput = {
  prompt: string;
  tone: DocumentTone;
  docType: DocumentType;
};

export async function runGrammarTool({
  prompt,
  tone,
  docType,
}: GrammarToolInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return prompt.trim();
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0,
  });

  try {
    const promptMessages = await grammarPrompt.invoke({ docType, tone, prompt });
    const response = await llm.invoke(promptMessages.messages);
    const corrected = getModelOutputText(response.content).trim();
    return corrected || prompt.trim();
  } catch {
    return prompt.trim();
  }
}
