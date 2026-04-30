"use client";

import type { StyleTokens } from "@/lib/contracts/document";
import { pageSizes } from "@/lib/contracts/document";

type PageLayoutControlsProps = {
  styleTokens: StyleTokens;
  onPatchStyleTokens: (patch: Partial<StyleTokens>) => void;
};

export function PageLayoutControls({
  styleTokens,
  onPatchStyleTokens,
}: PageLayoutControlsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs text-slate-600 dark:text-slate-300 sm:col-span-2">
        Page size (preview frame)
        <select
          value={styleTokens.pageSize}
          onChange={(event) =>
            onPatchStyleTokens({
              pageSize: event.target.value as StyleTokens["pageSize"],
            })
          }
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={styleTokens.showRunningHeader}
          onChange={(event) =>
            onPatchStyleTokens({ showRunningHeader: event.target.checked })
          }
          className="rounded border-slate-300 dark:border-slate-600"
        />
        Running header
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={styleTokens.showRunningFooter}
          onChange={(event) =>
            onPatchStyleTokens({ showRunningFooter: event.target.checked })
          }
          className="rounded border-slate-300 dark:border-slate-600"
        />
        Running footer
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 sm:col-span-2">
        <input
          type="checkbox"
          checked={styleTokens.showPageNumbers}
          onChange={(event) =>
            onPatchStyleTokens({ showPageNumbers: event.target.checked })
          }
          className="rounded border-slate-300 dark:border-slate-600"
        />
        Page numbers (preview / PDF footer when enabled)
      </label>

      <label className="text-xs text-slate-600 dark:text-slate-300 sm:col-span-2">
        Header text
        <input
          value={styleTokens.headerText}
          onChange={(event) =>
            onPatchStyleTokens({ headerText: event.target.value.slice(0, 500) })
          }
          placeholder="{title} · {date}"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </label>

      <label className="text-xs text-slate-600 dark:text-slate-300 sm:col-span-2">
        Footer text
        <input
          value={styleTokens.footerText}
          onChange={(event) =>
            onPatchStyleTokens({ footerText: event.target.value.slice(0, 500) })
          }
          placeholder="Optional · use {title} or {date}"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </label>
    </div>
  );
}
