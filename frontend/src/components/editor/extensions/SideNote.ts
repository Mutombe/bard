/**
 * SideNote — inline annotation that renders in the right margin on wide
 * viewports, collapses inline (italic, indented) on tablet/mobile.
 *
 * Implements proposal 2b (margin notes) from the Quarterly review:
 * "brief annotations in the white space alongside the main text" used
 * to define complex terms, provide context, or link to related research.
 *
 * Mark — applied to a span of text in the article, not a separate block.
 * The annotated word/phrase carries the note as a `data-sidenote` attr.
 * On wide viewports CSS pulls a ::after pseudo-element into the right
 * margin via `position: absolute`. On narrow viewports the note appears
 * as an italic indented paragraph immediately after the marked phrase.
 *
 * The mark approach (vs a separate block) keeps the prose flow intact
 * and lets editors annotate any phrase mid-sentence without breaking
 * paragraph structure.
 */
import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sideNote: {
      setSideNote: (note: string) => ReturnType;
      unsetSideNote: () => ReturnType;
    };
  }
}

export const SideNote = Mark.create({
  name: "sideNote",
  // Inclusive=false so typing past the end of a sidenote-marked range
  // doesn't auto-extend the mark — annotations should be deliberate.
  inclusive: false,
  // Excludes "_" — meaning if a sidenote-marked range overlaps another
  // sidenote, the new one replaces the old.
  excludes: "sideNote",

  addAttributes() {
    return {
      note: {
        default: "",
        parseHTML: (el) =>
          (el as HTMLElement).getAttribute("data-sidenote") || "",
        renderHTML: (attrs) =>
          attrs.note ? { "data-sidenote": attrs.note } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-sidenote]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-callout-mark": "sidenote" }),
      0,
    ];
  },

  addCommands() {
    return {
      setSideNote:
        (note: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { note }),
      unsetSideNote:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
