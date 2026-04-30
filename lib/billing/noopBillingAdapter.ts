import type { BillingAdapter, BillingCheckoutInput } from "@/lib/billing/adapter";

export const noopBillingAdapter: BillingAdapter = {
  async createCheckoutSession(input: BillingCheckoutInput) {
    const params = new URLSearchParams({
      userId: input.userId,
      plan: input.plan,
      mode: "stub",
    });
    return {
      checkoutUrl: `${input.successUrl}?${params.toString()}`,
    };
  },

  async cancelSubscription() {
    return { cancelled: true };
  },

  async syncPlan() {
    return { plan: "free" };
  },
};
