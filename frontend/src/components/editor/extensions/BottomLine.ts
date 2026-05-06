/**
 * BottomLine — "Investor Takeaway" callout.
 *
 * A block container that wraps the actionable summary at the end of a long
 * analytical piece. Renders as an <aside data-callout="bottom-line"> in
 * both the editor and on the published detail page; CSS in globals.css
 * styles it as a distinct, visually-separated card with a label header.
 *
 * Editorial pattern lifted from Foreign Affairs / The Economist briefs
 * where a "bottom line" paragraph signals the actionable intelligence to
 * scanning readers.
 */
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bottomLine: {
      setBottomLine: () => ReturnType;
      toggleBottomLine: () => ReturnType;
      unsetBottomLine: () => ReturnType;
    };
  }
}

export const BottomLine = Node.create({
  name: "bottomLine",
  group: "block",
  // Allow paragraphs and lists inside — most takeaways are 1–3 sentences
  // but editors occasionally bullet two/three implications.
  content: "block+",
  defining: true,

  parseHTML() {
    return [
      { tag: 'aside[data-callout="bottom-line"]' },
      // Backward-compat: if an older article has just a div with the class
      // (e.g. legacy paste), recognize it too.
      { tag: 'div[data-callout="bottom-line"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, { "data-callout": "bottom-line" }),
      0,
    ];
  },

  addCommands() {
    return {
      setBottomLine:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleBottomLine:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
      unsetBottomLine:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
