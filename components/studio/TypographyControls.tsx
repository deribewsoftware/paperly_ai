"use client";

import type { StyleTokens } from "@/lib/contracts/document";

type TypographyControlsProps = {
  styleTokens: StyleTokens;
  onPatchStyleTokens: (patch: Partial<StyleTokens>) => void;
};

export function TypographyControls({
  styleTokens,
  onPatchStyleTokens,
}: TypographyControlsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Heading font
        <input
          value={styleTokens.headingFont}
          onChange={(event) =>
            onPatchStyleTokens({ headingFont: event.target.value })
          }
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Body font
        <input
          value={styleTokens.bodyFont}
          onChange={(event) => onPatchStyleTokens({ bodyFont: event.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Heading size
        <input
          type="range"
          min={18}
          max={56}
          value={styleTokens.headingSize}
          onChange={(event) =>
            onPatchStyleTokens({ headingSize: Number(event.target.value) })
          }
          className="mt-1 w-full"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Body size
        <input
          type="range"
          min={10}
          max={24}
          value={styleTokens.bodySize}
          onChange={(event) =>
            onPatchStyleTokens({ bodySize: Number(event.target.value) })
          }
          className="mt-1 w-full"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Line height
        <input
          type="range"
          min={1.1}
          max={2.5}
          step={0.1}
          value={styleTokens.lineHeight}
          onChange={(event) =>
            onPatchStyleTokens({ lineHeight: Number(event.target.value) })
          }
          className="mt-1 w-full"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Heading weight
        <input
          type="range"
          min={100}
          max={900}
          step={100}
          value={styleTokens.headingFontWeight}
          onChange={(event) =>
            onPatchStyleTokens({ headingFontWeight: Number(event.target.value) })
          }
          className="mt-1 w-full"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Body weight
        <input
          type="range"
          min={100}
          max={900}
          step={100}
          value={styleTokens.bodyFontWeight}
          onChange={(event) =>
            onPatchStyleTokens({ bodyFontWeight: Number(event.target.value) })
          }
          className="mt-1 w-full"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Body color
        <input
          type="color"
          value={styleTokens.bodyColor.match(/^#[0-9A-Fa-f]{6}$/) ? styleTokens.bodyColor : "#1e293b"}
          onChange={(event) => onPatchStyleTokens({ bodyColor: event.target.value })}
          className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
          aria-label="Body text color"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Heading color (optional)
        <input
          type="color"
          value={
            styleTokens.headingColor.match(/^#[0-9A-Fa-f]{6}$/) ?
              styleTokens.headingColor
            : styleTokens.accentColor
          }
          onChange={(event) =>
            onPatchStyleTokens({ headingColor: event.target.value })
          }
          className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
          aria-label="Heading color"
        />
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        Content width
        <select
          value={styleTokens.contentWidth}
          onChange={(event) =>
            onPatchStyleTokens({
              contentWidth: event.target.value as StyleTokens["contentWidth"],
            })
          }
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="narrow">Narrow</option>
          <option value="normal">Normal</option>
          <option value="wide">Wide</option>
        </select>
      </label>
      <p className="text-[10px] text-slate-600 dark:text-slate-300 sm:col-span-2">
        Heading color: leave unset by choosing the same as accent in Theme (or we use accent
        when the stored value is empty).
      </p>
    </div>
  );
}
