"use client";

import type { StyleTokens } from "@/lib/contracts/document";

type ThemeControlsProps = {
  styleTokens: StyleTokens;
  onPatchStyleTokens: (patch: Partial<StyleTokens>) => void;
};

export function ThemeControls({
  styleTokens,
  onPatchStyleTokens,
}: ThemeControlsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Document theme
        <select
          value={styleTokens.theme}
          onChange={(event) =>
            onPatchStyleTokens({
              theme: event.target.value as StyleTokens["theme"],
            })
          }
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="corporate">Corporate</option>
          <option value="academic">Academic</option>
          <option value="startup">Startup</option>
        </select>
      </label>

      <label className="text-xs text-slate-600 dark:text-slate-300">
        Accent color
        <input
          type="color"
          value={styleTokens.accentColor}
          onChange={(event) =>
            onPatchStyleTokens({
              accentColor: event.target.value,
            })
          }
          className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
          aria-label="Accent color picker"
        />
      </label>

      <label className="text-xs text-slate-600 dark:text-slate-300">
        Cover page
        <select
          value={styleTokens.includeCoverPage ? "yes" : "no"}
          onChange={(event) =>
            onPatchStyleTokens({
              includeCoverPage: event.target.value === "yes",
            })
          }
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="yes">Enabled</option>
          <option value="no">Disabled</option>
        </select>
      </label>

      <label className="text-xs text-slate-600 dark:text-slate-300">
        Table of contents
        <select
          value={styleTokens.includeToc ? "yes" : "no"}
          onChange={(event) =>
            onPatchStyleTokens({
              includeToc: event.target.value === "yes",
            })
          }
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="yes">Enabled</option>
          <option value="no">Disabled</option>
        </select>
      </label>
    </div>
  );
}
