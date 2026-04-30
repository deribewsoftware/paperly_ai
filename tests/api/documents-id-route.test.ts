import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/models/Document", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import { GET } from "@/app/api/documents/[id]/route";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import DocumentModel from "@/models/Document";

const testUser = { id: "user-1", email: "u@example.com", name: "U" };

describe("GET /api/documents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/documents/x"), {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when id is not a valid ObjectId", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(testUser);
    const response = await GET(new Request("http://localhost/api/documents/bad"), {
      params: Promise.resolve({ id: "not-an-object-id" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 404 when document is missing", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(testUser);
    vi.mocked(DocumentModel.findOne).mockReturnValue({
      lean: () => Promise.resolve(null),
    } as never);
    const response = await GET(new Request("http://localhost/api/documents/x"), {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    });
    expect(connectToDatabase).toHaveBeenCalled();
    expect(response.status).toBe(404);
  });

  it("returns 200 with studio payload when document exists", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(testUser);
    const styleTokens = {
      theme: "corporate" as const,
      accentColor: "#000",
      headingFont: "Arial",
      bodyFont: "Calibri",
      headingSize: 30,
      bodySize: 13,
      lineHeight: 1.6,
      contentWidth: "normal" as const,
      includeCoverPage: true,
      includeToc: true,
    };
    vi.mocked(DocumentModel.findOne).mockReturnValue({
      lean: () =>
        Promise.resolve({
          _id: "507f1f77bcf86cd799439011",
          title: "My Doc",
          prompt: "Brief",
          tone: "professional",
          docType: "proposal",
          sections: [{ title: "Intro", body: "Hello" }],
          liveDocHtml: "<h1>My Doc</h1>",
          summary: "Sum",
          styleTokens,
        }),
    } as never);

    const response = await GET(new Request("http://localhost/api/documents/x"), {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body._id).toBe("507f1f77bcf86cd799439011");
    expect(body.title).toBe("My Doc");
    expect(body.prompt).toBe("Brief");
    expect(body.tone).toBe("professional");
    expect(body.docType).toBe("proposal");
    expect(Array.isArray(body.sections)).toBe(true);
    expect(body.liveDocHtml).toBe("<h1>My Doc</h1>");
    expect(body.summary).toBe("Sum");
    expect(body.styleTokens).toMatchObject({ theme: "corporate", pageSize: "a3" });
  });
});
