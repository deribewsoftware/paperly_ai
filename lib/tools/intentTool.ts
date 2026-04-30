import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { documentTypes, type DocumentType } from "@/lib/contracts/document";
import { getModelOutputText } from "@/agents/utils";

const docTypeKeywords: Record<DocumentType, string[]> = {
  proposal: ["proposal", "business proposal", "feasibility"],
  "research-paper": ["research", "thesis", "dissertation", "literature review"],
  "resume-cv": ["resume", "cv", "curriculum vitae", "job application"],
  "meeting-notes": ["meeting", "minutes", "notes", "action items"],
  "marketing-plan": ["marketing", "campaign", "brand strategy", "go-to-market"],
  "contract-letter": ["contract", "agreement", "letter", "legal"],
  report: ["report", "analysis", "assessment", "evaluation"],
  presentation: ["presentation", "pitch deck", "slides", "deck"],
};

function inferByKeyword(prompt: string): DocumentType {
  const normalized = prompt.toLowerCase();

  for (const [docType, keywords] of Object.entries(docTypeKeywords)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return docType as DocumentType;
    }
  }

  return "proposal";
}

export async function runIntentTool(prompt: string): Promise<DocumentType> {
  const apiKey = process.env.OPENAI_API_KEY;
  const fallback = inferByKeyword(prompt);

  if (!apiKey) {
    return fallback;
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0,
  });

  try {
    const response = await llm.invoke([
      new SystemMessage(
        `Classify user request into one doc type: ${documentTypes.join(", ")}. Return only the exact doc type string.`
      ),
      new HumanMessage(prompt),
    ]);

    const parsed = getModelOutputText(response.content).trim() as DocumentType;
    if (documentTypes.includes(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to keyword rule classification.
  }

  return fallback;
}
