import type { BillingAdapter } from "@/lib/billing/adapter";
import { noopBillingAdapter } from "@/lib/billing/noopBillingAdapter";
import { stripeBillingAdapter } from "@/lib/billing/stripeBillingAdapter";

export function getBillingAdapter(): BillingAdapter {
  if (process.env.STRIPE_SECRET_KEY) {
    return stripeBillingAdapter;
  }
  return noopBillingAdapter;
}
