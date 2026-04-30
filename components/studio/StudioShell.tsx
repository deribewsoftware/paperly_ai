"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { FaWandSparkles } from "react-icons/fa6";

import { AuthControls } from "@/components/auth-controls";
import { AppThemeToggle } from "@/components/studio/AppThemeToggle";
import { ExportPanel } from "@/components/studio/ExportPanel";
import { HistoryPanel } from "@/components/studio/HistoryPanel";
import { InsightsPanel } from "@/components/studio/InsightsPanel";
import { LivePreviewSkeleton } from "@/components/studio/LivePreviewSkeleton";
import type { PreviewPanelProps } from "@/components/studio/PreviewPanel";
import { PromptPanel } from "@/components/studio/PromptPanel";
import { PageLayoutControls } from "@/components/studio/PageLayoutControls";
import { SubscriptionPanel } from "@/components/studio/SubscriptionPanel";
import { ThemeControls } from "@/components/studio/ThemeControls";
import { TypographyControls } from "@/components/studio/TypographyControls";
import {
  appendContinuedDocument,
  applyLiveDraft,
  loadStoredDocument,
  patchStyleTokens,
  setDocumentId,
  setDocType,
  setGeneratedDocument,
  setGenerationError,
  setLiveDocHtml,
  setPrompt,
  setStreamPartialDocument,
  setTone,
  startGeneration,
} from "@/features/document/documentSlice";
import {
  setExportError,
  setExportSuccess,
  startExport,
  type ExportFormat,
} from "@/features/export/exportSlice";
import {
  incrementDocumentsGenerated,
  setPlan,
  setUsageSnapshot,
} from "@/features/user/userSlice";
import type {
  DocumentSection,
  DocumentTone,
  DocumentType,
  StyleTokens,
} from "@/lib/contracts/document";
import { sectionsToEditorHtml, editorHtmlToDraft } from "@/lib/editor/documentTransforms";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";

const PreviewPanelClient = dynamic<PreviewPanelProps>(
  () =>
    import("@/components/studio/PreviewPanel").then((mod) => ({
      default: mod.PreviewPanel,
    })),
  {
    ssr: false,
    loading: LivePreviewSkeleton,
  }
);

type HistoryItem = {
  _id: string;
  title: string;
  docType: string;
  createdAt: string;
};

type StoredDocumentResponse = {
  _id: string;
  title: string;
  prompt: string;
  tone: DocumentTone;
  docType: DocumentType;
  sections: DocumentSection[];
  liveDocHtml: string;
  summary?: string;
  styleTokens: StyleTokens;
};

type HistoryBusy =
  | { documentId: string; mode: "open" }
  | { documentId: string; mode: ExportFormat };

async function fetchStoredDocument(id: string): Promise<StoredDocumentResponse> {
  const response = await fetch(`/api/documents/${id}`);
  const data = (await response.json()) as { error?: string } & Partial<StoredDocumentResponse>;
  if (!response.ok) {
    throw new Error(data.error ?? "Could not load document.");
  }
  if (
    !data._id ||
    typeof data.title !== "string" ||
    typeof data.prompt !== "string" ||
    !data.styleTokens ||
    !Array.isArray(data.sections)
  ) {
    throw new Error("Invalid document response.");
  }
  return data as StoredDocumentResponse;
}

