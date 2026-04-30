"use client";

import NextImage from "next/image";

type ImageLibraryProps = {
  latestUploadedImage?: string;
  onUseImage: () => void;
};

export function ImageLibrary({ latestUploadedImage, onUseImage }: ImageLibraryProps) {
  if (!latestUploadedImage) {
    return (
      <p className="text-[11px] text-slate-600 dark:text-slate-300">
        Upload an image from Prompt Panel to reuse it here.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 p-2 dark:border-slate-700">
      <NextImage
        src={latestUploadedImage}
        alt="Latest uploaded asset"
        width={480}
        height={320}
        className="h-20 w-full rounded object-cover"
        unoptimized
      />
      <button
        type="button"
        onClick={onUseImage}
        className="mt-2 w-full rounded-md border border-indigo-300 px-2 py-1 text-xs text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
      >
        Use latest upload
      </button>
    </div>
  );
}
