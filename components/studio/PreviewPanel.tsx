"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import katex from "katex";

import { PaperlyTiptapImage } from "@/lib/editor/paperlyTiptapImage";
import { useTypewriterHtml } from "@/lib/hooks/useTypewriterHtml";
import { formatPageChrome } from "@/lib/pageChrome";
import {
  getPreviewPageDimensions,
  estimatePreviewSliceHeightPx,
} from "@/lib/pageLayout";
import {
  FiBold,
  FiFileText,
  FiImage,
  FiItalic,
  FiList,
  FiLoader,
  FiType,
} from "react-icons/fi";
import { MdFormatListNumbered } from "react-icons/md";

import type { StyleTokens } from "@/lib/contracts/document";

function decorateLatexInProseMirrorRoot(root: HTMLElement) {
  root.querySelectorAll('p[data-latex="true"]').forEach((node) => {
    const el = node as HTMLElement;
    const src =
      el.getAttribute("data-latex-src")?.trim() || el.textContent?.trim() || "";
    if (!src) {
      return;
    }
    if (el.querySelector(".katex") && el.getAttribute("data-latex-src") === src) {
      return;
    }
    try {
      el.innerHTML = katex.renderToString(src, {
        throwOnError: false,
        displayMode: true,
        output: "htmlAndMathml",
      });
      if (!el.getAttribute("data-latex-src")) {
        el.setAttribute("data-latex-src", src);
      }
    } catch {
      el.textContent = src;
    }
  });
}

export type PreviewPanelProps = {
  documentTitle: string;
  liveDocHtml: string;
  styleTokens: StyleTokens;
  latestUploadedImage?: string;
  onChange: (html: string) => void;
  onInsertImage: (url: string) => void;
  isAuthenticated?: boolean;
  isGenerating?: boolean;
  canContinue?: boolean;
  onContinue?: () => void;
};

