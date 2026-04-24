/**
 * Homepage — server wrapper.
 *
 * The interactive feed lives in HomeView (client component). This server
 * wrapper does the SEO-critical work:
 *  1. Fetches the first 18 articles server-side so the rendered HTML
 *     Googlebot sees contains real headlines, not an empty shell.
 *  2. Exports metadata overriding the site-wide defaults with a homepage-
 *     specific title/description and canonical URL.
 *  3. Emits a CollectionPage + ItemList JSON-LD with the top articles
 *     so search engines understand this is the news index.
 *  4. Passes the SSR payload to HomeView as initialArticles so SWR
 *     hydrates from it — no loading flash, no duplicate fetch.
 */
import type { Metadata } from "next";
import HomeView from "./HomeView";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bardiq-api.onrender.com";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bgfi.global";

// Revalidate every 5 minutes — the homepage is the most time-sensitive
// page on the site; editors want new articles surfaced fast.
export const revalidate = 300;

interface FeedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  category?: { name?: string } | null;
  author?: { full_name?: string } | null;
  published_at?: string;
  [key: string]: any;
}

interface FeedResponse {
  results: FeedArticle[];
  count?: number;
  next?: string | null;
}

async function fetchInitialFeed(): Promise<FeedResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/news/articles/?page_size=18`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return (await res.json()) as FeedResponse;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Bard Global Finance Institute | African Finance, Markets & Research",
  description:
    "Daily editorial coverage of African capital markets, economies, and policy. Plus long-form research from Finance Africa Quarterly, AfriFin Analytics, and Africa Finance Insights.",
  alternates: { canonical: SITE_URL + "/" },
  openGraph: {
    type: "website",
    url: SITE_URL + "/",
    title: "Bard Global Finance Institute | African Finance, Markets & Research",
    description:
      "Daily editorial coverage of African capital markets, economies, and policy.",
    siteName: "Bard Global Finance Institute",
    locale: "en_ZA",
  },
};

export default async function HomePage() {
  const feed = await fetchInitialFeed();
  const articles = feed?.results || [];

  // ItemList schema for the homepage. Each entry is a lightweight reference
  // to a headline; Google crawls the full article schema on the detail page.
  // Combined with the CollectionPage wrapper, this signals "this is a news
  // index listing N articles" to search engines.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#homepage`,
    url: SITE_URL + "/",
    name: "Bard Global Finance Institute — Homepage",
    description:
      "Daily editorial coverage of African capital markets, economies, and policy.",
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: { "@id": `${SITE_URL}#organization` },
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: articles.length,
      itemListElement: articles.slice(0, 18).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/news/${a.slug}`,
        name: a.title,
      })),
    },
  };

  return (
    <>
      {/* Homepage-specific JSON-LD. The site-wide Organization + WebSite
          schemas live in app/layout.tsx and are referenced here via @id. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {/* Cast here: FeedArticle has loose optional fields vs NewsArticle's
          richer type in the client module. Runtime payload is identical. */}
      <HomeView initialFeed={(feed as any) || undefined} />
    </>
  );
}
