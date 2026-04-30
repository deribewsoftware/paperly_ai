import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { getModelOutputText } from "@/agents/utils";
import type {
  DocumentSection,
  DocumentTone,
  DocumentType,
} from "@/lib/contracts/document";
import type { DocumentTemplate } from "@/lib/templates/catalog";

const sectionBodyPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You write one section of a formal document. Write for a real reader: plain, direct language; short sentences where it helps; active voice; no hype or filler. Match the requested tone and document type.
Return only valid minified JSON (no markdown fences) with shape:
{{"body":"...", "bullets"?: string[], "table"?: {{"columns": string[], "rows": string[][]}}, "chart"?: {{"type":"bar"|"line"|"pie","title":string,"labels":string[],"values":number[]}}, "latex"?: string, "images"?: [{{"url":string,"alt"?:string,"caption"?:string,"widthPct"?: number}}]}}
Omit optional keys when unused. Use "bullets" for action items, metrics, risks, or definitions. Use "table" only when rows/columns aid clarity. Use "latex" only for real equations or notation that is awkward in plain text — KaTeX-friendly TeX, never decorative or empty; omit the key when there is no math. "body" must be substantive prose; use \\n\\n between paragraphs in the string. Do not contradict prior sections.`,
  ],
  [
    "human",
    `Document type: {docType}
Tone: {tone}
Section {sectionIndex} of {sectionCount}: "{sectionTitle}"
Section role (guidance): {sectionRole}

User brief:
{humanizedPrompt}

Prior sections for context:
{priorContext}

JSON only.`,
  ],
]);

function parseBodyJson(raw: string): Partial<DocumentSection> | null {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  if (fence) {
    t = fence[1].trim();
  }
  try {
    return JSON.parse(t) as Partial<DocumentSection>;
  } catch {
    return null;
  }
}

function fallbackSection(templateSection: DocumentSection): DocumentSection {
  return {
    title: templateSection.title,
    body: templateSection.body,
    bullets: templateSection.bullets,
    table: templateSection.table,
    chart: templateSection.chart,
    latex: templateSection.latex,
    images: templateSection.images,
  };
}

export type SectionBodyToolInput = {
  humanizedPrompt: string;
  tone: DocumentTone;
  docType: DocumentType;
  template: DocumentTemplate;
  sectionIndex: number;
  sectionTemplate: DocumentSection;
  completedSections: DocumentSection[];
};

export async function runSectionBodyTool(
  input: SectionBodyToolInput
): Promise<DocumentSection> {
  const templateSection = input.sectionTemplate;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackSection(templateSection);
  }

  const priorContext =
    input.completedSections.length === 0 ?
      "(none yet)"
    : input.completedSections
        .map((s) => `## ${s.title}\n${s.body.slice(0, 1_200)}`)
        .join("\n\n");

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    temperature: 0.35,
  });

  try {
    const messages = await sectionBodyPrompt.invoke({
      docType: input.docType,
      tone: input.tone,
      sectionIndex: String(input.sectionIndex + 1),
      sectionCount: String(input.template.defaultSections.length),
      sectionTitle: templateSection.title,
      sectionRole: templateSection.body.slice(0, 500),
      humanizedPrompt: input.humanizedPrompt,
      priorContext,
    });
    const response = await llm.invoke(messages.messages);
    const parsed = parseBodyJson(getModelOutputText(response.content));
    if (!parsed || typeof parsed.body !== "string" || !parsed.body.trim()) {
      return fallbackSection(templateSection);
    }

    const section: DocumentSection = {
      title: templateSection.title,
      body: parsed.body.trim(),
    };
    if (Array.isArray(parsed.bullets) && parsed.bullets.length) {
      section.bullets = parsed.bullets.filter((b): b is string => typeof b === "string");
    }
    if (parsed.table?.columns && parsed.table.rows) {
      section.table = parsed.table;
    }
    if (parsed.chart?.type && parsed.chart.labels && parsed.chart.values) {
      section.chart = parsed.chart;
    }
    if (typeof parsed.latex === "string" && parsed.latex.trim()) {
      section.latex = parsed.latex;
    }
    if (Array.isArray(parsed.images) && parsed.images.length) {
      section.images = parsed.images.filter(
        (img): img is NonNullable<DocumentSection["images"]>[number] =>
          Boolean(img && typeof img === "object" && typeof img.url === "string")
      );
    }
    return section;
  } catch {
    return fallbackSection(templateSection);
  }
}
