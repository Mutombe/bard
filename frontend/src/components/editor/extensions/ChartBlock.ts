/**
 * ChartBlock — inline data visualisation for articles.
 *
 * Implements proposal 1b from the Quarterly review: "Replace lengthy
 * textual descriptions of financial trends with clean, modern charts."
 *
 * Atomic node that stores the chart spec (kind, title, axis labels, data)
 * and emits inline SVG via the chart-svg renderer. SVG means crawlers see
 * real numbers (good for SEO + a11y), the article hydrates instantly with
 * no JS chart library, and the chart renders identically in the editor
 * preview and on the published page.
 *
 * Stored attrs:
 *   - kind: "bar" | "line"
 *   - title: optional headline above the chart
 *   - xLabel / yLabel: optional axis labels
 *   - dataJson: the canonical data, stored as a JSON string so TipTap
 *     can serialize cleanly (atom node attrs don't roundtrip arrays well
 *     through ProseMirror's JSON model in some setups). Always parsed
 *     back into [{label, value}] for rendering.
 *
 * Rendered HTML:
 *   <figure data-callout="chart" data-chart-kind="bar"
 *           data-chart-title="…" data-chart-data="[…]">
 *     <svg …>…</svg>
 *     <figcaption>…</figcaption>
 *   </figure>
 *
 * The SVG uses currentColor for axes/labels and var(--chart-color) for
 * the bars/line so it follows light/dark theme automatically.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { renderChartSvg, parseChartData, type ChartKind } from "./chart-svg";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    chartBlock: {
      insertChart: (attrs: {
        kind: ChartKind;
        title?: string;
        xLabel?: string;
        yLabel?: string;
        dataJson: string;
      }) => ReturnType;
    };
  }
}

export const ChartBlock = Node.create({
  name: "chartBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      kind: { default: "bar" },
      title: { default: "" },
      xLabel: { default: "" },
      yLabel: { default: "" },
      // JSON string of [{label, value}, ...] — see parseChartData for
      // accepted input formats from the editor textarea.
      dataJson: { default: "[]" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-callout="chart"]',
        getAttrs: (el) => {
          const root = el as HTMLElement;
          return {
            kind: (root.getAttribute("data-chart-kind") as ChartKind) || "bar",
            title: root.getAttribute("data-chart-title") || "",
            xLabel: root.getAttribute("data-chart-xlabel") || "",
            yLabel: root.getAttribute("data-chart-ylabel") || "",
            dataJson: root.getAttribute("data-chart-data") || "[]",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const kind = ((node.attrs.kind as string) || "bar") as ChartKind;
    const title = (node.attrs.title as string) || "";
    const xLabel = (node.attrs.xLabel as string) || "";
    const yLabel = (node.attrs.yLabel as string) || "";
    const dataJson = (node.attrs.dataJson as string) || "[]";

    // Emit a slim figure with all the spec data on data attributes.
    // The actual SVG is rendered:
    //   - In the editor: live via the NodeView below
    //   - On the reader: client-side via a post-processor in
    //     ArticleView.tsx which scans for figure[data-callout="chart"]
    //     and injects the SVG
    // We also include a screen-reader-friendly data table as fallback so
    // crawlers and assistive tech still see the real numbers even before
    // (or without) JS hydration.
    let parsed: { label: string; value: number }[] = [];
    try {
      const arr = JSON.parse(dataJson);
      if (Array.isArray(arr)) {
        parsed = arr
          .map((d: any) => ({
            label: String(d?.label ?? ""),
            value: Number(d?.value ?? 0),
          }))
          .filter((d) => d.label && Number.isFinite(d.value));
      }
    } catch {
      parsed = parseChartData(dataJson);
    }

    const tableRows: any[] = parsed.map((d) => [
      "tr",
      {},
      ["th", { scope: "row" }, d.label],
      ["td", {}, String(d.value)],
    ]);
    const fallback = [
      "table",
      { "data-chart-fallback": "" },
      title ? ["caption", {}, title] : null,
      ["thead", {}, ["tr", {}, ["th", {}, xLabel || "Label"], ["th", {}, yLabel || "Value"]]],
      ["tbody", {}, ...tableRows],
    ].filter(Boolean) as any[];

    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "chart",
        "data-chart-kind": kind,
        "data-chart-title": title,
        "data-chart-xlabel": xLabel,
        "data-chart-ylabel": yLabel,
        "data-chart-data": dataJson,
      }),
      fallback,
      ...(title ? [["figcaption", {}, title]] : []),
    ];
  },

  // NodeView renders a live SVG inside the editor so authors see exactly
  // what readers will see while they're editing.
  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement("figure");
      wrapper.setAttribute("data-callout", "chart");
      wrapper.setAttribute("data-chart-kind", node.attrs.kind || "bar");

      const renderInto = () => {
        const kind = ((node.attrs.kind as string) || "bar") as ChartKind;
        let parsed: { label: string; value: number }[] = [];
        try {
          const arr = JSON.parse((node.attrs.dataJson as string) || "[]");
          if (Array.isArray(arr)) {
            parsed = arr
              .map((d: any) => ({
                label: String(d?.label ?? ""),
                value: Number(d?.value ?? 0),
              }))
              .filter((d) => d.label && Number.isFinite(d.value));
          }
        } catch {
          parsed = parseChartData(
            ((node.attrs.dataJson as string) || "").replace(/^"|"$/g, "")
          );
        }
        const svg = renderChartSvg({
          kind,
          data: parsed,
          title: node.attrs.title || "",
          xLabel: node.attrs.xLabel || "",
          yLabel: node.attrs.yLabel || "",
        });
        wrapper.innerHTML = svg;
        if (node.attrs.title) {
          const caption = document.createElement("figcaption");
          caption.textContent = node.attrs.title;
          wrapper.appendChild(caption);
        }
      };
      renderInto();

      return {
        dom: wrapper,
        update(updated) {
          if (updated.type.name !== "chartBlock") return false;
          // Re-render when attrs change.
          wrapper.innerHTML = "";
          // Hack: we need the "current" node here; ProseMirror's NodeView
          // signature gives the updated node as the arg, so re-render
          // using its attrs.
          const kind = ((updated.attrs.kind as string) || "bar") as ChartKind;
          let parsed: { label: string; value: number }[] = [];
          try {
            const arr = JSON.parse((updated.attrs.dataJson as string) || "[]");
            if (Array.isArray(arr)) {
              parsed = arr
                .map((d: any) => ({
                  label: String(d?.label ?? ""),
                  value: Number(d?.value ?? 0),
                }))
                .filter((d) => d.label && Number.isFinite(d.value));
            }
          } catch {
            parsed = [];
          }
          wrapper.innerHTML = renderChartSvg({
            kind,
            data: parsed,
            title: updated.attrs.title || "",
            xLabel: updated.attrs.xLabel || "",
            yLabel: updated.attrs.yLabel || "",
          });
          if (updated.attrs.title) {
            const caption = document.createElement("figcaption");
            caption.textContent = updated.attrs.title;
            wrapper.appendChild(caption);
          }
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertChart:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              kind: attrs.kind,
              title: attrs.title || "",
              xLabel: attrs.xLabel || "",
              yLabel: attrs.yLabel || "",
              dataJson: attrs.dataJson || "[]",
            },
          }),
    };
  },
});
