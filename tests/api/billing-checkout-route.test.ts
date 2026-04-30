import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/users/profile", () => ({
  ensureUserProfile: vi.fn(),
}));

vi.mock("@/lib/billing", () => ({
  getBillingAdapter: vi.fn(),
}));

import { POST } from "@/app/api/billing/checkout/route";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getBillingAdapter } from "@/lib/billing";

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "pro" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns checkout URL for authenticated user", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User",
    });
    vi.mocked(getBillingAdapter).mockReturnValue({
      createCheckoutSession: vi
        .fn()
        .mockResolvedValue({ checkoutUrl: "https://checkout.test/abc" }),
      cancelSubscription: vi.fn().mockResolvedValue({ cancelled: false }),
      syncPlan: vi.fn().mockResolvedValue({ plan: "free" }),
    });

    const request = new Request("http://localhost/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({ plan: "pro" }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { checkoutUrl?: string };
    expect(response.status).toBe(200);
    expect(data.checkoutUrl).toBe("https://checkout.test/abc");
  });
});
