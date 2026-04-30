import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { getUsageSnapshot } from "@/lib/limits/usage";
import { ensureUserProfile, getUserPlan } from "@/lib/users/profile";
import { saveDocumentSchema } from "@/lib/validators";
import DocumentModel from "@/models/Document";
import ExportFileModel from "@/models/ExportFile";
import { toJsonSafe } from "@/lib/mongo/jsonSafe";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const [documents, exports, plan] = await Promise.all([
      DocumentModel.find({ userId: authenticatedUser.id })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
      ExportFileModel.find({ userId: authenticatedUser.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      getUserPlan(authenticatedUser.id),
    ]);

    let usageRaw: Awaited<ReturnType<typeof getUsageSnapshot>> | null = null;
    try {
      usageRaw = await getUsageSnapshot(authenticatedUser.id, plan);
    } catch (usageCause) {
      console.error("[api/documents] getUsageSnapshot failed:", usageCause);
    }

    const usage =
      usageRaw && typeof usageRaw === "object"
        ? usageRaw
        : {
            generateCount: 0,
            exportCount: 0,
            uploadCount: 0,
          };

    const payload = toJsonSafe({
      documents,
      exports,
      usage,
      plan,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load document history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    await ensureUserProfile(authenticatedUser);
    const body = await request.json();
    const parsed = saveDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid document payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = parsed.data;
    const update = {
      userId: authenticatedUser.id,
      userEmail: authenticatedUser.email,
      prompt: data.prompt ?? data.title,
      normalizedPrompt: data.prompt ?? data.title,
      humanizedPrompt: data.prompt ?? data.title,
      title: data.title,
      tone: data.tone,
      docType: data.docType,
      sections: data.sections,
      liveDocHtml: data.liveDocHtml ?? "",
      summary: data.summary ?? "",
      styleTokens: data.styleTokens,
      assets: data.assets ?? [],
    };

    let savedDocument;
    if (data.documentId && Types.ObjectId.isValid(data.documentId)) {
      savedDocument = await DocumentModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(data.documentId),
          userId: authenticatedUser.id,
        },
        { $set: update },
        { returnDocument: "after" }
      );
    }

    if (!savedDocument) {
      savedDocument = await DocumentModel.create(update);
    }

    return NextResponse.json({
      documentId: savedDocument.id,
      updatedAt: savedDocument.updatedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
