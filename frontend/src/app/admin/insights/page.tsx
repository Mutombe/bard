"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Download,
  Globe,
  Users,
  TrendUp,
  Article,
  Books,
  MapPin,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import apiClient from "@/services/api/client";
import { Skeleton } from "@/components/ui/loading";

interface InsightsData {
  period_days: number;
  totals: {
    article_views: number;
    research_views: number;
    research_downloads: number;
    unique_authenticated_readers: number;
  };
  top_articles: Array<{
    article__id: string;
    article__title: string;
    article__slug: string;
    article__category__name: string | null;
    view_count: number;
  }>;
  top_research: Array<{
    report__id: string;
    report__title: string;
    report__slug: string;
    report__report_type: string;
    view_count: number;
  }>;
  top_downloads: Array<{
    report__id: string;
    report__title: string;
    report__slug: string;
    download_count: number;
  }>;
  geo_distribution: Array<{ country: string; country_name: string; count: number }>;
  top_cities: Array<{ city: string; country_name: string; count: number }>;
  traffic_sources: Array<{ source: string; count: number }>;
  authenticated_breakdown: {
    articles: { authenticated: number; anonymous: number };
    research: { authenticated: number; anonymous: number };
  };
  top_readers: Array<{
    user__id: string;
    user__email: string;
    user__first_name: string;
    user__last_name: string;
    view_count: number;
  }>;
  daily_trend: Array<{ date: string; views: number }>;
  category_interest: Array<{
    article__category__name: string;
    article__category__slug: string;
    views: number;
  }>;
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/analytics/insights/?days=${days}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const StatCard = ({ icon: Icon, label, value, suffix = "" }: any) => (
    <div className="p-5 bg-terminal-bg-secondary border border-terminal-border">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-3xl font-bold tabular-nums">{value.toLocaleString()}{suffix}</div>
    </div>
  );

