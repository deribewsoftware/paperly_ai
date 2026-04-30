import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import type { DocumentRequest, GeneratedSection } from "@/agents/types";
import { getModelOutputText } from "@/agents/utils";

type WriterAgentOutput = {
  title: string;
  sections: GeneratedSection[];
};

const fallbackSections: GeneratedSection[] = [
  {
    title: "Executive Summary",
    body: "This draft outlines a practical and professional response to the requested document topic.",
  },
  {
    title: "Problem & Opportunity",
    body: "The document explains current challenges and highlights opportunities for measurable improvement.",
  },
  {
    title: "Implementation Plan",
    body: "The plan proposes clear phases, ownership, timeline, and expected outcomes.",
  },
];

function fallbackWriterOutput(prompt: string): WriterAgentOutput {
  return {
    title: `Paperly Draft: ${prompt.slice(0, 48)}`.trim(),
    sections: fallbackSections,
  };
}

export async function runWriterAgent(
  request: DocumentRequest
): Promise<WriterAgentOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackWriterOutput(request.prompt);
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.3,
  });

  const response = await llm.invoke([
    new SystemMessage(
      "You are Paperly AI Writer Agent. Produce concise, structured, professional document sections."
    ),
    new HumanMessage(
      `Create a ${request.tone} draft for this request:\n${request.prompt}\n\nReturn JSON with shape: {"title":"...","sections":[{"title":"...","body":"..."}]} using 4 sections.`
    ),
  ]);

  const raw = getModelOutputText(response.content);

  try {
    const parsed = JSON.parse(raw) as WriterAgentOutput;
    if (
      !parsed.title ||
      !Array.isArray(parsed.sections) ||
      parsed.sections.length === 0
    ) {
      return fallbackWriterOutput(request.prompt);
    }
    return parsed;
  } catch {
    return fallbackWriterOutput(request.prompt);
  }
}
