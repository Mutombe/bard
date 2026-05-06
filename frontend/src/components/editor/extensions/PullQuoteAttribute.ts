/**
 * PullQuoteAttribute — adds a `data-style` attribute to the blockquote
 * node defined by StarterKit, so the same node renders either as a
 * standard quote (default) or as a magazine-style pull quote when
 * `data-style="pull"` is set.
 *
 * Standard blockquote: indented attribution / interviewee quote.
 * Pull quote: enlarged, decorative, breaks up dense analysis. Editors
 * toggle via the bubble menu when their selection is inside a blockquote.
 *
 * Uses the `addGlobalAttributes` API so we don't have to redefine the
 * blockquote node — keeps cmd+shift+B and paste handling intact.
 */
import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pullQuote: {
      togglePullQuote: () => ReturnType;
      setPullQuote: () => ReturnType;
      unsetPullQuote: () => ReturnType;
    };
  }
}

export const PullQuoteAttribute = Extension.create({
  name: "pullQuoteAttribute",

  addGlobalAttributes() {
    return [
      {
        types: ["blockquote"],
        attributes: {
          "data-style": {
            default: null,
            parseHTML: (el) =>
              (el as HTMLElement).getAttribute("data-style") || null,
            renderHTML: (attrs: Record<string, any>) =>
              attrs["data-style"]
                ? { "data-style": attrs["data-style"] }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setPullQuote:
        () =>
        ({ commands, chain, editor }) => {
          // If already inside a blockquote, just flip the attribute.
          if (editor.isActive("blockquote")) {
            return commands.updateAttributes("blockquote", {
              "data-style": "pull",
            });
          }
          // Otherwise, wrap the selection first, then tag it.
          return chain()
            .toggleBlockquote()
            .updateAttributes("blockquote", { "data-style": "pull" })
            .run();
        },
      unsetPullQuote:
        () =>
        ({ commands, editor }) => {
          if (!editor.isActive("blockquote")) return false;
          return commands.updateAttributes("blockquote", {
            "data-style": null,
          });
        },
      togglePullQuote:
        () =>
        ({ commands, chain, editor }) => {
          const current = editor.getAttributes("blockquote")["data-style"];
          if (current === "pull") {
            return commands.updateAttributes("blockquote", {
              "data-style": null,
            });
          }
          return chain().setPullQuote().run();
        },
    };
  },
});
