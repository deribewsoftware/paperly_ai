"use client";

import { FiArrowDown, FiArrowUp, FiTrash2 } from "react-icons/fi";

import { ImageBlockEditor } from "@/components/studio/ImageBlockEditor";
import { ImageLibrary } from "@/components/studio/ImageLibrary";
import { LatexBlockEditor } from "@/components/studio/LatexBlockEditor";
import type { DocumentImage } from "@/lib/contracts/document";
import type { DocumentSection } from "@/features/document/documentSlice";

type SectionEditorProps = {
  index: number;
  section: DocumentSection;
  totalSections: number;
  latestUploadedImage?: string;
  imageInput: string;
  onImageInputChange: (value: string) => void;
  onRemoveSection: () => void;
  onMoveSection: (toIndex: number) => void;
  onUpdateSection: (section: Partial<DocumentSection>) => void;
  onAddSectionImage: (image: DocumentImage) => void;
  onRemoveSectionImage: (imageIndex: number) => void;
};

export function SectionEditor({
  index,
  section,
  totalSections,
  latestUploadedImage,
  imageInput,
  onImageInputChange,
  onRemoveSection,
  onMoveSection,
  onUpdateSection,
  onAddSectionImage,
  onRemoveSectionImage,
}: SectionEditorProps) {
  return (
    <article className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Section {index + 1}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveSection(index - 1)}
            disabled={index === 0}
            className="rounded border border-slate-300 p-1 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <FiArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveSection(index + 1)}
            disabled={index === totalSections - 1}
            className="rounded border border-slate-300 p-1 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <FiArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemoveSection}
            className="rounded border border-red-300 p-1 text-red-600 dark:border-red-800 dark:text-red-300"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <input
        value={section.title}
        onChange={(event) => onUpdateSection({ title: event.target.value })}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
        placeholder="Section title"
      />
      <textarea
        value={section.body}
        onChange={(event) => onUpdateSection({ body: event.target.value })}
        className="mt-2 h-24 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        placeholder="Section content"
      />
      <textarea
        value={(section.bullets ?? []).join("\n")}
        onChange={(event) =>
          onUpdateSection({
            bullets: event.target.value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          })
        }
        className="mt-2 h-16 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
        placeholder="Bullets (one per line)"
      />

      <LatexBlockEditor
        value={section.latex}
        onChange={(value) => onUpdateSection({ latex: value })}
      />

      <ImageBlockEditor
        imageInput={imageInput}
        onImageInputChange={onImageInputChange}
        onAddImageByUrl={() => {
          const url = imageInput.trim();
          if (!url) {
            return;
          }
          onAddSectionImage({
            url,
            caption: "Embedded image",
            widthPct: 70,
          });
          onImageInputChange("");
        }}
        images={section.images ?? []}
        onRemoveImage={onRemoveSectionImage}
      />

      <div className="mt-2">
        <ImageLibrary
          latestUploadedImage={latestUploadedImage}
          onUseImage={() => {
            if (!latestUploadedImage) {
              return;
            }
            onAddSectionImage({
              url: latestUploadedImage,
              caption: "Uploaded image",
              widthPct: 70,
            });
          }}
        />
      </div>
    </article>
  );
}
