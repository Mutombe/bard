"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  FileText,
  UserPlus,
  Eye,
  MessageSquare,
  Mail,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Crown,
  BarChart3,
  Heart,
  Activity,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/loading";
import { authClient } from "@/services/api/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DateRange = "7d" | "30d" | "90d" | "all";

interface AnalyticsData {
  period: string;
  generated_at: string;
  users: {
    total_users: number;
    active_in_period: number;
    new_users_in_period: number;
    role_breakdown: { role: string; count: number }[];
    tier_breakdown: { subscription_tier: string; count: number }[];
    registration_trend: { date: string; count: number }[];
  };
  content: {
    articles_by_status: { status: string; count: number }[];
    total_published: number;
    published_in_period: number;
    total_view_count: number;
    top_articles_by_views: {
      id: number;
      title: string;
      slug: string;
      view_count: number;
      category__name: string;
      author__first_name: string;
      author__last_name: string;
      published_at: string;
      is_premium: boolean;
    }[];
    publishing_trend: { date: string; count: number }[];
  };
  engagement: {
    total_comments: number;
    new_comments_in_period: number;
    avg_comments_per_article: number;
    top_commented_articles: {
      id: number;
      title: string;
      slug: string;
      comment_count: number;
      view_count: number;
    }[];
    top_commenters: {
      author__email: string;
      author__first_name: string;
      author__last_name: string;
      comment_count: number;
    }[];
    total_article_views_raw: number;
    article_views_in_period: number;
    unique_viewers_in_period: number;
    total_comment_likes: number;
  };
  newsletters: {
    total_subscribers: number;
    active_subscribers: number;
    new_in_period: number;
    by_type: { newsletter_type: string; count: number }[];
    trend: { date: string; count: number }[];
  };
  subscriptions: {
    active_by_plan: { plan__plan_type: string; plan__name: string; count: number }[];
    status_breakdown: { status: string; count: number }[];
    total_revenue_all_time_usd: number;
    revenue_in_period_usd: number;
    revenue_by_currency: { currency: string; total: number; count: number }[];
    mrr_usd: number;
    revenue_trend: { date: string; currency: string; total: number; count: number }[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatMoney(usd: number): string {
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    editor: "Editor",
    analyst: "Analyst",
    subscriber: "Subscriber",
  };
  return map[role] || role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTier(tier: string): string {
  const map: Record<string, string> = {
    free: "Free",
    basic: "Basic",
    professional: "Professional",
    enterprise: "Enterprise",
  };
  return map[tier] || tier.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNewsletterType(type: string): string {
  const map: Record<string, string> = {
    morning_brief: "Morning Brief",
    evening_wrap: "Evening Wrap",
    weekly_digest: "Weekly Digest",
    breaking_news: "Breaking News",
    earnings: "Earnings Alerts",
  };
  return map[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusColor(status: string): string {
  switch (status) {
    case "published":
      return "bg-market-up/20 text-market-up";
    case "draft":
      return "bg-muted text-muted-foreground";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400";
    case "archived":
      return "bg-market-down/20 text-market-down";
    case "active":
      return "bg-market-up/20 text-market-up";
    case "trialing":
      return "bg-blue-500/20 text-blue-400";
    case "canceled":
    case "expired":
      return "bg-market-down/20 text-market-down";
    case "past_due":
      return "bg-yellow-500/20 text-yellow-400";
    case "paused":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function TrendBar({
  data,
  label,
  barClass = "bg-brand-orange/60 hover:bg-brand-orange",
}: {
  data: { date: string; count: number }[];
  label?: string;
  /** Pass full Tailwind classes for base + hover, e.g. "bg-blue-400/60 hover:bg-blue-400" */
  barClass?: string;
  /** @deprecated use barClass instead */
  accentColor?: string;
}) {
  if (!data.length) {
    return (
      <EmptyState message="No trend data available" sub="Data will appear once activity is recorded" />
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="px-4 py-3">
      {/* Summary line */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          {label || "Trend"}
        </span>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Chart area */}
      <div className="relative">
        {/* Y-axis max reference */}
        <div className="absolute top-0 right-0 text-2xs font-mono tabular-nums text-muted-foreground/40 leading-none">
          {max}
        </div>
        <div className="absolute bottom-0 right-0 text-2xs font-mono tabular-nums text-muted-foreground/40 leading-none">
          0
        </div>

        {/* Bars */}
        <div className="flex items-end gap-[2px] h-32 pr-7">
          {data.map((d) => {
            const heightPct = (d.count / max) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center group relative min-w-[3px]">
                <div
                  className={cn("w-full min-h-[3px] transition-all duration-200", barClass)}
                  style={{ height: `${heightPct}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-terminal-bg-elevated border border-terminal-border text-xs px-2.5 py-1.5 whitespace-nowrap z-10 shadow-theme-md pointer-events-none">
                  <div className="font-mono tabular-nums font-medium">{d.count.toLocaleString()}</div>
                  <div className="text-muted-foreground text-2xs mt-0.5">{d.date}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis: first and last dates */}
        {data.length >= 2 && (
          <div className="flex justify-between mt-2 pr-7">
            <span className="text-2xs text-muted-foreground/50 font-mono">
              {data[0].date.slice(5)}
            </span>
            <span className="text-2xs text-muted-foreground/50 font-mono">
              {data[data.length - 1].date.slice(5)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({
  icon: Icon,
  message,
  sub,
}: {
  icon?: React.ElementType;
  message: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      {Icon && (
        <div className="h-10 w-10 flex items-center justify-center bg-terminal-bg-elevated mb-3">
          <Icon className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
      {sub && <p className="text-2xs text-muted-foreground/60 mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4 mb-6", count === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4")}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-terminal-bg-secondary border border-terminal-border p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-24 mb-1.5" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-terminal-border">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable pieces
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor = "text-brand-orange/60",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
}) {
  return (
    <div className="bg-terminal-bg-secondary border border-terminal-border p-4 hover:border-terminal-border-light hover:shadow-theme-sm transition-all duration-200 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("h-4 w-4 transition-colors group-hover:opacity-100 opacity-60", iconColor)} />
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <span className="text-xs text-muted-foreground mt-1.5 block">{sub}</span>}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  iconColor = "text-brand-orange/70",
}: {
  icon: React.ElementType;
  title: string;
  iconColor?: string;
}) {
  return (
    <div className="px-4 py-2.5 border-b border-terminal-border bg-terminal-bg-elevated/30">
      <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
        {title}
      </h3>
    </div>
  );
}

function MiniTable({
  headers,
  rows,
  emptyMsg = "No data",
  emptyIcon,
  alignRight = [],
}: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  emptyMsg?: string;
  emptyIcon?: React.ElementType;
  alignRight?: number[];
}) {
  if (!rows.length) {
    return <EmptyState icon={emptyIcon} message={emptyMsg} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-terminal-border">
            {headers.map((h, i) => (
              <th
                key={h}
                className={cn(
                  "px-4 py-2.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground",
                  alignRight.includes(i) ? "text-right" : "text-left",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-terminal-border/50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-terminal-bg-elevated/50 transition-colors duration-150">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-4 py-2.5",
                    alignRight.includes(j) ? "text-right font-mono tabular-nums font-medium" : "",
                  )}
                >
                  {typeof cell === "number" ? cell.toLocaleString() : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const res = await authClient.get(`/analytics/comprehensive/?range=${dateRange}`);
        setData(res.data);
        if (showRefresh) {
          setRefreshDone(true);
          setTimeout(() => setRefreshDone(false), 1500);
        }
      } catch {
        setError("Failed to load analytics data. Please try again.");
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const premiumUsers =
    data?.users.tier_breakdown
      .filter((t) => t.subscription_tier !== "free")
      .reduce((sum, t) => sum + t.count, 0) ?? 0;

  const pendingReview =
    data?.content.articles_by_status.find((s) => s.status === "pending")?.count ?? 0;

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Platform Analytics</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Live data from production</span>
            {data?.generated_at && (
              <>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="text-xs">
                  Updated {new Date(data.generated_at).toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50 self-start"
          title="Refresh"
        >
          {refreshDone ? (
            <Check className="h-5 w-5 text-market-up" />
          ) : (
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-market-down/10 border border-market-down/30">
          <AlertCircle className="h-5 w-5 text-market-down flex-shrink-0" />
          <p className="text-sm text-market-down">{error}</p>
          <button
            onClick={() => fetchData()}
            className="ml-auto px-3 py-1.5 text-xs font-medium uppercase tracking-wide bg-market-down/20 text-market-down hover:bg-market-down/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Date Range Selector */}
      {(() => {
        const dateRangeOptions = [
          { key: "7d" as const, label: "7 Days" },
          { key: "30d" as const, label: "30 Days" },
          { key: "90d" as const, label: "90 Days" },
          { key: "all" as const, label: "All Time" },
        ];
        return (
          <div className="mb-6">
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {dateRangeOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDateRange(key)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all duration-150",
                    dateRange === key
                      ? "bg-brand-orange text-white shadow-sm"
                      : "bg-terminal-bg-secondary border border-terminal-border text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated active:scale-[0.97]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Mobile select */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="sm:hidden w-full bg-terminal-bg-secondary border border-terminal-border text-sm px-3 py-2 focus:outline-none focus:border-brand-orange transition-colors"
            >
              {dateRangeOptions.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        );
      })()}

      {/* Live indicator */}
      {data && !loading && (
        <div className="flex items-center gap-2 mb-8 text-2xs text-muted-foreground/60">
          <div className="h-1.5 w-1.5 rounded-full bg-market-up animate-pulse" />
          <span className="font-mono">
            Data as of {new Date(data.generated_at).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ================================================================ */}
      {/* SECTION 1 — Users */}
      {/* ================================================================ */}
      <section className="mb-10">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-terminal-border">
        <div className="h-8 w-8 flex items-center justify-center bg-brand-orange/10">
          <Users className="h-4 w-4 text-brand-orange" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">User Analytics</h2>
        </div>
      </div>
      {loading ? (
        <StatsSkeleton />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users} label="Total Users" value={data.users.total_users} iconColor="text-brand-orange" />
            <StatCard icon={UserPlus} label="New in Period" value={data.users.new_users_in_period} iconColor="text-brand-orange" />
            <StatCard icon={Activity} label="Active in Period" value={data.users.active_in_period} iconColor="text-brand-orange" />
            <StatCard icon={Crown} label="Premium Users" value={premiumUsers} iconColor="text-brand-orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={Users} title="Roles" iconColor="text-brand-orange/70" />
              <MiniTable
                headers={["Role", "Count"]}
                rows={data.users.role_breakdown.map((r) => [formatRole(r.role), r.count])}
                alignRight={[1]}
                emptyIcon={Users}
              />
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={Crown} title="Subscription Tiers" iconColor="text-brand-orange/70" />
              <MiniTable
                headers={["Tier", "Count"]}
                rows={data.users.tier_breakdown.map((t) => [formatTier(t.subscription_tier), t.count])}
                alignRight={[1]}
                emptyIcon={Crown}
              />
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={TrendingUp} title="Registration Trend" iconColor="text-brand-orange/70" />
              <TrendBar data={data.users.registration_trend} label="New Registrations" barClass="bg-brand-orange/60 hover:bg-brand-orange" />
            </div>
          </div>
        </>
      ) : null}
      </section>

      {/* ================================================================ */}
      {/* SECTION 2 — Content */}
      {/* ================================================================ */}
      <section className="mb-10">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-terminal-border">
        <div className="h-8 w-8 flex items-center justify-center bg-blue-400/10">
          <FileText className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">Content Analytics</h2>
        </div>
      </div>
      {loading ? (
        <>
          <StatsSkeleton />
          <TableSkeleton />
        </>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={FileText} label="Total Published" value={data.content.total_published} iconColor="text-blue-400" />
            <StatCard icon={FileText} label="Published in Period" value={data.content.published_in_period} iconColor="text-blue-400" />
            <StatCard icon={Eye} label="Total Views" value={data.content.total_view_count} iconColor="text-blue-400" />
            <StatCard icon={AlertCircle} label="Pending Review" value={pendingReview} iconColor="text-yellow-400" />
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {data.content.articles_by_status.map((s) => (
              <span
                key={s.status}
                className={cn(
                  "px-2.5 py-1 text-2xs font-medium uppercase tracking-wide",
                  getStatusColor(s.status),
                )}
              >
                {s.status}: <span className="font-mono tabular-nums">{s.count}</span>
              </span>
            ))}
          </div>

          {/* Top 10 articles */}
          <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden mb-6">
            <SectionHeader icon={BarChart3} title="Top 10 Most Viewed Articles" iconColor="text-blue-400/70" />
            {data.content.top_articles_by_views.length === 0 ? (
              <EmptyState icon={FileText} message="No published articles yet" sub="Articles will appear here once published" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-terminal-border">
                      <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-wider text-muted-foreground w-12">#</th>
                      <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-wider text-muted-foreground">Title</th>
                      <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
                      <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Author</th>
                      <th className="px-4 py-2.5 text-right text-2xs font-medium uppercase tracking-wider text-muted-foreground">Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-terminal-border/50">
                    {data.content.top_articles_by_views.map((a, i) => (
                      <tr key={a.id} className="hover:bg-terminal-bg-elevated/50 transition-colors duration-150">
                        <td className="px-4 py-2.5 w-12">
                          <span className="inline-flex items-center justify-center h-6 w-6 text-2xs font-mono font-medium bg-terminal-bg-elevated text-muted-foreground">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium max-w-xs truncate">
                          {a.title}
                          {a.is_premium && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-400">
                              PRO
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{a.category__name || "---"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell">
                          {a.author__first_name} {a.author__last_name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium">{a.view_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Publishing Trend -- uses publishing_trend data from API that was previously unused */}
          {data.content.publishing_trend.length > 0 && (
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={TrendingUp} title="Publishing Trend" iconColor="text-blue-400/70" />
              <TrendBar data={data.content.publishing_trend} label="Articles Published" barClass="bg-blue-400/60 hover:bg-blue-400" />
            </div>
          )}
        </>
      ) : null}
      </section>

      {/* ================================================================ */}
      {/* SECTION 3 — Engagement */}
      {/* ================================================================ */}
      <section className="mb-10">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-terminal-border">
        <div className="h-8 w-8 flex items-center justify-center bg-market-up/10">
          <MessageSquare className="h-4 w-4 text-market-up" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">Engagement Analytics</h2>
        </div>
      </div>
      {loading ? (
        <StatsSkeleton />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={MessageSquare} label="Total Comments" value={data.engagement.total_comments} iconColor="text-market-up" />
            <StatCard icon={MessageSquare} label="New Comments" value={data.engagement.new_comments_in_period} iconColor="text-market-up" />
            <StatCard icon={Eye} label="Unique Viewers" value={data.engagement.unique_viewers_in_period} iconColor="text-market-up" />
            <StatCard icon={Heart} label="Comment Likes" value={data.engagement.total_comment_likes} iconColor="text-market-up" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={MessageSquare} title="Top Commented Articles" iconColor="text-market-up/70" />
              <MiniTable
                headers={["Title", "Comments", "Views"]}
                rows={data.engagement.top_commented_articles.map((a) => [
                  a.title.length > 50 ? a.title.slice(0, 50) + "..." : a.title,
                  a.comment_count,
                  a.view_count,
                ])}
                alignRight={[1, 2]}
                emptyMsg="No comments yet"
                emptyIcon={MessageSquare}
              />
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={Users} title="Top Commenters" iconColor="text-market-up/70" />
              <MiniTable
                headers={["Name", "Email", "Comments"]}
                rows={data.engagement.top_commenters.map((c) => [
                  `${c.author__first_name} ${c.author__last_name}`,
                  c.author__email,
                  c.comment_count,
                ])}
                alignRight={[2]}
                emptyMsg="No commenters yet"
                emptyIcon={Users}
              />
            </div>
          </div>
        </>
      ) : null}
      </section>

      {/* ================================================================ */}
      {/* SECTION 4 — Newsletters */}
      {/* ================================================================ */}
      <section className="mb-10">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-terminal-border">
        <div className="h-8 w-8 flex items-center justify-center bg-purple-400/10">
          <Mail className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">Newsletter Analytics</h2>
        </div>
      </div>
      {loading ? (
        <StatsSkeleton count={3} />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Mail} label="Total Subscribers" value={data.newsletters.total_subscribers} iconColor="text-purple-400" />
            <StatCard icon={Mail} label="Active" value={data.newsletters.active_subscribers} iconColor="text-purple-400" />
            <StatCard icon={UserPlus} label="New in Period" value={data.newsletters.new_in_period} iconColor="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={Mail} title="Subscribers by Type" iconColor="text-purple-400/70" />
              <MiniTable
                headers={["Newsletter", "Subscribers"]}
                rows={data.newsletters.by_type.map((t) => [formatNewsletterType(t.newsletter_type), t.count])}
                alignRight={[1]}
                emptyMsg="No newsletter subscribers yet"
                emptyIcon={Mail}
              />
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={TrendingUp} title="Subscription Trend" iconColor="text-purple-400/70" />
              <TrendBar data={data.newsletters.trend} label="New Subscribers" barClass="bg-purple-400/60 hover:bg-purple-400" />
            </div>
          </div>
        </>
      ) : null}
      </section>

      {/* ================================================================ */}
      {/* SECTION 5 — Subscriptions & Revenue */}
      {/* ================================================================ */}
      <section className="mb-10">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-terminal-border">
        <div className="h-8 w-8 flex items-center justify-center bg-amber-400/10">
          <DollarSign className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">Subscription & Revenue</h2>
        </div>
      </div>
      {loading ? (
        <StatsSkeleton count={3} />
      ) : data ? (
        <>
          {/* Revenue cards with left accent border */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-terminal-bg-secondary border border-terminal-border border-l-2 border-l-amber-400 p-4 hover:border-terminal-border-light hover:shadow-theme-sm transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">MRR</span>
                <DollarSign className="h-4 w-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">{formatMoney(data.subscriptions.mrr_usd)}</div>
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border border-l-2 border-l-amber-400 p-4 hover:border-terminal-border-light hover:shadow-theme-sm transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Revenue in Period</span>
                <DollarSign className="h-4 w-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">{formatMoney(data.subscriptions.revenue_in_period_usd)}</div>
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border border-l-2 border-l-amber-400 p-4 hover:border-terminal-border-light hover:shadow-theme-sm transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">All-Time Revenue</span>
                <DollarSign className="h-4 w-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">{formatMoney(data.subscriptions.total_revenue_all_time_usd)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={Crown} title="Active by Plan" iconColor="text-amber-400/70" />
              <MiniTable
                headers={["Plan", "Type", "Count"]}
                rows={data.subscriptions.active_by_plan.map((p) => [
                  p.plan__name,
                  formatTier(p.plan__plan_type),
                  p.count,
                ])}
                alignRight={[2]}
                emptyMsg="No active subscriptions"
                emptyIcon={Crown}
              />
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={Activity} title="Status Breakdown" iconColor="text-amber-400/70" />
              {data.subscriptions.status_breakdown.length === 0 ? (
                <EmptyState icon={Activity} message="No subscriptions yet" />
              ) : (
                <div className="divide-y divide-terminal-border/50">
                  {data.subscriptions.status_breakdown.map((s) => (
                    <div key={s.status} className="flex items-center justify-between px-4 py-2.5 hover:bg-terminal-bg-elevated/50 transition-colors duration-150">
                      <span className={cn("px-2 py-0.5 text-2xs font-medium uppercase tracking-wide", getStatusColor(s.status))}>
                        {s.status}
                      </span>
                      <span className="text-sm font-mono tabular-nums font-medium">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={DollarSign} title="Revenue by Currency" iconColor="text-amber-400/70" />
              <MiniTable
                headers={["Currency", "Revenue", "Payments"]}
                rows={data.subscriptions.revenue_by_currency.map((r) => [
                  r.currency.toUpperCase(),
                  `$${r.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                  r.count,
                ])}
                alignRight={[1, 2]}
                emptyMsg="No payments recorded"
                emptyIcon={DollarSign}
              />
            </div>
          </div>

          {/* Revenue Trend -- uses revenue_trend data from API that was previously unused */}
          {data.subscriptions.revenue_trend.length > 0 && (
            <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
              <SectionHeader icon={TrendingUp} title="Revenue Trend" iconColor="text-amber-400/70" />
              <TrendBar
                data={data.subscriptions.revenue_trend.map((r) => ({ date: r.date, count: Math.round(r.total) }))}
                label="Revenue (USD)"
                barClass="bg-amber-400/60 hover:bg-amber-400"
              />
            </div>
          )}
        </>
      ) : null}
      </section>
    </div>
  );
}
