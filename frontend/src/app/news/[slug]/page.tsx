/**
 * Article detail — server wrapper.
 *
 * This page is INTENTIONALLY a server component (no "use client") so that:
 *  1. `generateMetadata` runs on the server, producing a real <title>,
 *     <meta description>, Open Graph, Twitter Card, and canonical URL in
 *     the HTML that reaches Googlebot on first request. Previously the
 *     whole page was client-rendered, so crawlers saw only the generic
 *     site title and no article signals — articles couldn't rank.
 *  2. A JSON-LD NewsArticle schema is embedded in the initial HTML for
 *     Google News and rich-result eligibility.
 *  3. SSR-fetched article data is passed to the client component as
 *     fallback data, so the interactive UI hydrates instantly with no
 *     loading flash AND crawlers see the full copy in the initial HTML.
 *
 * The interactive parts (lightbox, like/bookmark, comments, sticky header,
 * reading progress) still live in the client component ArticleView.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "./ArticleView";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bardiq-api.onrender.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bgfi.global";

interface PageProps {
  // Next.js 14.2 — params is a sync object. (In 15+ it becomes a Promise;
  // upgrade path would switch this to Promise<{slug: string}> and `await`.)
  params: { slug: string };
}

interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  featured_image_caption?: string;
  category?: { name?: string; slug?: string } | null;
  author?: { full_name?: string; email?: string } | null;
  writer?: { full_name?: string; slug?: string } | null;
  tags?: Array<{ name?: string; slug?: string } | string>;
  published_at?: string;
  updated_at?: string;
  created_at?: string;
  meta_title?: string;
  meta_description?: string;
  is_premium?: boolean;
  [key: string]: any;
}

/**
 * Fetch the article server-side. Cached for 5 minutes so metadata resolution
 * doesn't hammer the backend — SWR on the client re-fetches fresh data on
 * mount, and the next.js fetch cache is invalidated on redeploy.
 */
// Distinguished return so the Page handler can 404 on a real missing
// article but fall through to client-side hydration on transient errors
// (Render cold start, a flaky connection, etc.) without turning the
// article into a 404 for users and Googlebot.
type FetchResult =
  | { status: "ok"; article: ArticleSummary }
  | { status: "not_found" }
  | { status: "error" };

async function fetchArticle(slug: string): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_URL}/api/v1/news/articles/${slug}/`, {
      // 5 min cache so editors see edits propagate without force-push
      next: { revalidate: 300 },
    });
    if (res.status === 404) return { status: "not_found" };
    if (!res.ok) return { status: "error" };
    return { status: "ok", article: (await res.json()) as ArticleSummary };
  } catch {
    return { status: "error" };
  }
}

/**
 * Strip HTML tags + decode common entities, then collapse whitespace, then
 * truncate at a word boundary. Used for meta description when the editor
 * didn't provide a dedicated meta_description.
 */
function htmlToPlain(html: string, maxLen = 160): string {
  const noTags = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  const clean = noTags.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const slice = clean.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice).trim() + "…";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const result = await fetchArticle(slug);

  if (result.status === "not_found") {
    return {
      title: "Article not found | BGFI",
      description: "The article you're looking for could not be found.",
      robots: { index: false, follow: false },
    };
  }
  if (result.status === "error") {
    // Backend unavailable during SSR — return minimal defaults and let
    // the client finish rendering once it hydrates. Don't de-index.
    return {
      title: "BGFI — Bard Global Finance Institute",
      description: "Africa's leading financial and investment publication.",
    };
  }
  const article = result.article;

  const title = article.meta_title?.trim() || article.title;
  const description =
    article.meta_description?.trim() ||
    article.excerpt?.trim() ||
    article.subtitle?.trim() ||
    (article.content ? htmlToPlain(article.content) : "") ||
    "Read this article on BGFI — Africa's leading finance publication.";
  const url = `${SITE_URL}/news/${article.slug}`;
  const image = article.featured_image;
  const publishedAt = article.published_at || article.created_at;
  const modifiedAt = article.updated_at || publishedAt;
  const authorName =
    article.writer?.full_name || article.author?.full_name || "BGFI Staff";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Bard Global Finance Institute",
      locale: "en_US",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
      ...(publishedAt ? { publishedTime: publishedAt } : {}),
      ...(modifiedAt ? { modifiedTime: modifiedAt } : {}),
      authors: [authorName],
      ...(article.category?.name ? { section: article.category.name } : {}),
      tags: (article.tags || [])
        .map((t) => (typeof t === "string" ? t : t.name || ""))
        .filter(Boolean) as string[],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: {
      index: !article.is_premium, // don't index gated content
      follow: true,
      googleBot: { index: !article.is_premium, follow: true, "max-image-preview": "large" },
    },
    authors: [{ name: authorName }],
    ...(article.category?.name ? { category: article.category.name } : {}),
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = params;
  const result = await fetchArticle(slug);

  if (result.status === "not_found") {
    notFound();
  }
  // If the backend errored transiently, skip SSR hydration + JSON-LD and
  // let ArticleView fetch on the client. Users still get a working page.
  if (result.status === "error") {
    return <ArticleView slug={slug} />;
  }
  const article = result.article;

  // Build the NewsArticle JSON-LD schema. This is the structured-data
  // signal Google looks for on news content — it unlocks eligibility for
  // Google News, Top Stories carousel, and rich results.
  const url = `${SITE_URL}/news/${article.slug}`;
  const authorName =
    article.writer?.full_name || article.author?.full_name || "BGFI Staff";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description:
      article.meta_description ||
      article.excerpt ||
      article.subtitle ||
      (article.content ? htmlToPlain(article.content, 300) : ""),
    image: article.featured_image ? [article.featured_image] : undefined,
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.published_at || article.created_at,
    author: {
      "@type": "Person",
      name: authorName,
      url: article.writer?.slug ? `${SITE_URL}/people/${article.writer.slug}` : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "Bard Global Finance Institute",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/fav.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(article.category?.name ? { articleSection: article.category.name } : {}),
    ...(article.tags?.length
      ? {
          keywords: article.tags
            .map((t) => (typeof t === "string" ? t : t.name || ""))
            .filter(Boolean)
            .join(", "),
        }
      : {}),
    isAccessibleForFree: !article.is_premium,
    url,
  };

  return (
    <>
      {/* JSON-LD structured data — landed in the initial HTML so crawlers
          read it on first request. Google uses this to decide Top Stories
          eligibility, rich results, and Google News inclusion. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleView slug={slug} initialArticle={article} />
    </>
  );
}