export function StudioShell() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const dispatch = useAppDispatch();
  const {
    prompt,
    documentId,
    liveDocHtml,
    docType,
    tone,
    title,
    summary,
    sections,
    styleTokens,
    isGenerating,
    error,
  } = useAppSelector((state) => state.document);
  const { isExporting } = useAppSelector((state) => state.export);
  const { plan, usage } = useAppSelector((state) => state.user);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyBusy, setHistoryBusy] = useState<HistoryBusy | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [lastUploadedImage, setLastUploadedImage] = useState<string | undefined>();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saveStatus, setSaveStatus] = useState("");
  const [upgradeStatus, setUpgradeStatus] = useState("");

  const applyPaperlyAppearance = useCallback((next: "light" | "dark") => {
    setTheme(next);
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem("paperly-theme", next);
    } catch {
      //
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }
      try {
        const next =
          window.localStorage.getItem("paperly-theme") === "dark" ? "dark" : "light";
        applyPaperlyAppearance(next);
      } catch {
        applyPaperlyAppearance("light");
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [applyPaperlyAppearance]);


  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }

    try {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        documents?: HistoryItem[];
        usage?: {
          generateCount: number;
          exportCount: number;
          uploadCount: number;
        };
        plan?: "free" | "pro" | "team" | "enterprise";
      };

      setHistory(data.documents ?? []);
      if (data.usage) {
        dispatch(setUsageSnapshot(data.usage));
      }
      if (data.plan) {
        dispatch(setPlan(data.plan));
      }
    } catch {
      // Ignore history failures.
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          setHistory([]);
        }
        return;
      }

      try {
        const response = await fetch("/api/documents");
        if (!response.ok || cancelled) {
          return;
        }
        const data = (await response.json()) as {
          documents?: HistoryItem[];
          usage?: {
            generateCount: number;
            exportCount: number;
            uploadCount: number;
          };
          plan?: "free" | "pro" | "team" | "enterprise";
        };
        if (!cancelled) {
          setHistory(data.documents ?? []);
        }
        if (!cancelled && data.usage) {
          dispatch(setUsageSnapshot(data.usage));
        }
        if (!cancelled && data.plan) {
          dispatch(setPlan(data.plan));
        }
      } catch {
        // Ignore bootstrap fetch issues.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated]);

  const chartData = useMemo(
    () =>
      sections.map((section) => ({
        section: section.title.slice(0, 16),
        size: section.body.length,
      })),
    [sections]
  );

  const handleGenerate = async () => {
    dispatch(startGeneration());
    try {
      const response = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          docType,
          tone,
        }),
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        const firstLine = text.trim().split("\n")[0] ?? "";
        let message = "Generation failed.";
        if (firstLine) {
          try {
            const parsed = JSON.parse(firstLine) as { message?: string };
            if (parsed.message) {
              message = parsed.message;
            }
          } catch {
            message = text || message;
          }
        }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamTitle = title;
      let accumulated: typeof sections = [];
      let streamSummary: string | undefined;
      let lastDocType = docType;
      let lastStyleTokens = styleTokens;

      const handleMessage = (raw: string) => {
        let msg: {
          type: string;
          message?: string;
          title?: string;
          docType?: DocumentType;
          styleTokens?: typeof styleTokens;
          index?: number;
          section?: (typeof sections)[number];
          liveDocHtml?: string;
          summary?: string;
          documentId?: string;
          sections?: typeof sections;
          plan?: "free" | "pro" | "team" | "enterprise";
          generatedAt?: string;
        };
        try {
          msg = JSON.parse(raw) as typeof msg;
        } catch {
          return;
        }

        if (msg.type === "error") {
          throw new Error(msg.message ?? "Generation failed.");
        }

        if (msg.type === "init") {
          if (msg.title) {
            streamTitle = msg.title;
          }
          if (msg.docType) {
            lastDocType = msg.docType;
          }
          if (msg.styleTokens) {
            lastStyleTokens = msg.styleTokens;
          }
          dispatch(
            setStreamPartialDocument({
              title: streamTitle,
              sections: [],
              liveDocHtml: sectionsToEditorHtml({
                title: streamTitle,
                sections: [],
              }),
              docType: msg.docType,
              styleTokens: msg.styleTokens,
            })
          );
        }

        if (
          msg.type === "section" &&
          msg.section &&
          typeof msg.index === "number"
        ) {
          accumulated = [...accumulated.slice(0, msg.index), msg.section];
          if (msg.liveDocHtml) {
            dispatch(
              setStreamPartialDocument({
                title: streamTitle,
                sections: accumulated,
                summary: streamSummary,
                liveDocHtml: msg.liveDocHtml,
                docType: lastDocType,
                styleTokens: lastStyleTokens,
              })
            );
          }
        }

        if (msg.type === "summary" && typeof msg.summary === "string") {
          streamSummary = msg.summary;
          dispatch(
            setStreamPartialDocument({
              title: streamTitle,
              sections: accumulated,
              summary: streamSummary,
              liveDocHtml: sectionsToEditorHtml({
                title: streamTitle,
                summary: streamSummary,
                sections: accumulated,
              }),
              docType: lastDocType,
              styleTokens: lastStyleTokens,
            })
          );
        }

        if (msg.type === "done") {
          if (msg.title) {
            streamTitle = msg.title;
          }
          if (msg.sections?.length) {
            accumulated = msg.sections;
          }
          if (msg.summary !== undefined) {
            streamSummary = msg.summary;
          }
          const finalHtml =
            msg.liveDocHtml ??
            sectionsToEditorHtml({
              title: streamTitle,
              summary: streamSummary,
              sections: accumulated,
            });
          dispatch(
            setGeneratedDocument({
              documentId: msg.documentId,
              liveDocHtml: finalHtml,
              title: streamTitle,
              docType: msg.docType ?? lastDocType,
              summary: streamSummary,
              styleTokens: msg.styleTokens ?? lastStyleTokens,
              sections: accumulated,
            })
          );
          if (msg.plan) {
            dispatch(setPlan(msg.plan));
          }
          dispatch(incrementDocumentsGenerated());
          void refreshHistory();
        }
      };

      const flushBuffer = (add: string) => {
        buffer += add;
        for (;;) {
          const newline = buffer.indexOf("\n");
          if (newline < 0) {
            break;
          }
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) {
            continue;
          }
          handleMessage(line);
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        flushBuffer(decoder.decode(value, { stream: true }));
      }
      const tail = buffer.trim();
      if (tail) {
        handleMessage(tail);
      }
    } catch (cause) {
      dispatch(
        setGenerationError(
          cause instanceof Error ? cause.message : "Failed to generate document."
        )
      );
    }
  };

  const handleContinueDocument = async () => {
    if (!isAuthenticated || sections.length === 0) {
      return;
    }
    dispatch(startGeneration());
    try {
      const response = await fetch("/api/generate/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          title,
          docType,
          tone,
          sections,
          summary,
          styleTokens,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        sections?: typeof sections;
        liveDocHtml?: string;
        plan?: "free" | "pro" | "team" | "enterprise";
      };

      if (!response.ok || !data.sections || !data.liveDocHtml) {
        throw new Error(data.error ?? "Continue failed.");
      }

      dispatch(
        appendContinuedDocument({
          sections: data.sections,
          liveDocHtml: data.liveDocHtml,
        })
      );
      if (data.plan) {
        dispatch(setPlan(data.plan));
      }
      dispatch(incrementDocumentsGenerated());
      await refreshHistory();
    } catch (cause) {
      dispatch(
        setGenerationError(
          cause instanceof Error ? cause.message : "Failed to continue document."
        )
      );
    }
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleUpgradeToPro = async () => {
    if (!isAuthenticated) {
      return;
    }

    setUpgradeStatus("Redirecting to secure checkout...");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = (await response.json()) as {
        error?: string;
        checkoutUrl?: string;
      };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Unable to start checkout.");
      }
      window.location.href = data.checkoutUrl;
    } catch (cause) {
      setUpgradeStatus(
        cause instanceof Error ? cause.message : "Could not open checkout."
      );
    }
  };

  const handleExport = async (format: ExportFormat) => {
    dispatch(startExport());
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          format,
          docType,
          tone,
          theme: styleTokens.theme,
          documentId,
          styleTokens,
          sections,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as {
          error?: string;
          upgradeRequired?: boolean;
        };
        if (response.status === 402 || data.upgradeRequired) {
          setUpgradeStatus("Upgrade to Pro to download files.");
        }
        throw new Error(data.error ?? "Export failed.");
      }

      const blob = await response.blob();
      const fileName = `${title.replace(/\s+/g, "_").toLowerCase()}.${format}`;
      downloadFile(blob, fileName);
      dispatch(setExportSuccess(format));
      await refreshHistory();
    } catch (cause) {
      dispatch(
        setExportError(cause instanceof Error ? cause.message : "Failed to export.")
      );
    }
  };

  const handleOpenDocument = async (id: string) => {
    setHistoryBusy({ documentId: id, mode: "open" });
    try {
      const data = await fetchStoredDocument(id);
      const html =
        data.liveDocHtml?.trim() ?
          data.liveDocHtml
        : sectionsToEditorHtml({
            title: data.title,
            summary: data.summary,
            sections: data.sections,
          });
      dispatch(
        loadStoredDocument({
          documentId: data._id,
          prompt: data.prompt,
          title: data.title,
          docType: data.docType,
          tone: data.tone,
          sections: data.sections,
          liveDocHtml: html,
          summary: data.summary,
          styleTokens: data.styleTokens,
        })
      );
    } catch (cause) {
      dispatch(
        setGenerationError(
          cause instanceof Error ? cause.message : "Failed to open document."
        )
      );
    } finally {
      setHistoryBusy(null);
    }
  };

  const handleExportFromHistory = async (id: string, format: ExportFormat) => {
    setHistoryBusy({ documentId: id, mode: format });
    dispatch(startExport());
    try {
      const data = await fetchStoredDocument(id);
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          format,
          docType: data.docType,
          tone: data.tone,
          theme: data.styleTokens.theme,
          documentId: data._id,
          styleTokens: data.styleTokens,
          sections: data.sections,
        }),
      });

      if (!response.ok) {
        const errBody = (await response.json()) as {
          error?: string;
          upgradeRequired?: boolean;
        };
        if (response.status === 402 || errBody.upgradeRequired) {
          setUpgradeStatus("Upgrade to Pro to download files.");
        }
        throw new Error(errBody.error ?? "Export failed.");
      }

      const blob = await response.blob();
      const fileName = `${data.title.replace(/\s+/g, "_").toLowerCase()}.${format}`;
      downloadFile(blob, fileName);
      dispatch(setExportSuccess(format));
      await refreshHistory();
    } catch (cause) {
      dispatch(
        setExportError(cause instanceof Error ? cause.message : "Failed to export.")
      );
    } finally {
      setHistoryBusy(null);
    }
  };

  const handlePreviewChange = useCallback(
    (nextHtml: string) => {
      dispatch(setLiveDocHtml(nextHtml));
      const draft = editorHtmlToDraft(nextHtml, {
        title,
        summary,
        sections,
      });
      dispatch(applyLiveDraft(draft));
    },
    [dispatch, sections, summary, title]
  );

  const handleSaveDocument = async () => {
    if (!isAuthenticated) {
      return;
    }

    setSaveStatus("Saving...");
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          title,
          prompt,
          liveDocHtml,
          summary,
          docType,
          tone,
          sections,
          styleTokens,
          assets: sections.flatMap((section) =>
            (section.images ?? []).map((image) => image.url)
          ),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        documentId?: string;
      };

      if (!response.ok || !data.documentId) {
        throw new Error(data.error ?? "Failed to save document.");
      }

      dispatch(setDocumentId(data.documentId));
      setSaveStatus("Saved");
      await refreshHistory();
    } catch (cause) {
      setSaveStatus(cause instanceof Error ? cause.message : "Save failed");
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadStatus("Uploading image...");

    const payload = new FormData();
    payload.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json()) as {
        secureUrl?: string;
        error?: string;
        plan?: "free" | "pro" | "team" | "enterprise";
      };

      if (!response.ok || !data.secureUrl) {
        throw new Error(data.error ?? "Image upload failed.");
      }

      setLastUploadedImage(data.secureUrl);
      setUploadStatus(`Uploaded: ${data.secureUrl}`);
      if (data.plan) {
        dispatch(setPlan(data.plan));
      }
    } catch (cause) {
      setUploadStatus(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_45%),linear-gradient(to_bottom,#f8fafc,#eef2ff)] px-4 py-6 text-slate-900 dark:bg-[radial-gradient(circle_at_top,#0f172a,transparent_40%),linear-gradient(to_bottom,#020617,#0b1220)] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FaWandSparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-2xl font-bold">Paperly AI Studio</h1>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                AI-first workspace with A3 live editing, responsive design, and Pro
                export downloads.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AppThemeToggle
                theme={theme}
                onToggle={() =>
                  applyPaperlyAppearance(theme === "dark" ? "light" : "dark")
                }
              />
              <AuthControls />
              <button
                type="button"
                onClick={handleSaveDocument}
                disabled={!isAuthenticated || sections.length === 0}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Save Document
              </button>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {saveStatus ? (
              <p className="text-xs text-slate-600 dark:text-slate-300">{saveStatus}</p>
            ) : null}
            {upgradeStatus ? (
              <p className="text-xs text-indigo-600 dark:text-indigo-300">
                {upgradeStatus}
              </p>
            ) : null}
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-3">
            <PromptPanel
              prompt={prompt}
              docType={docType}
              tone={tone}
              isGenerating={isGenerating}
              isAuthenticated={isAuthenticated}
              uploadStatus={uploadStatus}
              onPromptChange={(value) => dispatch(setPrompt(value))}
              onDocTypeChange={(value) => dispatch(setDocType(value))}
              onToneChange={(value) => dispatch(setTone(value))}
              onGenerate={handleGenerate}
              onUpload={handleUpload}
            />
            <SubscriptionPanel
              isAuthenticated={isAuthenticated}
              plan={plan}
              onUpgrade={handleUpgradeToPro}
            />
            <ExportPanel
              isAuthenticated={isAuthenticated}
              isExporting={isExporting}
              canExport={sections.length > 0}
              plan={plan}
              onExport={handleExport}
              onUpgrade={handleUpgradeToPro}
            />
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Document Style
              </h2>
              <div className="mt-3">
                <ThemeControls
                  styleTokens={styleTokens}
                  onPatchStyleTokens={(patch) => dispatch(patchStyleTokens(patch))}
                />
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <TypographyControls
                  styleTokens={styleTokens}
                  onPatchStyleTokens={(patch) => dispatch(patchStyleTokens(patch))}
                />
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Page layout
                </h3>
                <PageLayoutControls
                  styleTokens={styleTokens}
                  onPatchStyleTokens={(patch) => dispatch(patchStyleTokens(patch))}
                />
              </div>
            </section>
            <HistoryPanel
              isAuthenticated={isAuthenticated}
              history={history}
              freezeActions={isExporting && !historyBusy}
              busyDocumentId={historyBusy?.documentId ?? null}
              busyMode={historyBusy?.mode ?? null}
              onOpenDocument={
                isAuthenticated ? handleOpenDocument : undefined
              }
              onExportDocument={
                isAuthenticated ? handleExportFromHistory : undefined
              }
            />
          </div>

          <div className="space-y-4 xl:col-span-9">
            <PreviewPanelClient
              documentTitle={title}
              liveDocHtml={liveDocHtml}
              styleTokens={styleTokens}
              latestUploadedImage={lastUploadedImage}
              onChange={handlePreviewChange}
              onInsertImage={(url) => {
                setLastUploadedImage(url);
              }}
              isAuthenticated={isAuthenticated}
              isGenerating={isGenerating}
              canContinue={sections.length > 0}
              onContinue={handleContinueDocument}
            />
            <InsightsPanel chartData={chartData} usage={usage} plan={plan} />
            {error ? (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
