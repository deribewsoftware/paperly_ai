import type {
  DocumentTone,
  DocumentType,
  StyleTokens,
} from "@/lib/contracts/document";
import {
  getStyleTokens,
  templateCatalog,
  type DocumentTemplate,
} from "@/lib/templates/catalog";

type TemplateSelectionResult = {
  template: DocumentTemplate;
  styleTokens: StyleTokens;
};

export function runTemplateSelectorTool(
  docType: DocumentType,
  tone: DocumentTone
): TemplateSelectionResult {
  const template = templateCatalog[docType] ?? templateCatalog.proposal;
  const styleTokens = getStyleTokens(template.suggestedTheme, tone);

  return { template, styleTokens };
}
