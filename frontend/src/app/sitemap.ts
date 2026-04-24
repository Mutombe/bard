/**
 * sitemap.xml — served at https://bgfi.global/sitemap.xml
 *
 * Next.js App Router file-based sitemap. Lists:
 *  - Every static indexable page on the marketing site
 *  - Every published NewsArticle (paginated fetch from the backend)
 *
 * Revalidates hourly so new articles show up in the sitemap without
 * a redeploy. Google re-crawls the sitemap multiple times a day for
 * active news sites.
 */
import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bgfi.global";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bardiq-api.onrender.com";

// Revalidate the sitemap every hour. For a news site this is a good
// trade-off — articles show up in Google's crawl fast enough, and we
// don't hammer the backend on every crawler hit.
export const revalidate = 3600;

interface ArticleSitemapEntry {
  slug: string;
  updated_at?: string;
  published_at?: string;
  created_at?: string;
}

interface PagedResponse<T> {
  results: T[];
  next?: string | null;
  count?: number;
}

/**
 * Fetch every published article from the backend. Paginates up to a
 * safety cap (4000) so the sitemap stays well under the 50 000-URL
 * limit Google enforces per sitemap file.
 */
async function fetchAllArticles(): Promise<ArticleSitemapEntry[]> {
  const all: ArticleSitemapEntry[] = [];
  const MAX_TOTAL = 4000;
  const PAGE_SIZE = 200;
  let page = 1;

  while (all.length < MAX_TOTAL) {
    try {
      const res = await fetch(
        `${API_URL}/api/v1/news/articles/?page=${page}&page_size=${PAGE_SIZE}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const data = (await res.json()) as PagedResponse<ArticleSitemapEntry>;
      const batch = Array.isArray(data.results) ? data.results : [];
      all.push(...batch);
      if (batch.length < PAGE_SIZE || !data.next) break;
      page += 1;
    } catch {
      break;
    }
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static marketing + section pages. Priority reflects editorial
  // importance: homepage and news section at the top, then research /
  // insights, then supplementary pages.
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/insights`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/research`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/analysis`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/opinions`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/columns`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/markets`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/videos`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/podcasts`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/webinars`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/publications`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/topics`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/industries`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/regions`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/advertise`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/subscribe`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/accessibility`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Article entries — one per published NewsArticle.
  const articles = await fetchAllArticles();
  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((a) => a.slug)
    .map((a) => {
      const rawDate = a.updated_at || a.published_at || a.created_at;
      return {
        url: `${SITE_URL}/news/${a.slug}`,
        lastModified: rawDate ? new Date(rawDate) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });

  return [...staticEntries, ...articleEntries];
}
