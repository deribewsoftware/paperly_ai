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

vi.mock("@/lib/langchain/prepDocumentContext", () => ({
  runPrepDocumentContext: vi.fn(),
}));

vi.mock("@/lib/tools/documentTitleTool", () => ({
  runDocumentTitleTool: vi.fn(),
}));

vi.mock("@/lib/tools/sectionBodyTool", () => ({
  runSectionBodyTool: vi.fn(),
}));

vi.mock("@/lib/tools/summarizerTool", () => ({
  runSummarizerTool: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/models/Document", () => ({
  default: {
    create: vi.fn(),
  },
}));

import { POST } from "@/app/api/generate/stream/route";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { runPrepDocumentContext } from "@/lib/langchain/prepDocumentContext";
import { runDocumentTitleTool } from "@/lib/tools/documentTitleTool";
import { runSectionBodyTool } from "@/lib/tools/sectionBodyTool";
import { runSummarizerTool } from "@/lib/tools/summarizerTool";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { getUserPlan } from "@/lib/users/profile";
import { DEFAULT_STYLE_TOKENS } from "@/lib/styleTokensNormalize";
import DocumentModel from "@/models/Document";

describe("POST /api/generate/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "";
  });

  it("returns NDJSON stream with init, sections, summary, done when authenticated", async () => {
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
    vi.mocked(runPrepDocumentContext).mockResolvedValue({
      docType: "report",
      tone: "professional",
      prompt: "xxxxxxxxxxxxNeed twenty chars",
      normalizedPrompt: "ok",
      humanizedPrompt: "ok",
      template: {
        docType: "report",
        displayName: "Report",
        titlePrefix: "Report",
        suggestedTheme: "corporate",
        defaultSections: [
          { title: "Overview", body: "role a" },
          { title: "Analysis", body: "role b" },
        ],
      },
      styleTokens: { ...DEFAULT_STYLE_TOKENS },
    });
    vi.mocked(runDocumentTitleTool).mockResolvedValue("Streamed Report");
    vi.mocked(runSectionBodyTool).mockImplementation(async ({ sectionTemplate }) => ({
      title: sectionTemplate.title,
      body: `Body for ${sectionTemplate.title}`,
    }));
    vi.mocked(runSummarizerTool).mockResolvedValue("Executive summary line.");
    vi.mocked(DocumentModel.create).mockResolvedValue({
      id: "doc-stream-1",
    } as never);
    vi.mocked(incrementUsage).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/generate/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "xxxxxxxxxxxxNeed twenty chars",
        tone: "professional",
        docType: "report",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")?.includes("ndjson")).toBe(true);

    const text = await response.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const types = lines.map((line) => (JSON.parse(line) as { type: string }).type);

    expect(types[0]).toBe("init");
    expect(types.filter((t) => t === "section").length).toBe(2);
    expect(types).toContain("summary");
    expect(types[types.length - 1]).toBe("done");

    const done = JSON.parse(lines[lines.length - 1]!) as {
      type: string;
      sections?: { title: string }[];
    };
    expect(done.sections?.length).toBe(2);
    expect(DocumentModel.create).toHaveBeenCalled();
    expect(incrementUsage).toHaveBeenCalled();
  });
});
