"use client";

import type { ExportFormat } from "@/features/export/exportSlice";

type HistoryItem = {
  _id: string;
  title: string;
  docType: string;
  createdAt: string;
};

type HistoryPanelProps = {
  isAuthenticated: boolean;
  history: HistoryItem[];
  onOpenDocument?: (id: string) => void;
  onExportDocument?: (id: string, format: ExportFormat) => void;
  busyDocumentId?: string | null;
  busyMode?: "open" | ExportFormat | null;
  /** When true, all history actions are disabled (e.g. main export in progress). */
  freezeActions?: boolean;
};

export function HistoryPanel({
  isAuthenticated,
  history,
  onOpenDocument,
  onExportDocument,
  busyDocumentId,
  busyMode,
  freezeActions = false,
}: HistoryPanelProps) {
  const exportFormats: ExportFormat[] = ["pdf", "docx", "pptx"];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Recent Documents
      </h2>
      {!isAuthenticated ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Sign in to view your document history.
        </p>
      ) : history.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          No history yet. Generate your first document.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {history.map((item) => {
            const panelLocked = Boolean(busyDocumentId) || freezeActions;
            return (
              <article
                key={item._id}
                className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {item.docType}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  <time suppressHydrationWarning dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </p>
                {onOpenDocument || onExportDocument ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {onOpenDocument ? (
                      <button
                        type="button"
                        onClick={() => void onOpenDocument(item._id)}
                        disabled={panelLocked}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {busyDocumentId === item._id && busyMode === "open" ?
                          "Opening…"
                        : "Open"}
                      </button>
                    ) : null}
                    {onExportDocument
                      ? exportFormats.map((format) => {
                          const isExportBusy =
                            busyDocumentId === item._id && busyMode === format;
                          return (
                            <button
                              key={format}
                              type="button"
                              onClick={() =>
                                void onExportDocument(item._id, format)
                              }
                              disabled={panelLocked}
                              className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-900 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-100"
                            >
                              {isExportBusy ?
                                `${format.toUpperCase()}…`
                              : format.toUpperCase()}
                            </button>
                          );
                        })
                      : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
