import { NextResponse } from "next/server";
import { Types } from "mongoose";

import {
  exportToDocxBuffer,
  exportToPdfBuffer,
  exportToPptxBuffer,
} from "@/agents/exportAgent";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { ensureUserProfile, getUserPlan } from "@/lib/users/profile";
import { exportDocumentSchema } from "@/lib/validators";
import ExportFileModel from "@/models/ExportFile";

export const runtime = "nodejs";

function sanitizeFileName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
    const plan = await getUserPlan(authenticatedUser.id);

    if (plan === "free") {
      return NextResponse.json(
        {
          error: "Downloads require an active Pro subscription.",
          plan,
          upgradeRequired: true,
        },
        { status: 402 }
      );
    }

    const usageCheck = await enforceUsageLimit(authenticatedUser.id, plan, "export");

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Monthly export limit reached for your current plan.",
          usage: usageCheck,
          plan,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = exportDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid export payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      format,
      sections,
      docType,
      tone,
      theme,
      documentId,
      styleTokens,
    } =
      parsed.data;
    const payload = {
      title,
      sections,
      docType,
      tone,
      theme,
      styleTokens,
      generatedBy: authenticatedUser.name,
      generatedAt: new Date().toISOString(),
    };

    let fileBuffer: Buffer;
    let contentType = "";
    const extension = format;

    if (format === "pdf") {
      fileBuffer = await exportToPdfBuffer(payload);
      contentType = "application/pdf";
    } else if (format === "docx") {
      fileBuffer = await exportToDocxBuffer(payload);
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else {
      fileBuffer = await exportToPptxBuffer(payload);
      contentType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    }

    const fileName = `${sanitizeFileName(title) || "paperly-document"}.${extension}`;
    let cloudinaryUrl: string | undefined;
    let cloudinaryPublicId: string | undefined;

    if (isCloudinaryConfigured()) {
      try {
        const uploaded = await uploadBufferToCloudinary({
          buffer: fileBuffer,
          folder: "paperly_ai/exports",
          publicId: `${sanitizeFileName(title)}-${Date.now()}`,
          resourceType: "raw",
          mimeType: contentType,
        });
        cloudinaryUrl = uploaded.secure_url;
        cloudinaryPublicId = uploaded.public_id;
      } catch {
        // Export should still succeed if cloud upload fails.
      }
    }

    try {
      await connectToDatabase();
      await ExportFileModel.create({
        userId: authenticatedUser.id,
        userEmail: authenticatedUser.email,
        documentId:
          documentId && Types.ObjectId.isValid(documentId)
            ? new Types.ObjectId(documentId)
            : undefined,
        title,
        docType: docType ?? "report",
        format,
        theme: styleTokens?.theme ?? theme ?? "corporate",
        bytes: fileBuffer.byteLength,
        contentType,
        fileName,
        cloudinaryUrl,
        cloudinaryPublicId,
      });
    } catch {
      // Continue when persistence is unavailable.
    }

    await incrementUsage(authenticatedUser.id, plan, "export");

    return new NextResponse(fileBuffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Paperly-Plan": plan,
        "X-Paperly-Usage-Remaining": `${usageCheck.remaining}`,
        ...(cloudinaryUrl ? { "X-Paperly-Cloudinary-Url": cloudinaryUrl } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
