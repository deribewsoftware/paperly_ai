import { DEFAULT_STYLE_TOKENS } from "@/lib/styleTokensNormalize";
import reducer, {
  addSection,
  addSectionImage,
  appendContinuedDocument,
  loadStoredDocument,
  moveSection,
  patchStyleTokens,
  removeSection,
  removeSectionImage,
  setGeneratedDocument,
  setStreamPartialDocument,
  setSummary,
  setTitle,
  startGeneration,
  updateSection,
} from "@/features/document/documentSlice";

describe("document slice editor reducers", () => {
  it("updates title and summary", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(state, setTitle("New Title"));
    state = reducer(state, setSummary("Short summary"));

    expect(state.title).toBe("New Title");
    expect(state.summary).toBe("Short summary");
  });

  it("adds, updates, moves and removes sections", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(state, addSection());
    state = reducer(state, addSection());
    state = reducer(
      state,
      updateSection({
        index: 0,
        section: { title: "One", body: "Body one" },
      })
    );
    state = reducer(
      state,
      updateSection({
        index: 1,
        section: { title: "Two", body: "Body two" },
      })
    );
    state = reducer(
      state,
      moveSection({
        fromIndex: 1,
        toIndex: 0,
      })
    );
    expect(state.sections[0]?.title).toBe("Two");

    state = reducer(state, removeSection(1));
    expect(state.sections.length).toBe(1);
    expect(state.sections[0]?.title).toBe("Two");
  });

  it("patches style tokens and handles section images", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(state, addSection());
    state = reducer(
      state,
      patchStyleTokens({
        headingSize: 38,
        lineHeight: 2,
      })
    );
    expect(state.styleTokens.headingSize).toBe(38);
    expect(state.styleTokens.lineHeight).toBe(2);

    state = reducer(
      state,
      addSectionImage({
        index: 0,
        image: {
          url: "https://example.com/image.png",
          caption: "Chart image",
          widthPct: 60,
        },
      })
    );
    expect(state.sections[0]?.images?.length).toBe(1);

    state = reducer(
      state,
      removeSectionImage({
        index: 0,
        imageIndex: 0,
      })
    );
    expect(state.sections[0]?.images?.length).toBe(0);
  });

  it("applies stream partial updates and append continued document", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(
      state,
      setStreamPartialDocument({
        title: "Live",
        sections: [{ title: "S1", body: "b1" }],
        liveDocHtml: "<h1>Live</h1>",
      })
    );
    expect(state.title).toBe("Live");
    expect(state.sections.length).toBe(1);
    expect(state.liveDocHtml).toContain("Live");

    state = reducer(
      state,
      appendContinuedDocument({
        sections: [
          { title: "S1", body: "b1" },
          { title: "S2", body: "b2" },
        ],
        liveDocHtml: "<h1>Live</h1><p>more</p>",
      })
    );
    expect(state.sections.length).toBe(2);
    expect(state.isGenerating).toBe(false);
  });

  it("sets generated payload with document id and style tokens", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(
      state,
      setGeneratedDocument({
        documentId: "doc-1",
        title: "Generated Proposal",
        docType: "proposal",
        summary: "Summary",
        styleTokens: { ...DEFAULT_STYLE_TOKENS },
        sections: [{ title: "Executive Summary", body: "Body" }],
      })
    );

    expect(state.documentId).toBe("doc-1");
    expect(state.styleTokens.theme).toBe("corporate");
    expect(state.sections.length).toBe(1);
  });

  it("hydrates editor state from a stored document and clears generation spinners", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(state, startGeneration());
    expect(state.isGenerating).toBe(true);

    state = reducer(
      state,
      loadStoredDocument({
        documentId: "doc-abc",
        prompt: "From disk",
        title: "Saved",
        docType: "report",
        tone: "academic",
        sections: [{ title: "A", body: "B" }],
        liveDocHtml: "<h1>Saved</h1>",
        summary: "Executive overview",
        styleTokens: {
          ...state.styleTokens,
          theme: "academic",
        },
      })
    );
    expect(state.isGenerating).toBe(false);
    expect(state.documentId).toBe("doc-abc");
    expect(state.prompt).toBe("From disk");
    expect(state.title).toBe("Saved");
    expect(state.docType).toBe("report");
    expect(state.tone).toBe("academic");
    expect(state.sections[0]?.body).toBe("B");
    expect(state.liveDocHtml).toContain("Saved");
    expect(state.summary).toBe("Executive overview");
    expect(state.styleTokens.theme).toBe("academic");
  });
});
