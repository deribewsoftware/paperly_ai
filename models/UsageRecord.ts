import { model, models, Schema, type InferSchemaType } from "mongoose";

const usageRecordSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
    plan: {
      type: String,
      enum: ["free", "pro", "team", "enterprise"],
      default: "free",
      required: true,
    },
    generateCount: { type: Number, default: 0, required: true },
    exportCount: { type: Number, default: 0, required: true },
    uploadCount: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

usageRecordSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

export type StoredUsageRecord = InferSchemaType<typeof usageRecordSchema>;

const UsageRecordModel =
  models.UsageRecord || model<StoredUsageRecord>("UsageRecord", usageRecordSchema);

export default UsageRecordModel;
