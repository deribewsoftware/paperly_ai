import { ChatPromptTemplate } from "@langchain/core/prompts";

export const grammarPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a grammar and clarity editor. The output will become the brief for a structured, reader-facing document.
Fix grammar, spelling, and punctuation only; keep the author's intent.
Use plain language: prefer short sentences and active voice. No marketing filler or hype.
Preserve exactly: proper nouns, numbers, dates, units, list structure, and every factual claim — do not add or remove facts.
Return plain text only (no JSON, no markdown).`,
  ],
  [
    "human",
    `Document type: {docType}
Tone: {tone}

Rewrite this user prompt with correct grammar and clarity only:
{prompt}`,
  ],
]);

export const humanizerPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You turn rough notes into a single, clear generation brief for a formal document.
Write like a careful human editor: natural, direct, and easy to scan.
Keep it concise. Do not add facts, names, dates, statistics, or URLs that were not implied in the source. Do not exaggerate or sound promotional.`,
  ],
  [
    "human",
    `Tone: {tone}

Humanize this request (keep it brief):
{text}`,
  ],
]);

export const summarizerPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You write short executive abstracts for formal documents.
In 2–3 sentences: state scope, the main takeaway, and a sensible next step or outcome. Use clear, standard language. Match the requested tone. No greeting, no hype, no markdown.`,
  ],
  [
    "human",
    `Tone: {tone}
Document title: {title}

Summarize the following section content:
{sectionText}`,
  ],
]);
