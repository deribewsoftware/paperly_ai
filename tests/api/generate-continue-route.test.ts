import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/users/profile", () => ({
  ensureUserProfile: vi.fn(),
  getUserPlan: vi.fn(),
}));

vi.mock("@/lib/limits/usage", () => ({
  enforceUsageLimit: vi.fn(),
  incrementUsage: vi.fn(),
}));

vi.mock("@/lib/tools/continueDocumentTool", () => ({
  runContinueDocumentTool: vi.fn(),
}));

import { POST } from "@/app/api/generate/continue/route";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { runContinueDocumentTool } from "@/lib/tools/continueDocumentTool";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { getUserPlan } from "@/lib/users/profile";

describe("POST /api/generate/continue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns merged sections and HTML with page break before new sections", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "Paperly User",
    });
    vi.mocked(getUserPlan).mockResolvedValue("free");
    vi.mocked(enforceUsageLimit).mockResolvedValue({
      allowed: true,
      used: 0,
      limit: 50,
      remaining: 50,
    });
    vi.mocked(runContinueDocumentTool).mockResolvedValue([
      { title: "Next steps", body: "Extended content." },
    ]);
    vi.mocked(incrementUsage).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/generate/continue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Doc",
        docType: "report",
        tone: "professional",
        sections: [{ title: "Overview", body: "First page." }],
        summary: "Sum",
        prompt: "xxxxxxxxxxxxNeed twenty chars",
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as {
      sections: { title: string }[];
      liveDocHtml: string;
    };

    expect(response.status).toBe(200);
    expect(data.sections.length).toBe(2);
    expect(data.liveDocHtml).toContain("data-page-break");
    expect(runContinueDocumentTool).toHaveBeenCalled();
  });
});
