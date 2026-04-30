"use client";

import NextImage from "next/image";
import { FiImage } from "react-icons/fi";

import type { DocumentImage } from "@/lib/contracts/document";

type ImageBlockEditorProps = {
  imageInput: string;
  onImageInputChange: (value: string) => void;
  onAddImageByUrl: () => void;
  images: DocumentImage[];
  onRemoveImage: (imageIndex: number) => void;
};

export function ImageBlockEditor({
  imageInput,
  onImageInputChange,
  onAddImageByUrl,
  images,
  onRemoveImage,
}: ImageBlockEditorProps) {
  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={imageInput}
          onChange={(event) => onImageInputChange(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          placeholder="Image URL (Cloudinary or public URL)"
        />
        <button
          type="button"
          onClick={onAddImageByUrl}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700"
        >
          <FiImage className="h-3.5 w-3.5" />
          Add image
        </button>
      </div>

      {images.length > 0 ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {images.map((image, imageIndex) => (
            <div
              key={`${image.url}-${imageIndex}`}
              className="rounded border border-slate-200 p-2 dark:border-slate-700"
            >
              <NextImage
                src={image.url}
                alt={image.alt ?? "Document image"}
                width={480}
                height={320}
                className="h-20 w-full rounded object-cover"
                unoptimized
              />
              <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-300">
                {image.caption ?? image.alt ?? image.url}
              </p>
              <button
                type="button"
                onClick={() => onRemoveImage(imageIndex)}
                className="mt-1 text-[11px] text-red-600 dark:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
