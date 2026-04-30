import { z } from "zod";

import {
  documentTypes,
  documentTones,
  pageNumberPositions,
  pageSizes,
  themePresets,
} from "@/lib/contracts/document";

export const generateDocumentSchema = z.object({
  prompt: z.string().min(12, "Prompt should be at least 12 characters."),
  tone: z.enum(documentTones).default("professional"),
  docType: z.enum(documentTypes).optional(),
});

export const exportDocumentSchema = z.object({
  title: z.string().min(3).max(120),
  format: z.enum(["pdf", "docx", "pptx"]),
  docType: z.enum(documentTypes).optional(),
  theme: z.enum(themePresets).optional(),
  tone: z.enum(documentTones).optional(),
  documentId: z.string().optional(),
  styleTokens: z
    .object({
      theme: z.enum(themePresets),
      accentColor: z.string(),
      headingFont: z.string(),
      bodyFont: z.string(),
      headingSize: z.number().min(18).max(56),
      bodySize: z.number().min(10).max(24),
      lineHeight: z.number().min(1.1).max(2.5),
      contentWidth: z.enum(["narrow", "normal", "wide"]),
      includeCoverPage: z.boolean(),
      includeToc: z.boolean(),
      showRunningHeader: z.boolean(),
      showRunningFooter: z.boolean(),
      headerText: z.string().max(500),
      footerText: z.string().max(500),
      showPageNumbers: z.boolean(),
      pageNumberPosition: z.enum(pageNumberPositions),
      pageSize: z.enum(pageSizes),
      headingFontWeight: z.number().min(100).max(900),
      bodyFontWeight: z.number().min(100).max(900),
      bodyColor: z.string(),
      headingColor: z.string(),
    })
    .optional(),
  sections: z
    .array(
      z.object({
        title: z.string().min(2).max(90),
        body: z.string().min(1),
        bullets: z.array(z.string()).optional(),
        latex: z.string().optional(),
        images: z
          .array(
            z.object({
              url: z.string().url(),
              alt: z.string().optional(),
              caption: z.string().optional(),
              widthPct: z.number().min(10).max(100).optional(),
            })
          )
          .optional(),
        table: z
          .object({
            columns: z.array(z.string()),
            rows: z.array(z.array(z.string())),
          })
          .optional(),
        chart: z
          .object({
            type: z.enum(["bar", "line", "pie"]),
            title: z.string(),
            labels: z.array(z.string()),
            values: z.array(z.number()),
          })
          .optional(),
      })
    )
    .min(1),
});

/** Continue writing: extends an existing in-editor document (counts as one generate). */
export const continueDocumentSchema = z.object({
  prompt: z.string().min(1).optional(),
  hint: z.string().max(4000).optional(),
  summary: z.string().max(8000).optional(),
  title: z.string().min(3).max(200),
  docType: z.enum(documentTypes),
  tone: z.enum(documentTones),
  sections: exportDocumentSchema.shape.sections,
  styleTokens: exportDocumentSchema.shape.styleTokens.optional(),
});

export const saveDocumentSchema = z.object({
  documentId: z.string().optional(),
  title: z.string().min(3).max(120),
  prompt: z.string().min(1).optional(),
  liveDocHtml: z.string().optional(),
  summary: z.string().optional(),
  docType: z.enum(documentTypes),
  tone: z.enum(documentTones),
  sections: exportDocumentSchema.shape.sections,
  styleTokens: exportDocumentSchema.shape.styleTokens.unwrap(),
  assets: z.array(z.string()).optional(),
});
