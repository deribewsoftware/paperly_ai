import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { runDocumentOrchestrator } from "@/lib/langchain/orchestrator";
import { sanitizeDocumentSections, sectionsToEditorHtml } from "@/lib/editor/documentTransforms";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { ensureUserProfile, getUserPlan } from "@/lib/users/profile";
import { generateDocumentSchema } from "@/lib/validators";
import DocumentModel from "@/models/Document";

export const runtime = "nodejs";

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
    const usageCheck = await enforceUsageLimit(
      authenticatedUser.id,
      plan,
      "generate"
    );

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Monthly generate limit reached for your current plan.",
          usage: usageCheck,
          plan,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = generateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const orchestrated = await runDocumentOrchestrator(parsed.data);
    const safeTitle =
      typeof orchestrated.title === "string" && orchestrated.title.trim() ?
        orchestrated.title.trim().slice(0, 200)
      : "Untitled document";

    const sanitizedSections = sanitizeDocumentSections(orchestrated.sections);
    const liveDocHtml = sectionsToEditorHtml({
      title: safeTitle,
      summary:
        typeof orchestrated.summary === "string" ?
          orchestrated.summary
        : undefined,
      sections:
        sanitizedSections.length > 0 ?
          sanitizedSections
        : [{ title: "Introduction", body: parsed.data.prompt.slice(0, 4000) }],
    });

    const sectionsForPersist =
      sanitizedSections.length > 0 ?
        sanitizedSections
      : [{ title: "Introduction", body: parsed.data.prompt.slice(0, 120_000) }];
    let documentId: string | null = null;

    try {
      await connectToDatabase();
      const saved = await DocumentModel.create({
        userId: authenticatedUser.id,
        userEmail: authenticatedUser.email,
        prompt: orchestrated.prompt,
        normalizedPrompt: orchestrated.normalizedPrompt,
        humanizedPrompt: orchestrated.humanizedPrompt,
        tone: orchestrated.tone,
        docType: orchestrated.docType,
        title: safeTitle,
        sections: sectionsForPersist,
        liveDocHtml,
        summary:
          typeof orchestrated.summary === "string" ?
            orchestrated.summary
          : "",
        styleTokens: orchestrated.styleTokens,
        assets: orchestrated.assets,
      });
      documentId = saved.id;
    } catch (dbCause) {
      console.error("[api/generate] DocumentModel.create failed:", dbCause);
    }

    try {
      await incrementUsage(authenticatedUser.id, plan, "generate");
    } catch (usageCause) {
      console.error("[api/generate] incrementUsage failed:", usageCause);
    }

    return NextResponse.json({
      title: safeTitle,
      docType: orchestrated.docType,
      sections: sectionsForPersist,
      summary:
        typeof orchestrated.summary === "string" ?
          orchestrated.summary
        : "",
      styleTokens: orchestrated.styleTokens,
      liveDocHtml,
      documentId,
      generatedAt: orchestrated.generatedAt,
      usage: usageCheck,
      plan,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
