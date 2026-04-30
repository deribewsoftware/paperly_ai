import type {
  DocumentSection,
  DocumentType,
  DocumentTone,
  StyleTokens,
  ThemePreset,
} from "@/lib/contracts/document";
import { DEFAULT_STYLE_TOKENS } from "@/lib/styleTokensNormalize";

export type DocumentTemplate = {
  docType: DocumentType;
  displayName: string;
  titlePrefix: string;
  defaultSections: DocumentSection[];
  suggestedTheme: ThemePreset;
};

const section = (title: string, body: string): DocumentSection => ({
  title,
  body,
});

export const templateCatalog: Record<DocumentType, DocumentTemplate> = {
  proposal: {
    docType: "proposal",
    displayName: "Business Proposal",
    titlePrefix: "Professional Business Proposal",
    suggestedTheme: "corporate",
    defaultSections: [
      section("Executive Summary", "Provide a concise overview of the proposal."),
      section("Problem Statement", "Clarify the challenge and business context."),
      section("Solution", "Describe the proposed solution and strategic fit."),
      section("Implementation Plan", "Outline milestones, ownership, and timeline."),
      section("Budget & ROI", "Present costs, expected returns, and assumptions."),
      section("Conclusion", "Reinforce value and call to action."),
    ],
  },
  "research-paper": {
    docType: "research-paper",
    displayName: "Research Paper",
    titlePrefix: "Research Paper",
    suggestedTheme: "academic",
    defaultSections: [
      section("Abstract", "Summarize objective, method, and core findings."),
      section("Introduction", "Introduce context and research motivation."),
      section("Methodology", "Explain approach, sample, and evaluation method."),
      section("Findings", "Present key outcomes and interpretations."),
      section("Discussion", "Discuss implications and limitations."),
      section("Conclusion", "Summarize outcomes and recommendations."),
    ],
  },
  "resume-cv": {
    docType: "resume-cv",
    displayName: "Resume / CV",
    titlePrefix: "Professional Resume",
    suggestedTheme: "corporate",
    defaultSections: [
      section("Professional Summary", "Write a concise personal value statement."),
      section("Core Skills", "List key capabilities aligned with the role."),
      section("Work Experience", "Highlight impact-driven accomplishments."),
      section("Education", "Provide relevant educational background."),
      section("Certifications", "Include training and certifications if available."),
    ],
  },
  "meeting-notes": {
    docType: "meeting-notes",
    displayName: "Meeting Notes",
    titlePrefix: "Meeting Summary",
    suggestedTheme: "corporate",
    defaultSections: [
      section("Agenda", "Capture agenda topics discussed."),
      section("Discussion Summary", "Summarize key conversation points."),
      section("Decisions", "Document final decisions and rationale."),
      section("Action Items", "List action owners and due dates."),
    ],
  },
  "marketing-plan": {
    docType: "marketing-plan",
    displayName: "Marketing Plan",
    titlePrefix: "Marketing Plan",
    suggestedTheme: "startup",
    defaultSections: [
      section("Market Overview", "Describe target market and trends."),
      section("Audience Segments", "Define key segments and personas."),
      section("Campaign Strategy", "Present messaging and channel strategy."),
      section("Budget Allocation", "Detail spend plan and expected impact."),
      section("KPI Framework", "Define metrics and reporting cadence."),
    ],
  },
  "contract-letter": {
    docType: "contract-letter",
    displayName: "Contract / Formal Letter",
    titlePrefix: "Formal Agreement Draft",
    suggestedTheme: "corporate",
    defaultSections: [
      section("Parties", "Identify parties and formal identifiers."),
      section("Scope", "Describe obligations and deliverables clearly."),
      section("Terms", "Provide payment, duration, and termination terms."),
      section("Compliance", "Define legal and compliance expectations."),
      section("Signatures", "Include signature blocks and execution details."),
    ],
  },
  report: {
    docType: "report",
    displayName: "Professional Report",
    titlePrefix: "Professional Report",
    suggestedTheme: "corporate",
    defaultSections: [
      section("Overview", "Summarize objective and context."),
      section("Analysis", "Provide evidence-backed insights."),
      section("Recommendations", "Detail actionable recommendations."),
      section("Next Steps", "Specify execution priorities and timeline."),
    ],
  },
  presentation: {
    docType: "presentation",
    displayName: "Presentation Deck",
    titlePrefix: "Presentation Deck",
    suggestedTheme: "startup",
    defaultSections: [
      section("Problem", "Define the key problem statement."),
      section("Solution", "Show proposed solution and differentiation."),
      section("Business Model", "Explain how value and revenue are created."),
      section("Go-To-Market", "Outline acquisition and scaling strategy."),
      section("Ask", "State the request or decision needed."),
    ],
  },
};

export function getStyleTokens(theme: ThemePreset, tone: DocumentTone): StyleTokens {
  if (theme === "academic") {
    return {
      ...DEFAULT_STYLE_TOKENS,
      theme,
      accentColor: "#1E3A8A",
      headingFont: "Times New Roman",
      bodyFont: "Georgia",
      headingSize: 30,
      bodySize: 13,
      lineHeight: 1.7,
      contentWidth: "normal",
      includeCoverPage: true,
      includeToc: true,
    };
  }

  if (theme === "startup") {
    return {
      ...DEFAULT_STYLE_TOKENS,
      theme,
      accentColor: tone === "startup" ? "#4F46E5" : "#0F172A",
      headingFont: "Inter",
      bodyFont: "Calibri",
      headingSize: 32,
      bodySize: 14,
      lineHeight: 1.6,
      contentWidth: "wide",
      includeCoverPage: true,
      includeToc: false,
    };
  }

  return {
    ...DEFAULT_STYLE_TOKENS,
    theme: "corporate",
    accentColor: "#0F172A",
    headingFont: "Arial",
    bodyFont: "Calibri",
    headingSize: 30,
    bodySize: 13,
    lineHeight: 1.6,
    contentWidth: "normal",
    includeCoverPage: true,
    includeToc: true,
  };
}
