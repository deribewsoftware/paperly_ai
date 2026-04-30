import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { connectToDatabase } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripeBillingAdapter";
import UserProfileModel from "@/models/UserProfile";

export const runtime = "nodejs";

function planFromMetadata(rawValue: string | null | undefined) {
  if (rawValue === "team" || rawValue === "enterprise") {
    return rawValue;
  }
  return "pro";
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  try {
    const rawBody = await request.text();
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    await connectToDatabase();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id;
      if (userId) {
        await UserProfileModel.findOneAndUpdate(
          { userId },
          {
            $set: {
              plan: planFromMetadata(session.metadata?.plan),
              stripeCustomerId:
                typeof session.customer === "string" ? session.customer : undefined,
              stripeSubscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : undefined,
            },
          }
        );
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const active = subscription.status === "active" || subscription.status === "trialing";
      await UserProfileModel.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          $set: {
            plan: active ? "pro" : "free",
          },
        }
      );
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await UserProfileModel.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          $set: { plan: "free" },
          $unset: { stripeSubscriptionId: "" },
        }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
