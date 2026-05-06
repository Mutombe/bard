/**
 * chart-svg — tiny SVG chart generator.
 *
 * Used by the ChartBlock TipTap node to emit static SVG into the article
 * HTML. Static SVG means:
 *   - Crawlers see real data points (good for SEO and accessibility),
 *   - First paint is instant (no JS hydration),
 *   - Articles stay self-contained — no client-side chart library
 *     bundle on the article detail page.
 *
 * Supports bar and line charts only. Anything more sophisticated (stacked,
 * multi-series, etc.) is out of scope for the inline-article use case;
 * complex visuals can still be captured as images.
 */

export interface ChartDatum {
  label: string;
  value: number;
}

export type ChartKind = "bar" | "line";

export interface ChartSpec {
  kind: ChartKind;
  data: ChartDatum[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

/**
 * Format a number for axis labels — keep it short. 1234 → "1.2K", 1.2M → "1.2M".
 */
function formatTick(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  if (abs < 10 && abs > 0) return n.toFixed(2).replace(/\.?0+$/, "");
  return Math.round(n).toString();
}

function escapeText(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render an SVG string for the given chart spec.
 *
 * Layout:
 *   - Width is responsive (viewBox-based, scales to container).
 *   - Fixed canvas of 600 × `height` (default 320).
 *   - Plot area inset for axis labels.
 *   - Burgundy fills/strokes via CSS variable `--chart-color` (set in
 *     globals.css to `hsl(var(--primary))`) so dark/light themes follow.
 */
export function renderChartSvg(spec: ChartSpec): string {
  const data = Array.isArray(spec.data) ? spec.data : [];
  if (data.length === 0) {
    return `<svg viewBox="0 0 600 80" xmlns="http://www.w3.org/2000/svg"><text x="300" y="48" text-anchor="middle" font-size="14" fill="currentColor" opacity="0.5">No data</text></svg>`;
  }

  const W = 600;
  const H = spec.height ?? 320;
  const PAD_L = 56;
  const PAD_R = 16;
  const PAD_T = spec.title ? 36 : 16;
  const PAD_B = (spec.xLabel ? 48 : 32) + 12;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const values = data.map((d) => d.value);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;

  // Y-axis ticks — 4 evenly spaced.
  const tickCount = 4;
  const ticks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(min + (range * i) / tickCount);
  }

  const yToPx = (v: number) => PAD_T + plotH - ((v - min) / range) * plotH;

  // Axis lines + ticks
  const axisLines: string[] = [];
  axisLines.push(
    `<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + plotH}" stroke="currentColor" stroke-opacity="0.2" />`,
    `<line x1="${PAD_L}" y1="${PAD_T + plotH}" x2="${W - PAD_R}" y2="${PAD_T + plotH}" stroke="currentColor" stroke-opacity="0.2" />`
  );
  ticks.forEach((t) => {
    const y = yToPx(t);
    axisLines.push(
      `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="currentColor" stroke-opacity="0.07" />`,
      `<text x="${PAD_L - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity="0.6">${escapeText(formatTick(t))}</text>`
    );
  });

  // Series rendering
  const seriesParts: string[] = [];
  if (spec.kind === "bar") {
    const slot = plotW / data.length;
    const barW = Math.max(2, slot * 0.65);
    data.forEach((d, i) => {
      const cx = PAD_L + slot * (i + 0.5);
      const x = cx - barW / 2;
      const y = yToPx(Math.max(d.value, 0));
      const baseY = yToPx(0);
      const height = Math.abs(yToPx(d.value) - baseY);
      const top = d.value >= 0 ? y : baseY;
      seriesParts.push(
        `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${height.toFixed(1)}" fill="var(--chart-color)" />`,
        `<text x="${cx.toFixed(1)}" y="${(PAD_T + plotH + 14).toFixed(1)}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">${escapeText(d.label)}</text>`
      );
    });
  } else {
    // line
    const step = data.length > 1 ? plotW / (data.length - 1) : 0;
    const points = data.map((d, i) => {
      const x = PAD_L + step * i;
      const y = yToPx(d.value);
      return { x, y, label: d.label };
    });
    const path = points
      .map((p, i) => (i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`))
      .join(" ");
    seriesParts.push(
      `<path d="${path}" fill="none" stroke="var(--chart-color)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />`
    );
    points.forEach((p) => {
      seriesParts.push(
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="var(--chart-color)" />`,
        `<text x="${p.x.toFixed(1)}" y="${(PAD_T + plotH + 14).toFixed(1)}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">${escapeText(p.label)}</text>`
      );
    });
  }

  // Title + axis labels
  const decoration: string[] = [];
  if (spec.title) {
    decoration.push(
      `<text x="${PAD_L}" y="${PAD_T - 16}" font-size="13" font-weight="600" fill="currentColor">${escapeText(spec.title)}</text>`
    );
  }
  if (spec.xLabel) {
    decoration.push(
      `<text x="${(PAD_L + (W - PAD_R)) / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6">${escapeText(spec.xLabel)}</text>`
    );
  }
  if (spec.yLabel) {
    decoration.push(
      `<text x="14" y="${PAD_T + plotH / 2}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6" transform="rotate(-90 14 ${PAD_T + plotH / 2})">${escapeText(spec.yLabel)}</text>`
    );
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeText(spec.title || "chart")}">${axisLines.join("")}${seriesParts.join("")}${decoration.join("")}</svg>`;
}

/**
 * Parse the editor's data textarea — accept either JSON or simple "label: value"
 * lines. Returns [] on any parse failure rather than throwing.
 *
 * Accepted forms:
 *
 *   [{"label": "Q1", "value": 12}, ...]
 *   Q1: 12
 *   Q1, 12
 *   Q1\t12
 */
export function parseChartData(input: string): ChartDatum[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Try JSON first
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr
          .map((row: any) => ({
            label: String(row?.label ?? row?.x ?? ""),
            value: Number(row?.value ?? row?.y ?? row?.v ?? 0),
          }))
          .filter((d) => d.label && Number.isFinite(d.value));
      }
    } catch {
      /* fallthrough to line parser */
    }
  }

  // Line-based parser: "label[:|,|	]value" per line
  return trimmed
    .split(/\r?\n/)
    .map((line) => {
      const m = line.match(/^\s*(.+?)\s*[:,\t]\s*(-?[\d.]+)\s*$/);
      if (!m) return null;
      const value = Number(m[2]);
      if (!Number.isFinite(value)) return null;
      return { label: m[1].trim(), value };
    })
    .filter(Boolean) as ChartDatum[];
}
