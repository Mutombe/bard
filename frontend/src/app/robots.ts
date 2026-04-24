/**
 * robots.txt — served at https://bgfi.global/robots.txt
 *
 * Next.js App Router file-based metadata: this module is read at build
 * (or request) time and emits the text response. Points crawlers at
 * BOTH the main sitemap (all indexable pages) AND the news sitemap
 * (articles from the last 48 hours, in Google News format).
 */
import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bgfi.global";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Crawl budget: keep bots out of auth / admin / API surfaces.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/login",
          "/register",
          "/settings",
          "/notifications",
          "/saved",
          "/watchlist",
          "/portfolio",
          "/alerts",
        ],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-news.xml`,
    ],
    host: SITE_URL,
  };
}
