import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { getBillingAdapter } from "@/lib/billing";
import { ensureUserProfile } from "@/lib/users/profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    await ensureUserProfile(authenticatedUser);
    const body = (await request.json().catch(() => ({}))) as {
      plan?: "pro" | "team" | "enterprise";
    };
    const selectedPlan = body.plan ?? "pro";

    const origin =
      request.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";

    const adapter = getBillingAdapter();
    const checkout = await adapter.createCheckoutSession({
      userId: authenticatedUser.id,
      plan: selectedPlan,
      successUrl: `${origin}/?checkout=success`,
      cancelUrl: `${origin}/?checkout=cancelled`,
    });

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
