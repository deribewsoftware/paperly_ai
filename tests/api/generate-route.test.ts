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

vi.mock("@/lib/langchain/orchestrator", () => ({
  runDocumentOrchestrator: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/models/Document", () => ({
  default: {
    create: vi.fn(),
  },
}));

import { POST } from "@/app/api/generate/route";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { runDocumentOrchestrator } from "@/lib/langchain/orchestrator";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { getUserPlan } from "@/lib/users/profile";
import { DEFAULT_STYLE_TOKENS } from "@/lib/styleTokensNormalize";
import DocumentModel from "@/models/Document";

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Create proposal for logistics startup in Addis Ababa",
        tone: "professional",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns generated document payload when authenticated", async () => {
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
    vi.mocked(runDocumentOrchestrator).mockResolvedValue({
      title: "Professional Business Proposal",
      prompt: "Create proposal",
      normalizedPrompt: "Create a proposal",
      humanizedPrompt: "Create a professional proposal",
      docType: "proposal",
      tone: "professional",
      sections: [{ title: "Executive Summary", body: "Summary body." }],
      summary: "A concise business proposal summary.",
      styleTokens: { ...DEFAULT_STYLE_TOKENS },
      assets: [],
      generatedAt: new Date().toISOString(),
    });
    vi.mocked(DocumentModel.create).mockResolvedValue({
      id: "doc-1",
    } as never);
    vi.mocked(incrementUsage).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Create proposal for logistics startup in Addis Ababa",
        tone: "professional",
        docType: "proposal",
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as {
      title: string;
      docType: string;
      sections: { title: string; body: string }[];
    };

    expect(response.status).toBe(200);
    expect(data.title).toBe("Professional Business Proposal");
    expect(data.docType).toBe("proposal");
    expect(data.sections.length).toBe(1);
    expect(runDocumentOrchestrator).toHaveBeenCalled();
    expect(DocumentModel.create).toHaveBeenCalled();
  });
});
