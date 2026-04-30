import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  sanitizeDocumentSections,
  sectionsToEditorHtml,
} from "@/lib/editor/documentTransforms";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { ensureUserProfile, getUserPlan } from "@/lib/users/profile";
import { runContinueDocumentTool } from "@/lib/tools/continueDocumentTool";
import { continueDocumentSchema } from "@/lib/validators";

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
    const parsed = continueDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, docType, tone, sections, prompt, hint, styleTokens, summary } =
      parsed.data;

    const newRaw = await runContinueDocumentTool({
      title,
      prompt: prompt ?? "",
      hint: hint ?? "",
      tone,
      docType,
      existingSections: sections,
    });

    const newSanitized = sanitizeDocumentSections(newRaw);
    const mergedSections = [...sections, ...newSanitized];
    const firstNewIndex = sections.length;
    const liveDocHtml = sectionsToEditorHtml(
      {
        title,
        summary,
        sections: mergedSections,
      },
      {
        pageBreakBeforeSectionIndexes:
          newSanitized.length > 0 && firstNewIndex > 0 ?
            [firstNewIndex]
          : undefined,
      }
    );

    try {
      await incrementUsage(authenticatedUser.id, plan, "generate");
    } catch (usageCause) {
      console.error("[api/generate/continue] incrementUsage failed:", usageCause);
    }

    return NextResponse.json({
      newSections: newSanitized,
      sections: mergedSections,
      liveDocHtml,
      styleTokens: styleTokens ?? undefined,
      usage: usageCheck,
      plan,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to continue document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
