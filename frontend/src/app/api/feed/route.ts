/**
 * Feed proxy — same-origin API route at /api/feed.
 *
 * Browser → /api/feed (same origin, no CORS preflight)
 *          → Next.js server → bardiq-api.onrender.com/api/v1/news/articles/
 *          → response relayed back to the browser
 *
 * Editors were seeing the homepage load the first 18 articles (SSR, fine)
 * but the follow-up "load more" client request was getting CORS-blocked
 * because Render's proxy layer occasionally returns cold-start errors
 * that bypass Django's CORS middleware — leaving the response without
 * `Access-Control-Allow-Origin` and the browser discarding it.
 *
 * By proxying through this route, the browser only ever talks to
 * bgfi.global — same origin, no preflight, no CORS. The server-to-server
 * hop on the backend is unaffected by browser CORS rules.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bardiq-api.onrender.com";

// Short ISR so the feed stays fresh but we don't hammer the backend on
// every hover-load. 60s matches the homepage's own revalidate cadence
// for its initial SSR fetch.
export const revalidate = 60;

// Query params we accept and forward. Keeps the proxy narrow so it can't
// be used to hit arbitrary backend endpoints.
const ALLOWED_PARAMS = [
  "page",
  "page_size",
  "offset",
  "category",
  "status",
  "search",
  "ordering",
  "source",
  "content_type",
  "is_featured",
  "is_premium",
  "published_after",
  "published_before",
  "tag",
  "author_name",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forwarded = new URLSearchParams();
  for (const key of ALLOWED_PARAMS) {
    const v = searchParams.get(key);
    if (v) forwarded.set(key, v);
  }

  const qs = forwarded.toString();
  const upstream = `${API_URL}/api/v1/news/articles/${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(upstream, {
      // Next fetch cache — 60s revalidation window. Cache key is the full
      // URL (including query string), so different page sizes / offsets
      // don't collide.
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      // Relay the upstream status so the client can reason about it,
      // but return a minimal JSON body (never HTML) so axios doesn't
      // choke trying to parse a Django error page.
      return new Response(
        JSON.stringify({
          error: `Upstream returned ${res.status}`,
          results: [],
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Client/CDN cache. Short TTL + SWR so pages stay responsive
        // while new articles still appear within a minute of publish.
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    // Upstream unreachable / timeout / cold-start lockup — degrade
    // gracefully with an empty results array so the homepage doesn't
    // render broken instead of showing just the SSR'd articles.
    return new Response(
      JSON.stringify({
        error: "Upstream unreachable",
        detail: err?.message || String(err),
        results: [],
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
