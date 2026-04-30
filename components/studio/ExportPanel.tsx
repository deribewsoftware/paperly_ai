"use client";

import { FiDownload } from "react-icons/fi";

import type { ExportFormat } from "@/features/export/exportSlice";

type ExportPanelProps = {
  isAuthenticated: boolean;
  isExporting: boolean;
  canExport: boolean;
  plan: "free" | "pro" | "team" | "enterprise";
  onExport: (format: ExportFormat) => void;
  onUpgrade: () => void;
};

export function ExportPanel({
  isAuthenticated,
  isExporting,
  canExport,
  plan,
  onExport,
  onUpgrade,
}: ExportPanelProps) {
  const canDownload = isAuthenticated && canExport && plan !== "free";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
        <FiDownload className="h-4.5 w-4.5" />
        <h2 className="text-base font-semibold">Export</h2>
      </div>

      <div className="grid gap-2">
        {(["pdf", "docx", "pptx"] as const).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => onExport(format)}
            disabled={!canDownload || isExporting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Download {format.toUpperCase()}
          </button>
        ))}
      </div>
      {plan === "free" ? (
        <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/40">
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            Downloads require Pro subscription.
          </p>
          <button
            type="button"
            onClick={onUpgrade}
            disabled={!isAuthenticated}
            className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Upgrade to Pro
          </button>
        </div>
      ) : null}
    </section>
  );
}
