/**
 * StatsDashboard — half-page "Data Dashboard" of macro / sector indicators.
 *
 * Implements proposal 1a from the Quarterly review: a dedicated dashboard
 * block at the start of an Analysis section summarising key macroeconomic
 * indicators (GDP growth, FX rate, policy rate, commodity moves, etc).
 *
 * Editors enter cells manually. We don't auto-populate from a live feed
 * because (a) editorial practice is to cite specific sources at a point
 * in time, and (b) a stale auto-feed would silently mislead readers.
 *
 * Stored attrs:
 *   - title:  optional headline (e.g. "South Africa — Q4 2025 snapshot")
 *   - source: optional citation (e.g. "Source: SARB, IMF WEO Oct 2025")
 *   - itemsJson: JSON string of [{label, value, delta?, hint?}] cells
 *       label  — short caption ("GDP growth")
 *       value  — headline figure ("3.1%")
 *       delta  — optional change indicator ("+0.4 pp YoY", "−1.2%")
 *       hint   — optional tertiary line ("FY2025 forecast")
 *
 * Rendered HTML emits a grid of <div data-stat-cell>...</div> blocks
 * inside an <aside data-callout="stats-dashboard">. Up to 8 cells; the
 * grid auto-arranges 1 / 2 / 3 / 4 per row based on viewport. Source
 * citation appears as small italic text at the bottom.
 */
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    statsDashboard: {
      insertStatsDashboard: (attrs: {
        title?: string;
        source?: string;
        itemsJson: string;
      }) => ReturnType;
    };
  }
}

export interface StatsDashboardItem {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
}

/**
 * Detect the sign of a delta string so we can colour it green/red.
 * Accepts "+0.4 pp", "-1.2%", "−1.2%" (en dash), "↑ 3.1%", etc.
 */
export function deltaTone(delta?: string): "up" | "down" | "neutral" {
  if (!delta) return "neutral";
  const s = delta.trim();
  if (/^[+↑▲]/.test(s)) return "up";
  if (/^[-−–↓▼]/.test(s)) return "down";
  if (/up|gain|rose/i.test(s)) return "up";
  if (/down|fell|drop/i.test(s)) return "down";
  return "neutral";
}

export function parseStatsItems(input: string): StatsDashboardItem[] {
  try {
    const arr = JSON.parse(input);
    if (Array.isArray(arr)) {
      return arr
        .map((row: any) => ({
          label: String(row?.label ?? "").trim(),
          value: String(row?.value ?? "").trim(),
          delta: row?.delta ? String(row.delta).trim() : undefined,
          hint: row?.hint ? String(row.hint).trim() : undefined,
        }))
        .filter((d) => d.label && d.value);
    }
  } catch {
    /* fallthrough */
  }
  return [];
}

export const StatsDashboard = Node.create({
  name: "statsDashboard",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: { default: "" },
      source: { default: "" },
      itemsJson: { default: "[]" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'aside[data-callout="stats-dashboard"]',
        getAttrs: (el) => {
          const root = el as HTMLElement;
          return {
            title: root.getAttribute("data-title") || "",
            source: root.getAttribute("data-source") || "",
            itemsJson: root.getAttribute("data-items") || "[]",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const title = (node.attrs.title as string) || "";
    const source = (node.attrs.source as string) || "";
    const itemsJson = (node.attrs.itemsJson as string) || "[]";
    const items = parseStatsItems(itemsJson);

    const cellNodes: any[] = items.map((item) => {
      const tone = deltaTone(item.delta);
      const cellChildren: any[] = [
        ["span", { "data-stat-label": "" }, item.label],
        ["span", { "data-stat-value": "" }, item.value],
      ];
      if (item.delta) {
        cellChildren.push([
          "span",
          { "data-stat-delta": "", "data-tone": tone },
          item.delta,
        ]);
      }
      if (item.hint) {
        cellChildren.push(["span", { "data-stat-hint": "" }, item.hint]);
      }
      return ["div", { "data-stat-cell": "" }, ...cellChildren];
    });

    const headerNodes: any[] = [];
    if (title) {
      headerNodes.push(["h4", { "data-stats-title": "" }, title]);
    }

    const footerNodes: any[] = [];
    if (source) {
      footerNodes.push(["p", { "data-stats-source": "" }, source]);
    }

    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "stats-dashboard",
        "data-title": title,
        "data-source": source,
        "data-items": itemsJson,
        "data-cell-count": String(items.length),
      }),
      ...headerNodes,
      ["div", { "data-stats-grid": "" }, ...cellNodes],
      ...footerNodes,
    ];
  },

  addCommands() {
    return {
      insertStatsDashboard:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              title: attrs.title || "",
              source: attrs.source || "",
              itemsJson: attrs.itemsJson || "[]",
            },
          }),
    };
  },
});
