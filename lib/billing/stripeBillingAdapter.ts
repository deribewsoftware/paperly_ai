import Stripe from "stripe";

import type { BillingAdapter, BillingCheckoutInput } from "@/lib/billing/adapter";
import type { UserPlan } from "@/lib/limits/plans";
import { connectToDatabase } from "@/lib/db";
import UserProfileModel from "@/models/UserProfile";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  stripeClient = new Stripe(secret);
  return stripeClient;
}

function getPriceId(plan: Exclude<UserPlan, "free">) {
  if (plan === "pro") {
    return process.env.STRIPE_PRICE_PRO;
  }
  if (plan === "team") {
    return process.env.STRIPE_PRICE_TEAM;
  }
  return process.env.STRIPE_PRICE_ENTERPRISE;
}

async function createCheckoutSession(input: BillingCheckoutInput) {
  const price = getPriceId(input.plan);
  if (!price) {
    throw new Error(`Missing Stripe price configuration for ${input.plan}.`);
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    metadata: {
      userId: input.userId,
      plan: input.plan,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout URL.");
  }

  return { checkoutUrl: session.url };
}

async function cancelSubscription(userId: string) {
  await connectToDatabase();
  const profile = await UserProfileModel.findOne({ userId }).lean();
  if (!profile?.stripeSubscriptionId) {
    return { cancelled: false };
  }

  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(profile.stripeSubscriptionId);

  await UserProfileModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        plan: "free",
      },
      $unset: {
        stripeSubscriptionId: "",
      },
    }
  );

  return { cancelled: true };
}

async function syncPlan(userId: string) {
  await connectToDatabase();
  const profile = await UserProfileModel.findOne({ userId }).lean();
  return { plan: (profile?.plan ?? "free") as UserPlan };
}

export const stripeBillingAdapter: BillingAdapter = {
  createCheckoutSession,
  cancelSubscription,
  syncPlan,
};
