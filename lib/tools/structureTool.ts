import { ChatOpenAI } from "@langchain/openai";

import { getModelOutputText } from "@/agents/utils";
import type {
  DocumentSection,
  DocumentTone,
  DocumentType,
} from "@/lib/contracts/document";
import {
  buildStructurePromptInput,
  documentStructurePrompt,
  formatSectionOutline,
} from "@/lib/langchain/prompts/documentStructure";
import type { DocumentTemplate } from "@/lib/templates/catalog";

type StructureToolInput = {
  prompt: string;
  tone: DocumentTone;
  docType: DocumentType;
  template: DocumentTemplate;
};

type StructureToolOutput = {
  title: string;
  sections: DocumentSection[];
};

function parseStructureJson(raw: string): StructureToolOutput | null {
  let trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  if (fence) {
    trimmed = fence[1].trim();
  }
  try {
    const parsed = JSON.parse(trimmed) as StructureToolOutput;
    return parsed;
  } catch {
    return null;
  }
}

function fallbackStructure({
  prompt,
  template,
}: Pick<StructureToolInput, "prompt" | "template">): StructureToolOutput {
  return {
    title: `${template.titlePrefix}: ${prompt.slice(0, 42)}`.trim(),
    sections: template.defaultSections,
  };
}

export async function runStructureTool(
  input: StructureToolInput
): Promise<StructureToolOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackStructure(input);
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.35,
  });

  try {
    const sectionOutline = formatSectionOutline(input.template.defaultSections);
    const promptVars = buildStructurePromptInput({
      docType: input.docType,
      tone: input.tone,
      prompt: input.prompt,
      sectionOutline,
      sectionCount: input.template.defaultSections.length,
    });
    const promptMessages = await documentStructurePrompt.invoke(promptVars);
    const response = await llm.invoke(promptMessages.messages);

    const parsedRaw = getModelOutputText(response.content);
    const parsed = parseStructureJson(parsedRaw);
    if (!parsed) {
      return fallbackStructure(input);
    }
    const validSections =
      Array.isArray(parsed.sections) &&
      parsed.sections.every(
        (section) =>
          typeof section.title === "string" && typeof section.body === "string"
      );

    if (
      !parsed.title ||
      !validSections ||
      parsed.sections.length !== input.template.defaultSections.length
    ) {
      return fallbackStructure(input);
    }

    return {
      title: parsed.title,
      sections: parsed.sections,
    };
  } catch {
    return fallbackStructure(input);
  }
}
