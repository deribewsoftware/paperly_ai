"use client";

import katex from "katex";

type LatexPreviewProps = {
  value: string;
};

export function LatexPreview({ value }: LatexPreviewProps) {
  if (!value.trim()) {
    return null;
  }

  let html = "";
  try {
    html = katex.renderToString(value, {
      throwOnError: false,
      displayMode: true,
      output: "htmlAndMathml",
    });
  } catch {
    html = `<code>${value}</code>`;
  }

  return (
    <div
      className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm dark:border-indigo-900 dark:bg-indigo-950/40"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
