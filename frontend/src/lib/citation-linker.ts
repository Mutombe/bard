/**
 * Citation Linking System
 *
 * Turns editorial citations into a linked reference apparatus:
 * - Reference list entries (paragraphs or list items that START with "[n]")
 *   get an anchor id ("ref-n") so they can be jumped to.
 * - Inline "[n]" markers in the body become superscript links that jump to
 *   the matching reference entry.
 * - Bare URLs inside reference entries become clickable outbound links to
 *   the original source.
 *
 * Pure string processing (no DOM APIs) so it is safe during SSR.
 */

// Sentinel used to shield reference-definition markers from the inline pass.
const REF_DEF = "⟦REFDEF:"; // ⟦REFDEF:n⟧
const REF_DEF_END = "⟧";

/**
 * Process article HTML and wire up citations.
 * Returns the HTML unchanged when the article has no reference list.
 */
export function linkCitations(html: string): string {
  if (!html || !html.includes("[")) return html;

  // 1. Tag reference definitions — block elements whose text starts with
  // "[n]". Give each an id and shield its marker from the inline pass.
  const refNumbers = new Set<string>();
  let result = html.replace(
    /<(p|li)((?:\s[^>]*)?)>(\s*(?:<(?!a\b)[^>]+>\s*)*)\[(\d{1,3})\]/gi,
    (match, tag, attrs, lead, num) => {
      // Don't double-tag an element that already carries an id.
      if (/\bid\s*=/.test(attrs)) return match;
      refNumbers.add(num);
      return `<${tag}${attrs} id="ref-${num}" class="citation-ref">${lead}${REF_DEF}${num}${REF_DEF_END}`;
    }
  );

  if (refNumbers.size === 0) return html;

  // 2. Make bare URLs clickable (reference entries and body alike) so the
  // original source is one click away. Skips URLs inside tag attributes and
  // URLs that are already anchor text.
  result = result.replace(
    /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)])(?![^<]*(?:>|<\/a>))/gi,
    (url) => {
      const label = url.replace(/^https?:\/\/(www\.)?/i, "");
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="citation-source-link">${label}</a>`;
    }
  );

  // 3. Link the inline [n] markers to their reference entries. The guard
  // keeps us out of tag attributes.
  result = result.replace(/\[(\d{1,3})\](?![^<]*>)/g, (match, num) => {
    if (!refNumbers.has(num)) return match;
    return `<sup class="citation"><a href="#ref-${num}" class="citation-link">[${num}]</a></sup>`;
  });

  // 4. Restore the shielded reference-definition markers.
  result = result.replace(
    new RegExp(`${REF_DEF}(\\d{1,3})${REF_DEF_END}`, "g"),
    "[$1]"
  );

  return result;
}
