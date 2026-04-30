import type { UserPlan } from "@/lib/limits/plans";

export type BillingCheckoutInput = {
  userId: string;
  plan: Exclude<UserPlan, "free">;
  successUrl: string;
  cancelUrl: string;
};

export type BillingAdapter = {
  createCheckoutSession(input: BillingCheckoutInput): Promise<{
    checkoutUrl: string;
  }>;
  cancelSubscription(userId: string): Promise<{ cancelled: boolean }>;
  syncPlan(userId: string): Promise<{ plan: UserPlan }>;
};