export function PreviewPanel({
  documentTitle,
  liveDocHtml,
  styleTokens,
  latestUploadedImage,
  onChange,
  onInsertImage,
  isAuthenticated = false,
  isGenerating = false,
  canContinue = false,
  onContinue,
}: PreviewPanelProps) {
  const isGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const displayHtml = useTypewriterHtml(liveDocHtml, Boolean(isGenerating));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });

  const pageDims = useMemo(
    () => getPreviewPageDimensions(styleTokens.pageSize),
    [styleTokens.pageSize]
  );
  const slicePx = useMemo(
    () => estimatePreviewSliceHeightPx(styleTokens.pageSize),
    [styleTokens.pageSize]
  );

  const headingColorResolved =
    styleTokens.headingColor.trim() ? styleTokens.headingColor : styleTokens.accentColor;

  const chromeContext = useMemo(
    () => ({ title: documentTitle || "Untitled" }),
    [documentTitle]
  );

  const headerRendered =
    styleTokens.showRunningHeader ?
      formatPageChrome(styleTokens.headerText, chromeContext)
    : "";

  const footerChromeRendered =
    styleTokens.showRunningFooter ?
      formatPageChrome(styleTokens.footerText, chromeContext)
    : "";

  const editor = useEditor({
    extensions: [StarterKit, PaperlyTiptapImage],
    content: displayHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "paperly-editor h-full min-h-[min(420px,50vh)] w-full outline-none px-6 py-6 sm:px-8 sm:py-8",
      },
    },
    onUpdate: ({ editor: instance }) => {
      if (isGeneratingRef.current) {
        return;
      }
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || !displayHtml) {
      return;
    }
    if (editor.getHTML() !== displayHtml) {
      editor.commands.setContent(displayHtml, false);
    }
  }, [editor, displayHtml]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const run = () => {
      decorateLatexInProseMirrorRoot(editor.view.dom as HTMLElement);
    };
    run();
    editor.on("update", run);
    return () => {
      editor.off("update", run);
    };
  }, [editor, displayHtml]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    const update = () => {
      const prose = scrollEl.querySelector(".ProseMirror") as HTMLElement | null;
      const breaks = prose?.querySelectorAll("p.paperly-page-break").length ?? 0;
      const scrollHeight = prose?.scrollHeight ?? 0;
      const totalFromScroll = Math.max(1, Math.ceil(scrollHeight / slicePx));
      const total = Math.max(1 + breaks, totalFromScroll);
      const center = scrollEl.scrollTop + scrollEl.clientHeight * 0.45;
      const current = Math.min(
        total,
        Math.max(1, Math.floor(center / slicePx) + 1)
      );
      setPageInfo({ current, total });
    };

    update();
    scrollEl.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(scrollEl);
    const prose = scrollEl.querySelector(".ProseMirror");
    if (prose) {
      ro.observe(prose);
    }
    return () => {
      scrollEl.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [editor, displayHtml, liveDocHtml, slicePx]);

  const editorCssVars = useMemo(
    () =>
      ({
        "--paperly-accent": styleTokens.accentColor,
        "--paperly-heading-font": styleTokens.headingFont,
        "--paperly-heading-color": headingColorResolved,
        "--paperly-heading-weight": String(styleTokens.headingFontWeight),
        "--paperly-body-weight": String(styleTokens.bodyFontWeight),
        "--paperly-body-color": styleTokens.bodyColor,
        "--paperly-h1-size": `${styleTokens.headingSize}px`,
        "--paperly-h2-size": `${Math.max(16, Math.round(styleTokens.headingSize * 0.58))}px`,
        "--paperly-body-size": `${styleTokens.bodySize}px`,
        lineHeight: styleTokens.lineHeight,
        fontFamily: styleTokens.bodyFont,
        fontSize: `${styleTokens.bodySize}px`,
        color: styleTokens.bodyColor,
        fontWeight: styleTokens.bodyFontWeight,
      }) as CSSProperties,
    [
      headingColorResolved,
      styleTokens.accentColor,
      styleTokens.bodyColor,
      styleTokens.bodyFont,
      styleTokens.bodyFontWeight,
      styleTokens.bodySize,
      styleTokens.headingFont,
      styleTokens.headingFontWeight,
      styleTokens.headingSize,
      styleTokens.lineHeight,
    ]
  );

  const showFooterBar =
    styleTokens.showRunningFooter ||
    (styleTokens.showPageNumbers && styleTokens.pageNumberPosition === "footer");

  let footerCenter = "";
  if (styleTokens.showPageNumbers && styleTokens.pageNumberPosition === "footer") {
    footerCenter =
      footerChromeRendered ?
        `${footerChromeRendered} · Page ${pageInfo.current} of ${pageInfo.total}`
      : `Page ${pageInfo.current} of ${pageInfo.total}`;
  } else if (footerChromeRendered) {
    footerCenter = footerChromeRendered;
  }

  const toolbarButtonClass =
    "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-slate-900 dark:text-slate-100">
        <FiFileText className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Live document</h2>
        <span className="text-xs font-normal text-slate-600 dark:text-slate-300">
          {styleTokens.pageSize.toUpperCase()} frame
        </span>
        {isGenerating ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-2.5 py-1 text-xs font-medium text-indigo-800 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-950/80 dark:text-indigo-200">
            <FiLoader className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
            <span>AI is typing…</span>
          </span>
        ) : null}
      </div>
      <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
        Editable page with optional header, footer, and page numbers. Scroll the page body;
        chrome stays fixed.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={toolbarButtonClass}
        >
          <FiBold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={toolbarButtonClass}
        >
          <FiItalic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toolbarButtonClass}
        >
          <FiType className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={toolbarButtonClass}
        >
          <FiList className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={toolbarButtonClass}
        >
          <MdFormatListNumbered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!latestUploadedImage) {
              return;
            }
            editor
              ?.chain()
              .focus()
              .insertContent({
                type: "image",
                attrs: {
                  src: latestUploadedImage,
                  alt: "Uploaded image",
                },
              })
              .run();
            onInsertImage(latestUploadedImage);
          }}
          className={toolbarButtonClass}
          disabled={!latestUploadedImage}
        >
          <FiImage className="h-3.5 w-3.5" />
        </button>
      </div>

      <article
        className="paperly-preview-article mx-auto w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/60 p-2 sm:p-3 dark:border-slate-700 dark:bg-slate-900/60"
        style={{
          borderColor: `${styleTokens.accentColor}50`,
        }}
      >
        <div
          className="mx-auto w-full"
          style={{
            width: "100%",
            maxWidth: pageDims.width,
          }}
        >
          <div
            className="flex flex-col overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-md dark:border-slate-500/50 dark:bg-white"
            style={{
              height: `min(85vh, ${pageDims.height}px)`,
              maxHeight: `min(85vh, ${pageDims.height}px)`,
            }}
          >
            {styleTokens.showRunningHeader && headerRendered ? (
              <header
                className="shrink-0 border-b px-4 py-2.5 text-[11px] sm:text-xs"
                style={{
                  borderColor: `${styleTokens.accentColor}33`,
                  color: styleTokens.bodyColor,
                  fontFamily: styleTokens.bodyFont,
                }}
              >
                {headerRendered}
              </header>
            ) : null}

            <div
              ref={scrollRef}
              className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
            >
              <div
                className={[
                  "paperly-typing-wrap",
                  isGenerating ? "is-typing-stream" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <EditorContent editor={editor} style={editorCssVars} />
              </div>
            </div>

            {showFooterBar && footerCenter ? (
              <footer
                className="shrink-0 border-t px-4 py-2 text-[10px] sm:text-[11px]"
                style={{
                  borderColor: `${styleTokens.accentColor}33`,
                  color: styleTokens.bodyColor,
                  fontFamily: styleTokens.bodyFont,
                  opacity: 0.92,
                }}
              >
                {footerCenter}
              </footer>
            ) : null}
          </div>
        </div>

        {canContinue && onContinue ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onContinue}
              disabled={!isAuthenticated || isGenerating}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {isGenerating ? "Writing…" : "Continue on next page"}
            </button>
          </div>
        ) : null}
      </article>
    </section>
  );
}
