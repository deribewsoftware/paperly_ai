import { mergeAttributes, Node } from "@tiptap/core";

/**
 * Minimal image node (aligned with TipTap Image behavior) without requiring
 * the separate `@tiptap/extension-image` package resolution in some setups.
 */
export const PaperlyTiptapImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
});
