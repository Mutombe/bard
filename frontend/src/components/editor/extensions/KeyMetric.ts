/**
 * KeyMetric — call-out box for a single quantitative figure.
 *
 * Surfaces the headline number in an analysis (e.g. "US$100M Bond Offering",
 * "3.1% GDP Growth Target") so scanning readers see the data point even if
 * they skip the supporting paragraph. Common pattern in HBR / FT briefings.
 *
 * Stored attributes:
 *   - figure: the headline figure / value (e.g. "US$100M", "3.1%")
 *   - label:  short descriptor below the figure (e.g. "Bond Offering")
 *   - hint:   optional tertiary line for context (e.g. "FY2025 forecast")
 *
 * Rendered HTML:
 *   <aside data-callout="metric">
 *     <span data-metric-figure>US$100M</span>
 *     <span data-metric-label>Bond Offering</span>
 *     <span data-metric-hint>FY2025 forecast</span>
 *   </aside>
 *
 * Renderer-side CSS in globals.css turns this into a shaded card.
 */
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    keyMetric: {
      insertKeyMetric: (attrs: { figure: string; label?: string; hint?: string }) => ReturnType;
    };
  }
}

export const KeyMetric = Node.create({
  name: "keyMetric",
  group: "block",
  // Atomic — editor cursor doesn't enter it, the whole block is selected
  // and edited via prompts. Keeps content predictable and prevents stray
  // formatting (bold, links) inside the figure text.
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      figure: { default: "" },
      label: { default: "" },
      hint: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'aside[data-callout="metric"]',
        getAttrs: (el) => {
          const root = el as HTMLElement;
          return {
            figure: root.querySelector("[data-metric-figure]")?.textContent || "",
            label: root.querySelector("[data-metric-label]")?.textContent || "",
            hint: root.querySelector("[data-metric-hint]")?.textContent || "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const figure = (node.attrs.figure as string) || "";
    const label = (node.attrs.label as string) || "";
    const hint = (node.attrs.hint as string) || "";
    const children: any[] = [["span", { "data-metric-figure": "" }, figure]];
    if (label) children.push(["span", { "data-metric-label": "" }, label]);
    if (hint) children.push(["span", { "data-metric-hint": "" }, hint]);
    return [
      "aside",
      mergeAttributes(HTMLAttributes, { "data-callout": "metric" }),
      ...children,
    ];
  },

  addCommands() {
    return {
      insertKeyMetric:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              figure: attrs.figure || "",
              label: attrs.label || "",
              hint: attrs.hint || "",
            },
          }),
    };
  },
});
