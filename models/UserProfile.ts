import { model, models, Schema, type InferSchemaType } from "mongoose";

const userProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    image: { type: String },
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String, index: true },
    plan: {
      type: String,
      enum: ["free", "pro", "team", "enterprise"],
      default: "free",
      required: true,
    },
  },
  { timestamps: true }
);

export type StoredUserProfile = InferSchemaType<typeof userProfileSchema>;

const UserProfileModel =
  models.UserProfile ||
  model<StoredUserProfile>("UserProfile", userProfileSchema);

export default UserProfileModel;
