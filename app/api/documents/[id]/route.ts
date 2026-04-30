import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { sanitizeDocumentSections } from "@/lib/editor/documentTransforms";
import { toJsonSafe } from "@/lib/mongo/jsonSafe";
import type { DocumentTone, DocumentType } from "@/lib/contracts/document";
import DocumentModel from "@/models/Document";
import { normalizeStyleTokens } from "@/lib/styleTokensNormalize";

export const runtime = "nodejs";

type DocumentIdParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: DocumentIdParams) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await connectToDatabase();
    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(id),
      userId: authenticatedUser.id,
    }).lean();

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const rawSections = doc.sections;
    const sections = sanitizeDocumentSections(
      Array.isArray(rawSections) ? rawSections : []
    );

    const styleTokens = normalizeStyleTokens(
      doc.styleTokens as Record<string, unknown> | undefined
    );

    const payload = toJsonSafe({
      _id: String(doc._id),
      title: doc.title,
      prompt: doc.prompt,
      tone: doc.tone as DocumentTone,
      docType: doc.docType as DocumentType,
      sections,
      liveDocHtml: doc.liveDocHtml ?? "",
      summary: doc.summary ?? "",
      styleTokens,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
