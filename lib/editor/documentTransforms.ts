import type {
  DocumentImage,
  DocumentSection,
  DocumentChart,
  DocumentTable,
} from "@/lib/contracts/document";

type DraftInput = {
  title: string;
  summary?: string;
  sections: DocumentSection[];
};

export type SectionsToEditorHtmlOptions = {
  /** Insert a visual/page break before these section indexes (0-based). */
  pageBreakBeforeSectionIndexes?: number[];
};

type ParsedDraft = DraftInput;

function coerceTable(raw: unknown): DocumentTable | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const candidate = raw as Record<string, unknown>;
  const columnsRaw = candidate.columns;
  const rowsRaw = candidate.rows;
  const columns = Array.isArray(columnsRaw)
    ? columnsRaw.filter((c): c is string => typeof c === "string")
    : [];
  const rows =
    Array.isArray(rowsRaw) ?
      rowsRaw.filter((row): row is string[] =>
        Array.isArray(row)
          ? row.every((cell) => typeof cell === "string")
          : false
      )
    : [];
  if (!columns.length && !rows.length) {
    return undefined;
  }
  return { columns, rows };
}

function coerceChart(raw: unknown): DocumentChart | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const candidate = raw as Record<string, unknown>;
  const type = candidate.type;
  const title = candidate.title;
  const labelsRaw = candidate.labels;
  const valuesRaw = candidate.values;

  if (type !== "bar" && type !== "line" && type !== "pie") {
    return undefined;
  }

  const labels = Array.isArray(labelsRaw)
    ? labelsRaw.filter((label): label is string => typeof label === "string")
    : [];

  const values =
    Array.isArray(valuesRaw) ?
      valuesRaw.filter((value): value is number => typeof value === "number")
    : [];

  const chartTitle =
    typeof title === "string" ? title.trim().slice(0, 140) || "Chart" : "Chart";

  return { type, title: chartTitle, labels, values };
}

function coerceImages(raw: unknown): DocumentImage[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const images = raw
    .filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === "object")
    )
    .map((img) => {
      const url = typeof img.url === "string" ? img.url.trim() : "";
      if (!url) {
        return null;
      }
      const caption =
        typeof img.caption === "string" ? img.caption.slice(0, 280) : undefined;
      const alt =
        typeof img.alt === "string" ? img.alt.slice(0, 180) : undefined;
      const widthPct =
        typeof img.widthPct === "number" &&
        img.widthPct >= 10 &&
        img.widthPct <= 100 ?
          img.widthPct
        : undefined;

      const image: DocumentImage = { url };
      if (caption !== undefined) {
        image.caption = caption;
      }
      if (alt !== undefined) {
        image.alt = alt;
      }
      if (widthPct !== undefined) {
        image.widthPct = widthPct;
      }

      return image;
    })
    .filter((entry): entry is DocumentImage => Boolean(entry));

  return images.length ? images : undefined;
}

/**
 * Normalize LLM / client shape so Mongo + HTML generation never throw on bad fields.
 */
export function sanitizeDocumentSections(raw: unknown): DocumentSection[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((entry): DocumentSection => {
    const s =
      entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};

    const titleRaw = s.title;
    const title =
      typeof titleRaw === "string" && titleRaw.trim() ?
        titleRaw.trim().slice(0, 200)
      : "Section";

    const bodyRaw = s.body;
    const body =
      typeof bodyRaw === "string" ? bodyRaw.slice(0, 120_000) : "";

    let bullets: string[] | undefined;
    if (Array.isArray(s.bullets)) {
      const list = s.bullets
        .filter((b): b is string => typeof b === "string")
        .map((b) => b.slice(0, 2_000))
        .slice(0, 80);
      bullets = list.length ? list : undefined;
    }

    const latex =
      typeof s.latex === "string" ? s.latex.slice(0, 12_000) : undefined;

    const table = coerceTable(s.table);
    const chart = coerceChart(s.chart);
    const images = coerceImages(s.images);

    const section: DocumentSection = { title, body };
    if (bullets) {
      section.bullets = bullets;
    }
    if (table) {
      section.table = table;
    }
    if (chart) {
      section.chart = chart;
    }
    if (latex?.trim()) {
      section.latex = latex;
    }
    if (images) {
      section.images = images;
    }

    return section;
  });
}

