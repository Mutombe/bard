/**
 * AnalysisTemplate — drops a standardised five-section skeleton into the
 * editor for in-house analytical pieces.
 *
 * Sections (matches the editorial spec from the Quarterly review):
 *   1. Executive Summary
 *   2. Context / Background
 *   3. The Core Argument
 *   4. Risks & Mitigations
 *   5. Investment Implications
 *
 * Each section is an H2 with a placeholder paragraph below. Editors can
 * delete sections that don't apply or add subsections inside.
 *
 * Implementation: a small Extension with one command — `insertAnalysisTemplate`
 * — that the toolbar / floating menu can call. We don't define a new node
 * because the output is just standard headings + paragraphs (no special
 * markup needed for crawlers or styling).
 */
import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    analysisTemplate: {
      insertAnalysisTemplate: () => ReturnType;
    };
  }
}

// Add a `data-analysis-section` attribute to the heading node so the
// template can mark its five canonical headings ("01" through "05") and
// have them survive a round-trip through ProseMirror's serialization.
// Without this, StarterKit's heading would strip the attribute on save.
export const AnalysisSectionHeading = Extension.create({
  name: "analysisSectionHeading",
  addGlobalAttributes() {
    return [
      {
        types: ["heading"],
        attributes: {
          "data-analysis-section": {
            default: null,
            parseHTML: (el) =>
              (el as HTMLElement).getAttribute("data-analysis-section") || null,
            renderHTML: (attrs: Record<string, any>) =>
              attrs["data-analysis-section"]
                ? { "data-analysis-section": attrs["data-analysis-section"] }
                : {},
          },
        },
      },
    ];
  },
});

// Each section heading carries a `data-analysis-section` attribute with
// the section's two-digit step number. CSS in globals.css picks that up
// to render a primary-tinted "01.", "02." eyebrow + a thin top rule, so
// the standardised five-part structure is visually obvious to readers
// (proposal 2c — "use distinct typographical treatments for these
// standard sections"). Editors can still write H2s normally elsewhere
// in the article — only template-inserted headings get the treatment.
const TEMPLATE_HTML = `
<h2 data-analysis-section="01">Executive Summary</h2>
<p><em>Two or three sentences capturing the headline finding and what it means for investors.</em></p>
<h2 data-analysis-section="02">Context</h2>
<p><em>Set the macro / sector backdrop. What changed recently and why this analysis is timely?</em></p>
<h2 data-analysis-section="03">The Core Argument</h2>
<p><em>Lay out the central thesis with supporting evidence, data, and quotations.</em></p>
<h2 data-analysis-section="04">Risks &amp; Mitigations</h2>
<p><em>What could break this thesis? How are sophisticated investors hedging?</em></p>
<h2 data-analysis-section="05">Investment Implications</h2>
<p><em>Concrete actions: sectors / instruments to watch, allocation shifts, time horizons.</em></p>
<aside data-callout="bottom-line">
  <p><strong>The Bottom Line.</strong> One-paragraph actionable takeaway. Replace with the punchy summary you want scanners to leave with.</p>
</aside>
`;

export const AnalysisTemplate = Extension.create({
  name: "analysisTemplate",

  addCommands() {
    return {
      insertAnalysisTemplate:
        () =>
        ({ commands }) =>
          commands.insertContent(TEMPLATE_HTML),
    };
  },
});
