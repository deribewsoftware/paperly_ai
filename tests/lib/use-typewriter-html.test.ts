import { describe, expect, it } from "vitest";

import { nextHtmlChunkEnd } from "@/lib/hooks/useTypewriterHtml";

describe("nextHtmlChunkEnd", () => {
  it("consumes tags and text chunks separately", () => {
    const html = "<h1>Hi</h1><p>x</p>";
    expect(nextHtmlChunkEnd(html, 0)).toBe(4);
    expect(nextHtmlChunkEnd(html, 4)).toBe(6);
    expect(nextHtmlChunkEnd(html, 6)).toBe(11);
  });

  it("consumes leading whitespace with the following word", () => {
    const html = "  hello ";
    expect(nextHtmlChunkEnd(html, 0)).toBe(7);
  });
});
