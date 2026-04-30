import { ChatPromptTemplate } from "@langchain/core/prompts";

import type { DocumentSection, DocumentTone, DocumentType } from "@/lib/contracts/document";

const TONE_GUIDANCE: Record<DocumentTone, string> = {
  professional:
    "Clear, precise business English; active voice; confident but not hyperbolic. Avoid slang. Prefer concrete outcomes and responsibilities.",
  academic:
    "Formal academic register; cautious claims (e.g. may, suggests, indicates); define terms briefly where helpful; IMRaD-style flow where the outline implies it. No marketing hype.",
  startup:
    "Direct, energetic, outcome-oriented; short sentences OK; still professional. Emphasize traction, milestones, and differentiation without unsubstantiated superlatives.",
};

const DOC_TYPE_DEPTH: Record<DocumentType, string> = {
  proposal:
    "Multi-paragraph sections with clear business rationale, scope, and next steps. Suitable for ~6–12 pages when exported.",
  "research-paper":
    "Dense, well-structured sections: multiple paragraphs per section where appropriate; methodology and findings clearly separated. Suitable for long-form export.",
  "resume-cv":
    "Tight, scannable content: short paragraphs or phrase-style lines in body; bullets encouraged for skills and achievements.",
  "meeting-notes":
    "Scannable: concise paragraphs; bullets strongly encouraged for decisions and action items with owners/dates when inferable.",
  "marketing-plan":
    "Structured marketing narrative: segments, channels, KPIs; bullets for lists; optional table for budget rows if natural.",
  "contract-letter":
    "Formal legal-adjacent tone: numbered clauses or lists in body where clarity requires; precise scope and terms language.",
  report:
    "Evidence-style narrative: overview, analysis, recommendations; multi-paragraph bodies; optional table for comparisons or timelines.",
  presentation:
    "Slide-friendly density: short paragraphs; bullets for key points; avoid long unbroken prose.",
};

export const STRUCTURE_JSON_SCHEMA_HINT = `Return one JSON object only (no markdown code fences, no text before or after).

Shape:
{
  "title": "<document title, no trailing punctuation clutter>",
  "sections": [
    {
      "title": "<section heading text only — do NOT prefix with numbers like 1. or 1.1>",
      "body": "<main prose; use \\n\\n between paragraphs; numbered lists inside body OK for sub-steps>",
      "bullets": ["optional short items; omit key if unused"],
      "table": { "columns": ["..."], "rows": [["cell", "..."], ...] },
      "chart": { "type": "bar"|"line"|"pie", "title": "...", "labels": [...], "values": [numbers] },
      "latex": "ONLY if essential: valid LaTeX math (KaTeX-friendly), not plain prose",
      "images": [{ "url": "https://...", "alt": "...", "caption": "...", "widthPct": 70 }]
    }
  ]
}

Optional fields (bullets, table, chart, latex, images): omit entirely when not needed.
For "chart", only include if a simple numeric series is natural from the user's request; do not invent precise real-world statistics — use clearly generic or illustrative values labeled as illustrative if needed.
For "table", use string cells only; keep rows reasonable (typically under 12).
For "latex": include ONLY when the section truly needs mathematical notation (equations, formulas, symbols awkward in plain text). Use valid LaTeX suitable for KaTeX (e.g. $...$, \\frac, \\sum). Do NOT add decorative or empty LaTeX; omit the key if there is no real math.`;

export function formatSectionOutline(sections: DocumentSection[]): string {
  return sections
    .map((s, i) => {
      const role = s.body.trim().slice(0, 280);
      return `${i + 1}. ${s.title} — ${role}${s.body.length > 280 ? "…" : ""}`;
    })
    .join("\n");
}

export const documentStructurePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a senior writer and editor producing publication-ready structured documents (reports, proposals, letters, decks, CVs, research-style papers, meeting minutes).

You output ONLY a single JSON object as specified in the user message. No markdown fences, no explanations.

Quality rules:
- Write for a real reader: each section should make clear who it is for, what it covers, and one main takeaway where appropriate.
- Every section must contain substantive, original prose aligned to the user's request; do not paste outline role text as the section body.
- section.title is plain title text only — no leading numbering (export and table of contents will number sections).
- Use "bullets" for scannable lists (action items, KPIs, risks, definitions, terms).
- Use "body" for flowing paragraphs; separate paragraphs with blank lines (\\n\\n).
- Use "table" only when comparison, budgets, or timelines are clearer in rows and columns.
- Use "latex" only for genuine mathematical notation (see schema hint). Never use LaTeX for ordinary prose.
- Match the document type and tone guidance below.

Document type: {docType}
Tone label: {tone}
Tone guidance: {toneGuidance}
Length and form: {docTypeDepth}`,
  ],
  [
    "human",
    `User request (generation brief):
{prompt}

Required outline — produce exactly {sectionCount} sections, in this order, with these titles and coverage (counts must match; titles may be lightly adjusted only if the user request clearly requires different wording, but keep the same structure and count):
{sectionOutline}

{jsonSchemaHint}`,
  ],
]);

export function buildStructurePromptInput(input: {
  docType: DocumentType;
  tone: DocumentTone;
  prompt: string;
  sectionOutline: string;
  sectionCount: number;
}) {
  return {
    docType: input.docType,
    tone: input.tone,
    toneGuidance: TONE_GUIDANCE[input.tone],
    docTypeDepth: DOC_TYPE_DEPTH[input.docType],
    prompt: input.prompt,
    sectionOutline: input.sectionOutline,
    sectionCount: String(input.sectionCount),
    jsonSchemaHint: STRUCTURE_JSON_SCHEMA_HINT,
  };
}
