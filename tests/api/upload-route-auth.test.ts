import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(async () => null),
}));

import { POST } from "@/app/api/upload/route";

describe("POST /api/upload auth guard", () => {
  it("returns 401 when not signed in", async () => {
    const payload = new FormData();
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: payload,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
