/**
 * CompanionMedia — embedded "Listen / Watch" card pointing to a podcast
 * episode or video that companions an article.
 *
 * Editorial pattern: when the article discusses something also covered
 * in a BGFI podcast or video, drop a card readers can tap to switch
 * formats. Implements proposal 3b from the Quarterly review.
 *
 * Atomic node with denormalized attrs so the card renders standalone
 * (no fetch needed on the reader side, no broken cards if backend is
 * cold). Editor refreshes the data on insertion, then it's frozen on
 * the article. Re-insert if a podcast title changes.
 *
 * Stored attrs:
 *   - kind: "podcast" | "video"
 *   - slug: episode/video slug (lookup key)
 *   - title: episode/video title at time of insert
 *   - thumbnail: cover/thumb URL
 *   - duration: human-readable duration ("32 min", "12:45")
 *   - url: full /podcasts/<show>/<slug> or /videos/<slug> path
 *
 * Rendered HTML (the reader-side card):
 *   <aside data-callout="companion" data-kind="podcast" data-slug="…">
 *     <a href="/podcasts/…">
 *       <img src="thumbnail" alt="title" />
 *       <div>
 *         <span>Listen · 32 min</span>
 *         <strong>Episode title</strong>
 *       </div>
 *     </a>
 *   </aside>
 *
 * CSS styling lives in globals.css under the .prose-journal section.
 */
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    companionMedia: {
      insertCompanionMedia: (attrs: {
        kind: "podcast" | "video";
        slug: string;
        title: string;
        thumbnail?: string;
        duration?: string;
        url: string;
      }) => ReturnType;
    };
  }
}

export const CompanionMedia = Node.create({
  name: "companionMedia",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      kind: { default: "podcast" },
      slug: { default: "" },
      title: { default: "" },
      thumbnail: { default: "" },
      duration: { default: "" },
      url: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'aside[data-callout="companion"]',
        getAttrs: (el) => {
          const root = el as HTMLElement;
          const a = root.querySelector("a");
          const img = root.querySelector("img");
          const eyebrow = root.querySelector("[data-companion-eyebrow]");
          const titleEl = root.querySelector("[data-companion-title]");
          // Eyebrow looks like "Listen · 32 min" → split off the duration.
          const eyebrowText = (eyebrow?.textContent || "").trim();
          const duration = eyebrowText.includes("·")
            ? eyebrowText.split("·").pop()?.trim() || ""
            : "";
          return {
            kind: root.getAttribute("data-kind") || "podcast",
            slug: root.getAttribute("data-slug") || "",
            title: (titleEl?.textContent || "").trim(),
            thumbnail: img?.getAttribute("src") || "",
            duration,
            url: a?.getAttribute("href") || "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const kind = (node.attrs.kind as string) || "podcast";
    const slug = (node.attrs.slug as string) || "";
    const title = (node.attrs.title as string) || "";
    const thumbnail = (node.attrs.thumbnail as string) || "";
    const duration = (node.attrs.duration as string) || "";
    const url =
      (node.attrs.url as string) ||
      (kind === "video" ? `/videos/${slug}` : `/podcasts/${slug}`);

    const verb = kind === "video" ? "Watch" : "Listen";
    const eyebrowText = duration ? `${verb} · ${duration}` : verb;

    const innerLeft = thumbnail
      ? ["img", { src: thumbnail, alt: title, "data-companion-thumb": "" }]
      : ["span", { "data-companion-thumb-placeholder": "" }, verb[0]];

    const innerRight = [
      "div",
      { "data-companion-body": "" },
      ["span", { "data-companion-eyebrow": "" }, eyebrowText],
      ["strong", { "data-companion-title": "" }, title || "Companion media"],
    ];

    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "companion",
        "data-kind": kind,
        "data-slug": slug,
      }),
      ["a", { href: url }, innerLeft, innerRight],
    ];
  },

  addCommands() {
    return {
      insertCompanionMedia:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              kind: attrs.kind,
              slug: attrs.slug,
              title: attrs.title,
              thumbnail: attrs.thumbnail || "",
              duration: attrs.duration || "",
              url: attrs.url,
            },
          }),
    };
  },
});
