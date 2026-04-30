"use client";

type LatexBlockEditorProps = {
  value?: string;
  onChange: (value: string) => void;
};

export function LatexBlockEditor({ value, onChange }: LatexBlockEditorProps) {
  return (
    <label className="block text-xs text-slate-600 dark:text-slate-300">
      LaTeX block
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-14 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-900"
        placeholder="\\int_0^1 x^2 dx"
      />
    </label>
  );
}
