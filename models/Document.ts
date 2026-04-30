import { model, models, Schema, type InferSchemaType } from "mongoose";

import {
  documentTones,
  documentTypes,
  pageNumberPositions,
  pageSizes,
  themePresets,
} from "@/lib/contracts/document";

const sectionSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    bullets: [{ type: String }],
    table: {
      columns: [{ type: String }],
      rows: [[{ type: String }]],
    },
    chart: {
      type: {
        type: String,
        enum: ["bar", "line", "pie"],
      },
      title: { type: String },
      labels: [{ type: String }],
      values: [{ type: Number }],
    },
    latex: { type: String },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String },
        caption: { type: String },
        widthPct: { type: Number, default: 100 },
      },
    ],
  },
  { _id: false }
);

const styleTokensSchema = new Schema(
  {
    theme: { type: String, enum: themePresets, required: true },
    accentColor: { type: String, required: true },
    headingFont: { type: String, required: true },
    bodyFont: { type: String, required: true },
    headingSize: { type: Number, required: true, default: 30 },
    bodySize: { type: Number, required: true, default: 13 },
    lineHeight: { type: Number, required: true, default: 1.6 },
    contentWidth: {
      type: String,
      enum: ["narrow", "normal", "wide"],
      required: true,
      default: "normal",
    },
    includeCoverPage: { type: Boolean, required: true },
    includeToc: { type: Boolean, required: true },
    showRunningHeader: { type: Boolean, required: false, default: false },
    showRunningFooter: { type: Boolean, required: false, default: false },
    headerText: { type: String, required: false, default: "{title}" },
    footerText: { type: String, required: false, default: "" },
    showPageNumbers: { type: Boolean, required: false, default: true },
    pageNumberPosition: {
      type: String,
      enum: pageNumberPositions,
      required: false,
      default: "footer",
    },
    pageSize: {
      type: String,
      enum: pageSizes,
      required: false,
      default: "a3",
    },
    headingFontWeight: { type: Number, required: false, default: 600 },
    bodyFontWeight: { type: Number, required: false, default: 400 },
    bodyColor: { type: String, required: false, default: "#1e293b" },
    headingColor: { type: String, required: false, default: "" },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    userId: { type: String, index: true },
    userEmail: { type: String, index: true },
    prompt: { type: String, required: true },
    normalizedPrompt: { type: String, required: true },
    humanizedPrompt: { type: String, required: true },
    title: { type: String, required: true },
    tone: {
      type: String,
      enum: documentTones,
      required: true,
    },
    docType: {
      type: String,
      enum: documentTypes,
      required: true,
      index: true,
    },
    sections: { type: [sectionSchema], required: true },
    liveDocHtml: { type: String, default: "" },
    summary: { type: String, required: true },
    styleTokens: { type: styleTokensSchema, required: true },
    assets: [{ type: String }],
  },
  { timestamps: true }
);

export type StoredDocument = InferSchemaType<typeof documentSchema>;

const DocumentModel =
  models.Document || model<StoredDocument>("Document", documentSchema);

export default DocumentModel;
