import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import type { DocumentRequest, GeneratedSection } from "@/agents/types";
import { getModelOutputText } from "@/agents/utils";

const fallbackResearchSections: GeneratedSection[] = [
  {
    title: "Methodology",
    body: "Mixed-method analysis with practical assumptions, contextual benchmarks, and market observations.",
  },
  {
    title: "Findings",
    body: "Evidence suggests clear demand, feasible operations, and measurable growth potential under phased execution.",
  },
  {
    title: "Recommendations",
    body: "Prioritize a pilot rollout, validate early KPIs, then scale based on proven unit economics and customer feedback.",
  },
];

export async function runResearchAgent(
  request: DocumentRequest
): Promise<GeneratedSection[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackResearchSections;
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.2,
  });

  const response = await llm.invoke([
    new SystemMessage(
      "You are Paperly AI Research Agent. Return practical findings and recommendations."
    ),
    new HumanMessage(
      `Document request: ${request.prompt}\nTone: ${request.tone}\n\nReturn valid JSON array with 2 short sections, each as {"title":"...","body":"..."}.`
    ),
  ]);

  const raw = getModelOutputText(response.content);

  try {
    const parsed = JSON.parse(raw) as GeneratedSection[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackResearchSections;
    }
    return parsed;
  } catch {
    return fallbackResearchSections;
  }
}