  const maxDailyView = Math.max(...(data?.daily_trend?.map((d) => d.views) || [1]));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Reader Insights</h1>
          <p className="text-sm text-muted-foreground">
            What readers engage with — for product-market fit decisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                days === d
                  ? "bg-brand-plum text-white border-brand-plum"
                  : "border-terminal-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Last {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !data ? (
        <div className="p-8 bg-terminal-bg-secondary border border-terminal-border text-center text-muted-foreground">
          No insight data available yet — check back as readers engage.
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Eye} label="Article Views" value={data.totals.article_views} />
            <StatCard icon={Books} label="Research Views" value={data.totals.research_views} />
            <StatCard icon={Download} label="Downloads" value={data.totals.research_downloads} />
            <StatCard
              icon={Users}
              label="Unique Logged-in Readers"
              value={data.totals.unique_authenticated_readers}
            />
          </div>

          {/* Daily trend */}
          {data.daily_trend.length > 0 && (
            <section className="mb-10 p-6 bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendUp className="h-5 w-5 text-brand-coral" /> Daily Reading Trend
              </h2>
              <div className="flex items-end gap-1 h-32">
                {data.daily_trend.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-brand-violet/30 hover:bg-brand-violet transition-colors relative group"
                    style={{ height: `${(d.views / maxDailyView) * 100}%` }}
                    title={`${d.date}: ${d.views} views`}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 whitespace-nowrap bg-brand-plum text-white px-2 py-0.5">
                      {d.views}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Top articles */}
            <section className="p-6 bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Article className="h-5 w-5 text-brand-violet" /> Top Articles
              </h2>
              <div className="space-y-2">
                {data.top_articles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No views yet</p>
                )}
                {data.top_articles.map((a) => (
                  <Link
                    key={a.article__id}
                    href={`/news/${a.article__slug}`}
                    target="_blank"
                    className="flex items-center justify-between gap-2 py-2 border-b border-terminal-border last:border-0 hover:text-brand-coral"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{a.article__title}</div>
                      {a.article__category__name && (
                        <div className="text-xs text-muted-foreground">
                          {a.article__category__name}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-mono tabular-nums font-bold">{a.view_count}</div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Geo distribution */}
            <section className="p-6 bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-brand-coral" /> Where Readers Are
              </h2>
              <div className="space-y-2">
                {data.geo_distribution.length === 0 && (
                  <p className="text-sm text-muted-foreground">No geo data yet</p>
                )}
                {data.geo_distribution.map((g) => (
                  <div
                    key={g.country}
                    className="flex items-center justify-between py-2 border-b border-terminal-border last:border-0"
                  >
                    <span className="text-sm">
                      {g.country_name || g.country}
                      <span className="text-xs text-muted-foreground ml-2">{g.country}</span>
                    </span>
                    <span className="text-sm font-mono tabular-nums font-bold">{g.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Top research */}
            <section className="p-6 bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Books className="h-5 w-5 text-brand-plum" /> Top Research Reports
              </h2>
              <div className="space-y-2">
                {data.top_research.length === 0 && (
                  <p className="text-sm text-muted-foreground">No research views yet</p>
                )}
                {data.top_research.map((r) => (
                  <Link
                    key={r.report__id}
                    href={`/publications/${r.report__report_type}/${r.report__slug}`}
                    target="_blank"
                    className="flex items-center justify-between gap-2 py-2 border-b border-terminal-border last:border-0 hover:text-brand-coral"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.report__title}</div>
                      <div className="text-xs text-muted-foreground">{r.report__report_type}</div>
                    </div>
                    <div className="text-sm font-mono tabular-nums font-bold">{r.view_count}</div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Traffic sources */}
            <section className="p-6 bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ArrowSquareOut className="h-5 w-5 text-brand-violet" /> Traffic Sources
              </h2>
              <div className="space-y-2">
                {data.traffic_sources.length === 0 && (
                  <p className="text-sm text-muted-foreground">No source data yet</p>
                )}
                {data.traffic_sources.map((s) => (
                  <div
                    key={s.source}
                    className="flex items-center justify-between py-2 border-b border-terminal-border last:border-0"
                  >
                    <span className="text-sm capitalize">{s.source}</span>
                    <span className="text-sm font-mono tabular-nums font-bold">{s.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Top cities */}
            {data.top_cities.length > 0 && (
              <section className="p-6 bg-terminal-bg-secondary border border-terminal-border">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-coral" /> Top Cities
                </h2>
                <div className="space-y-2">
                  {data.top_cities.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-terminal-border last:border-0"
                    >
                      <span className="text-sm">
                        {c.city}
                        <span className="text-xs text-muted-foreground ml-2">{c.country_name}</span>
                      </span>
                      <span className="text-sm font-mono tabular-nums font-bold">{c.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Top readers */}
            {data.top_readers.length > 0 && (
              <section className="p-6 bg-terminal-bg-secondary border border-terminal-border">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-plum" /> Most Engaged Readers
                </h2>
                <div className="space-y-2">
                  {data.top_readers.map((r) => (
                    <div
                      key={r.user__id}
                      className="flex items-center justify-between py-2 border-b border-terminal-border last:border-0"
                    >
                      <div className="text-sm">
                        <div className="font-medium">
                          {r.user__first_name || ""} {r.user__last_name || ""}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.user__email}</div>
                      </div>
                      <span className="text-sm font-mono tabular-nums font-bold">{r.view_count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Authenticated breakdown */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-6 bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Articles</h3>
              <div className="text-3xl font-bold mb-1">
                {data.authenticated_breakdown.articles.authenticated.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                logged-in views vs {data.authenticated_breakdown.articles.anonymous.toLocaleString()} anonymous
              </div>
            </div>
            <div className="p-6 bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Research</h3>
              <div className="text-3xl font-bold mb-1">
                {data.authenticated_breakdown.research.authenticated.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                logged-in views vs {data.authenticated_breakdown.research.anonymous.toLocaleString()} anonymous
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
