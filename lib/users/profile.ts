import { connectToDatabase } from "@/lib/db";
import type { UserPlan } from "@/lib/limits/plans";
import UserProfileModel from "@/models/UserProfile";

type EnsureUserProfileInput = {
  id: string;
  email: string;
  name: string;
  image?: string;
};

export async function ensureUserProfile(input: EnsureUserProfileInput) {
  await connectToDatabase();

  const profile = await UserProfileModel.findOneAndUpdate(
    { userId: input.id },
    {
      $set: {
        email: input.email,
        name: input.name,
        image: input.image,
      },
      $setOnInsert: {
        plan: "free",
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  ).lean();

  return profile;
}

export async function getUserPlan(userId: string) {
  await connectToDatabase();
  const profile = await UserProfileModel.findOne({ userId }).lean();
  return (profile?.plan ?? "free") as UserPlan;
}

export async function setUserPlan(userId: string, plan: UserPlan) {
  await connectToDatabase();
  await UserProfileModel.findOneAndUpdate(
    { userId },
    { $set: { plan } },
    { returnDocument: "after" }
  );
}

export async function setUserStripeSubscription(
  userId: string,
  input: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan: UserPlan;
  }
) {
  await connectToDatabase();
  await UserProfileModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        plan: input.plan,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
      },
    },
    { returnDocument: "after" }
  );
}
