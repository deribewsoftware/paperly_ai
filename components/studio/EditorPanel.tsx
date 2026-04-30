"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";

import type { DocumentImage, StyleTokens } from "@/lib/contracts/document";
import type { DocumentSection } from "@/features/document/documentSlice";
import { SectionEditor } from "@/components/studio/SectionEditor";
import { ThemeControls } from "@/components/studio/ThemeControls";
import { TypographyControls } from "@/components/studio/TypographyControls";

type EditorPanelProps = {
  title: string;
  summary?: string;
  sections: DocumentSection[];
  styleTokens: StyleTokens;
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onAddSection: () => void;
  onRemoveSection: (index: number) => void;
  onMoveSection: (fromIndex: number, toIndex: number) => void;
  onUpdateSection: (index: number, section: Partial<DocumentSection>) => void;
  onAddSectionImage: (index: number, image: DocumentImage) => void;
  onRemoveSectionImage: (index: number, imageIndex: number) => void;
  onPatchStyleTokens: (patch: Partial<StyleTokens>) => void;
  latestUploadedImage?: string;
};

export function EditorPanel({
  title,
  summary,
  sections,
  styleTokens,
  onTitleChange,
  onSummaryChange,
  onAddSection,
  onRemoveSection,
  onMoveSection,
  onUpdateSection,
  onAddSectionImage,
  onRemoveSectionImage,
  onPatchStyleTokens,
  latestUploadedImage,
}: EditorPanelProps) {
  const [imageUrlInputs, setImageUrlInputs] = useState<Record<number, string>>({});

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Manual Editor
        </h2>
        <button
          type="button"
          onClick={onAddSection}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add Section
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
          placeholder="Document title"
        />
        <textarea
          value={summary ?? ""}
          onChange={(event) => onSummaryChange(event.target.value)}
          className="h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          placeholder="Executive summary"
        />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          Theme controls
        </p>
        <div className="mt-2">
          <ThemeControls
            styleTokens={styleTokens}
            onPatchStyleTokens={onPatchStyleTokens}
          />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          Typography controls
        </p>
        <div className="mt-2">
          <TypographyControls
            styleTokens={styleTokens}
            onPatchStyleTokens={onPatchStyleTokens}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sections.map((section, index) => (
          <SectionEditor
            key={`${section.title}-${index}`}
            index={index}
            section={section}
            totalSections={sections.length}
            latestUploadedImage={latestUploadedImage}
            imageInput={imageUrlInputs[index] ?? ""}
            onImageInputChange={(value) =>
              setImageUrlInputs((prev) => ({ ...prev, [index]: value }))
            }
            onRemoveSection={() => onRemoveSection(index)}
            onMoveSection={(toIndex) => onMoveSection(index, toIndex)}
            onUpdateSection={(sectionPatch) => onUpdateSection(index, sectionPatch)}
            onAddSectionImage={(image) => onAddSectionImage(index, image)}
            onRemoveSectionImage={(imageIndex) =>
              onRemoveSectionImage(index, imageIndex)
            }
          />
        ))}
      </div>
    </section>
  );
}
