import { model, models, Schema, type InferSchemaType } from "mongoose";

import { documentTypes, themePresets } from "@/lib/contracts/document";

const exportFileSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", index: true },
    title: { type: String, required: true },
    docType: { type: String, enum: documentTypes, required: true },
    format: { type: String, enum: ["pdf", "docx", "pptx"], required: true },
    theme: { type: String, enum: themePresets, required: true },
    bytes: { type: Number, required: true },
    contentType: { type: String, required: true },
    fileName: { type: String, required: true },
    cloudinaryUrl: { type: String },
    cloudinaryPublicId: { type: String },
  },
  { timestamps: true }
);

export type StoredExportFile = InferSchemaType<typeof exportFileSchema>;

const ExportFileModel =
  models.ExportFile || model<StoredExportFile>("ExportFile", exportFileSchema);

export default ExportFileModel;
