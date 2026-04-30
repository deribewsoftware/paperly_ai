import { sanitizeDocumentSections, sectionsToEditorHtml } from "@/lib/editor/documentTransforms";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { runPrepDocumentContext } from "@/lib/langchain/prepDocumentContext";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { ensureUserProfile, getUserPlan } from "@/lib/users/profile";
import { runDocumentTitleTool } from "@/lib/tools/documentTitleTool";
import { runSectionBodyTool } from "@/lib/tools/sectionBodyTool";
import { runSummarizerTool } from "@/lib/tools/summarizerTool";
import { generateDocumentSchema } from "@/lib/validators";
import DocumentModel from "@/models/Document";

export const runtime = "nodejs";

function ndjsonResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUser();
  if (!authenticatedUser) {
    return ndjsonResponse(
      `${JSON.stringify({ type: "error", message: "Authentication required." })}\n`,
      401
    );
  }

  let parsedBody;
  try {
    parsedBody = await request.json();
  } catch {
    return ndjsonResponse(
      `${JSON.stringify({ type: "error", message: "Invalid JSON body." })}\n`,
      400
    );
  }

  const parsed = generateDocumentSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return ndjsonResponse(
      `${JSON.stringify({
        type: "error",
        message: "Invalid request.",
        details: parsed.error.flatten(),
      })}\n`,
      400
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      try {
        await ensureUserProfile(authenticatedUser);
        const plan = await getUserPlan(authenticatedUser.id);
        const usageCheck = await enforceUsageLimit(
          authenticatedUser.id,
          plan,
          "generate"
        );

        if (!usageCheck.allowed) {
          write({
            type: "error",
            message: "Monthly generate limit reached for your current plan.",
            usage: usageCheck,
            plan,
          });
          controller.close();
          return;
        }

        const prep = await runPrepDocumentContext(parsed.data);
        const safeTitleRaw = await runDocumentTitleTool({
          humanizedPrompt: prep.humanizedPrompt,
          tone: prep.tone,
          docType: prep.docType,
          template: prep.template,
        });
        const safeTitle =
          safeTitleRaw.trim().slice(0, 200) || "Untitled document";

        const sectionCount = prep.template.defaultSections.length;
        write({
          type: "init",
          docType: prep.docType,
          tone: prep.tone,
          styleTokens: prep.styleTokens,
          sectionCount,
          title: safeTitle,
        });

        const builtSections: ReturnType<typeof sanitizeDocumentSections> = [];

        /* eslint-disable no-await-in-loop */
        for (let i = 0; i < sectionCount; i++) {
          const rawSection = await runSectionBodyTool({
            humanizedPrompt: prep.humanizedPrompt,
            tone: prep.tone,
            docType: prep.docType,
            template: prep.template,
            sectionIndex: i,
            sectionTemplate: prep.template.defaultSections[i],
            completedSections: builtSections,
          });
          const sanitized = sanitizeDocumentSections([rawSection])[0];
          builtSections.push(sanitized);

          const liveDocHtmlPartial = sectionsToEditorHtml({
            title: safeTitle,
            sections: builtSections,
          });
          write({
            type: "section",
            index: i,
            section: sanitized,
            liveDocHtml: liveDocHtmlPartial,
          });
        }
        /* eslint-enable no-await-in-loop */

        const summary = await runSummarizerTool({
          title: safeTitle,
          tone: prep.tone,
          sections: builtSections,
        });

        const liveDocHtml = sectionsToEditorHtml({
          title: safeTitle,
          summary,
          sections: builtSections,
        });

        write({ type: "summary", summary });

        let documentId: string | null = null;
        try {
          await connectToDatabase();
          const saved = await DocumentModel.create({
            userId: authenticatedUser.id,
            userEmail: authenticatedUser.email,
            prompt: prep.prompt,
            normalizedPrompt: prep.normalizedPrompt,
            humanizedPrompt: prep.humanizedPrompt,
            tone: prep.tone,
            docType: prep.docType,
            title: safeTitle,
            sections: builtSections,
            liveDocHtml,
            summary,
            styleTokens: prep.styleTokens,
            assets: [],
          });
          documentId = saved.id;
        } catch (dbCause) {
          console.error("[api/generate/stream] DocumentModel.create failed:", dbCause);
        }

        try {
          await incrementUsage(authenticatedUser.id, plan, "generate");
        } catch (usageCause) {
          console.error("[api/generate/stream] incrementUsage failed:", usageCause);
        }

        write({
          type: "done",
          documentId,
          title: safeTitle,
          docType: prep.docType,
          sections: builtSections,
          summary,
          styleTokens: prep.styleTokens,
          liveDocHtml,
          generatedAt: new Date().toISOString(),
          usage: usageCheck,
          plan,
        });
      } catch (error) {
        write({
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to generate document.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
