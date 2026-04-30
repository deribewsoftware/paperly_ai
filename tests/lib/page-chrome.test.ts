import { describe, expect, it } from "vitest";

import { formatPageChrome } from "@/lib/pageChrome";

describe("formatPageChrome", () => {
  it("replaces title and date placeholders", () => {
    const d = new Date("2026-04-30T12:00:00Z");
    expect(formatPageChrome("{title} — {date}", { title: "Q1", date: d })).toContain("Q1");
    expect(formatPageChrome("{title} — {date}", { title: "Q1", date: d })).toMatch(/2026|Apr|30/);
  });
});
