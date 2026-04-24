/**
 * Google News sitemap — served at https://bgfi.global/sitemap-news.xml
 *
 * Google News requires a DIFFERENT sitemap format than the standard
 * Sitemaps.org protocol: each URL entry must include a `<news:news>`
 * block with publication name, language, publication date, and title.
 * Articles should be from the last 2 days (Google ignores older ones
 * in this sitemap) and the file is capped at 1000 URLs.
 *
 * This lives at a bespoke route (not Next.js's `app/sitemap.ts`) because
 * the default sitemap API doesn't support the news namespace.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bgfi.global";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bardiq-api.onrender.com";

// Revalidate every 15 minutes — news sitemaps should reflect the latest
// publications quickly, but we don't want to hammer the backend.
export const revalidate = 900;

interface NewsArticle {
  slug: string;
  title: string;
  published_at?: string;
  created_at?: string;
  category?: { name?: string } | null;
  tags?: Array<{ name?: string } | string>;
}

/**
 * XML-escape a string. Titles can contain `&`, `<`, `>`, `"`, `'` —
 * all of which break XML parsing if left unescaped.
 */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Fetch articles published in the last 48 hours. Uses the backend's
 * `published_after` filter so we only pull what we need.
 */
async function fetchRecentArticles(): Promise<NewsArticle[]> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const url = `${API_URL}/api/v1/news/articles/?published_after=${encodeURIComponent(
    since
  )}&page_size=200&ordering=-published_at`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    // Cap at 1000 per Google News spec, though we're unlikely to hit it.
    return (results as NewsArticle[]).slice(0, 1000);
  } catch {
    return [];
  }
}

export async function GET() {
  const articles = await fetchRecentArticles();

  const urlBlocks = articles
    .filter((a) => a.slug && a.title)
    .map((a) => {
      const publishedAt = a.published_at || a.created_at || new Date().toISOString();
      const keywords = (a.tags || [])
        .map((t) => (typeof t === "string" ? t : t.name || ""))
        .filter(Boolean)
        .slice(0, 10) // Google ignores anything past the first ~10
        .join(", ");
      return `  <url>
    <loc>${SITE_URL}/news/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Bard Global Finance Institute</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publishedAt}</news:publication_date>
      <news:title>${xmlEscape(a.title)}</news:title>${
        keywords ? `\n      <news:keywords>${xmlEscape(keywords)}</news:keywords>` : ""
      }
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlBlocks}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Browser/CDN cache header — aligns with revalidate window above.
      "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
    },
  });
}