function escapeHtml(value: string | null | undefined) {
  const s = value === null || value === undefined ? "" : String(value);
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sectionsToEditorHtml(
  input: DraftInput,
  options?: SectionsToEditorHtmlOptions
) {
  const blocks: string[] = [`<h1>${escapeHtml(input.title)}</h1>`];

  if (input.summary?.trim()) {
    blocks.push(`<p data-summary="true">${escapeHtml(input.summary)}</p>`);
  }

  const breakBefore = new Set(options?.pageBreakBeforeSectionIndexes ?? []);

  input.sections.forEach((section, sectionIndex) => {
    if (breakBefore.has(sectionIndex)) {
      blocks.push(
        `<p data-page-break="true" class="paperly-page-break"></p>`
      );
    }
    const title = typeof section.title === "string" ? section.title : "Section";
    const body = typeof section.body === "string" ? section.body : "";
    blocks.push(`<h2>${escapeHtml(title)}</h2>`);

    const bodyParts = body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (bodyParts.length === 0) {
      blocks.push("<p></p>");
    } else {
      bodyParts.forEach((line) => {
        blocks.push(`<p>${escapeHtml(line)}</p>`);
      });
    }

    const bullets = Array.isArray(section.bullets)
      ? section.bullets.filter((b): b is string => typeof b === "string")
      : [];
    if (bullets.length > 0) {
      blocks.push(
        `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
      );
    }

    const latex = typeof section.latex === "string" ? section.latex : "";
    if (latex.trim()) {
      blocks.push(
        `<p data-latex="true" data-latex-src="${escapeHtml(latex)}">${escapeHtml(latex)}</p>`
      );
    }

    const images = Array.isArray(section.images) ? section.images : [];
    images.forEach((image) => {
      const url = image && typeof image.url === "string" ? image.url.trim() : "";
      if (!url) {
        return;
      }
      const caption = image.caption
        ? `<figcaption>${escapeHtml(
            typeof image.caption === "string" ? image.caption : ""
          )}</figcaption>`
        : "";
      blocks.push(
        `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(
          typeof image.alt === "string" ? image.alt : "Embedded image"
        )}" />${caption}</figure>`
      );
    });
  });

  return blocks.join("");
}

function getText(element: Element | null) {
  return element?.textContent?.trim() ?? "";
}

export function editorHtmlToDraft(html: string, fallback: DraftInput): ParsedDraft {
  if (!html.trim() || typeof window === "undefined") {
    return {
      title: fallback.title,
      summary: fallback.summary,
      sections: fallback.sections,
    };
  }

  const parsed = new DOMParser().parseFromString(html, "text/html");
  const container = parsed.body;

  const title = getText(container.querySelector("h1")) || fallback.title;
  const summaryElement = container.querySelector("p[data-summary='true']");
  const summary = getText(summaryElement) || fallback.summary;

  const sections: DocumentSection[] = [];
  let current: DocumentSection | null = null;

  for (const node of Array.from(container.children)) {
    if (node.tagName === "H2") {
      if (current) {
        sections.push(current);
      }
      current = {
        title: getText(node) || "Section",
        body: "",
        bullets: [],
        images: [],
      };
      continue;
    }

    if (!current) {
      continue;
    }

    if (node.tagName === "P") {
      const element = node as HTMLParagraphElement;
      if (element.dataset.pageBreak === "true") {
        continue;
      }
      if (element.dataset.latex === "true") {
        const fromAttr = element.getAttribute("data-latex-src");
        current.latex =
          typeof fromAttr === "string" && fromAttr.trim() ?
            fromAttr.trim()
          : getText(element);
      } else if (element.dataset.summary !== "true") {
        const text = getText(element);
        if (text) {
          current.body = current.body ? `${current.body}\n${text}` : text;
        }
      }
      continue;
    }

    if (node.tagName === "UL" || node.tagName === "OL") {
      const items = Array.from(node.querySelectorAll("li"))
        .map((item) => getText(item))
        .filter(Boolean);
      current.bullets = [...(current.bullets ?? []), ...items];
      continue;
    }

    if (node.tagName === "FIGURE") {
      const image = node.querySelector("img");
      if (image?.getAttribute("src")) {
        current.images = [
          ...(current.images ?? []),
          {
            url: image.getAttribute("src") ?? "",
            alt: image.getAttribute("alt") ?? undefined,
            caption: getText(node.querySelector("figcaption")) || undefined,
            widthPct: 70,
          },
        ];
      }
      continue;
    }

    if (node.tagName === "IMG" && node.getAttribute("src")) {
      current.images = [
        ...(current.images ?? []),
        {
          url: node.getAttribute("src") ?? "",
          alt: node.getAttribute("alt") ?? undefined,
          widthPct: 70,
        },
      ];
    }
  }

  if (current) {
    sections.push(current);
  }

  const normalizedSections = sections
    .map((section) => ({
      ...section,
      bullets: section.bullets?.filter(Boolean),
      images: section.images?.filter((image) => Boolean(image.url)),
    }))
    .filter((section) => {
      return Boolean(
        section.title.trim() ||
          section.body.trim() ||
          section.bullets?.length ||
          section.latex?.trim() ||
          section.images?.length
      );
    });

  return {
    title,
    summary,
    sections: normalizedSections.length > 0 ? normalizedSections : fallback.sections,
  };
}
