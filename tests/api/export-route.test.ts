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

vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/models/ExportFile", () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  isCloudinaryConfigured: vi.fn(() => false),
  uploadBufferToCloudinary: vi.fn(),
}));

import { POST } from "@/app/api/export/route";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { getUserPlan } from "@/lib/users/profile";
import ExportFileModel from "@/models/ExportFile";

describe("POST /api/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test",
        format: "pdf",
        sections: [{ title: "Intro", body: "Sample body text." }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("blocks download for free plan", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "Paperly User",
    });
    vi.mocked(getUserPlan).mockResolvedValue("free");

    const request = new Request("http://localhost/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Validation Document",
        format: "pdf",
        docType: "report",
        tone: "professional",
        theme: "corporate",
        sections: [{ title: "Intro", body: "Sample body text." }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(402);
  });

  it("returns downloadable file when authenticated as pro", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "Paperly User",
    });
    vi.mocked(getUserPlan).mockResolvedValue("pro");
    vi.mocked(enforceUsageLimit).mockResolvedValue({
      allowed: true,
      used: 1,
      limit: 1000,
      remaining: 999,
    });
    vi.mocked(incrementUsage).mockResolvedValue(undefined);
    vi.mocked(ExportFileModel.create).mockResolvedValue({ id: "exp-1" } as never);

    const request = new Request("http://localhost/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Validation Document",
        format: "pdf",
        docType: "report",
        tone: "professional",
        theme: "corporate",
        sections: [{ title: "Intro", body: "Sample body text." }],
      }),
    });

    const response = await POST(request);
    const fileBytes = (await response.arrayBuffer()).byteLength;

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/pdf");
    expect(fileBytes).toBeGreaterThan(300);
    expect(ExportFileModel.create).toHaveBeenCalled();
  });
});
