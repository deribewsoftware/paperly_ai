"use client";

import type { ChangeEvent } from "react";
import { FiUploadCloud } from "react-icons/fi";

import type { DocumentType } from "@/lib/contracts/document";

type PromptPanelProps = {
  prompt: string;
  docType: DocumentType;
  tone: "professional" | "academic" | "startup";
  isGenerating: boolean;
  isAuthenticated: boolean;
  uploadStatus: string;
  onPromptChange: (value: string) => void;
  onDocTypeChange: (value: DocumentType) => void;
  onToneChange: (value: "professional" | "academic" | "startup") => void;
  onGenerate: () => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function PromptPanel({
  prompt,
  docType,
  tone,
  isGenerating,
  isAuthenticated,
  uploadStatus,
  onPromptChange,
  onDocTypeChange,
  onToneChange,
  onGenerate,
  onUpload,
}: PromptPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Prompt Studio
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Generate with AI first, then refine directly inside the live A3 document.
      </p>

      <textarea
        className="mt-4 h-40 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Create a professional investor-ready proposal for a logistics startup in Addis Ababa."
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={docType}
          onChange={(event) => onDocTypeChange(event.target.value as DocumentType)}
        >
          <option value="proposal">Proposal</option>
          <option value="research-paper">Research Paper</option>
          <option value="resume-cv">Resume / CV</option>
          <option value="meeting-notes">Meeting Notes</option>
          <option value="marketing-plan">Marketing Plan</option>
          <option value="contract-letter">Contract / Letter</option>
          <option value="report">Report</option>
          <option value="presentation">Presentation</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={tone}
          onChange={(event) =>
            onToneChange(event.target.value as "professional" | "academic" | "startup")
          }
        >
          <option value="professional">Professional</option>
          <option value="academic">Academic</option>
          <option value="startup">Startup</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!isAuthenticated || isGenerating || prompt.trim().length < 12}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          {isGenerating ? "Generating..." : "Generate Document"}
        </button>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
          <FiUploadCloud className="h-4 w-4" />
          Upload Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
            disabled={!isAuthenticated}
          />
        </label>
      </div>

      {!isAuthenticated ? (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
          Sign in with Google to generate, upload images, and export.
        </p>
      ) : null}
      {uploadStatus ? (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{uploadStatus}</p>
      ) : null}
    </section>
  );
}
