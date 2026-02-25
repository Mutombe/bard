"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Users,
  FileText,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Globe,
  Activity,
  Server,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Share2,
  LogIn,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/loading";
import { authClient } from "@/services/api/client";
import { toast } from "sonner";

type DateRange = "today" | "7d" | "30d";

interface DashboardData {
  today_views: number;
  today_visitors: number;
  today_articles: number;
  today_new_users: number;
  views_change: number;
  visitors_change: number;
  articles_change: number;
  users_change: number;
  system_health: {
    api_response_time?: number;
    error_count?: number;
    cache_hit_rate?: number;
  };
  top_articles_today: Array<{
    article__headline: string;
    article__slug: string;
    total_views: number;
  }>;
  top_countries: Array<{
    country__name: string;
    country__code: string;
    views: number;
  }>;
  recent_activity: Array<{
    activity_type: string;
    user__email: string;
    created_at: string;
  }>;
}

interface ContentPerformance {
  id: number;
  article: number;
  article_headline: string;
  article_slug: string;
  total_views: number;
  unique_visitors: number;
  engagement_score: number;
  trend_direction: string;
  trend_percentage: number;
}

interface GeoData {
  country__name: string;
  country__code: string;
  total_views: number;
  total_visitors: number;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
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
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">No change</span>;
  const isPositive = value > 0;
  return (
    <span className={cn("text-xs flex items-center gap-0.5", isPositive ? "text-market-up" : "text-market-down")}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case "page_view": return Eye;
    case "article_read": return BookOpen;
    case "search": return Search;
    case "login": return LogIn;
    case "share": return Share2;
    default: return Activity;
  }
}

function getDaysForRange(range: DateRange): number {
  switch (range) {
    case "today": return 1;
    case "7d": return 7;
    case "30d": return 30;
  }
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topContent, setTopContent] = useState<ContentPerformance[]>([]);
  const [trending, setTrending] = useState<ContentPerformance[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const days = getDaysForRange(dateRange);

      const [dashboardRes, topRes, trendingRes, geoRes] = await Promise.all([
        authClient.get("/analytics/dashboard/"),
        authClient.get(`/analytics/performance/top_performing/?limit=10&days=${days}`),
        authClient.get(`/analytics/performance/trending/?limit=5&days=${days}`),
        authClient.get(`/analytics/geographic/top_countries/?days=${days}`),
      ]);

      setDashboard(dashboardRes.data);
      setTopContent(Array.isArray(topRes.data) ? topRes.data : topRes.data.results || []);
      setTrending(Array.isArray(trendingRes.data) ? trendingRes.data : trendingRes.data.results || []);
      setGeoData(Array.isArray(geoRes.data) ? geoRes.data : geoRes.data.results || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics data. Please try again.");
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = dashboard ? [
    { label: "Page Views", value: dashboard.today_views, change: dashboard.views_change, icon: Eye },
    { label: "Unique Visitors", value: dashboard.today_visitors, change: dashboard.visitors_change, icon: Users },
    { label: "Articles Published", value: dashboard.today_articles, change: dashboard.articles_change, icon: FileText },
    { label: "New Users", value: dashboard.today_new_users, change: dashboard.users_change, icon: UserPlus },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor site performance, content engagement, and user activity.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors disabled:opacity-50 self-start"
          title="Refresh"
        >
          <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-market-down/10 border border-market-down/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-market-down" />
          <p className="text-market-down">{error}</p>
          <button
            onClick={() => fetchData()}
            className="ml-auto px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Section 1: Overview Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-5 w-5 text-brand-orange" />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {stat.value.toLocaleString()}
              </div>
              <ChangeIndicator value={stat.change} />
            </div>
          ))}
        </div>
      )}

      {/* Section 2: Date Range Selector */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { key: "today", label: "Today" },
          { key: "7d", label: "7 Days" },
          { key: "30d", label: "30 Days" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDateRange(key)}
            className={cn(
              "px-4 py-2 text-sm rounded-md transition-colors",
              dateRange === key
                ? "bg-brand-orange text-white"
                : "bg-terminal-bg-secondary border border-terminal-border text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Section 3: Top Performing Content */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-orange" />
              Top Performing Content
            </h2>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : topContent.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No performance data available yet.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-terminal-border text-xs font-medium text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Title</div>
                <div className="col-span-2 text-right">Views</div>
                <div className="col-span-2 text-right">Unique</div>
                <div className="col-span-1 text-right">Score</div>
                <div className="col-span-1 text-right">Trend</div>
              </div>
              <div className="divide-y divide-terminal-border">
                {topContent.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-terminal-bg-elevated transition-colors items-center">
                    <div className="col-span-1 text-sm text-muted-foreground">{idx + 1}</div>
                    <div className="col-span-5 text-sm font-medium truncate" title={item.article_headline}>
                      {item.article_headline}
                    </div>
                    <div className="col-span-2 text-sm text-right">{item.total_views.toLocaleString()}</div>
                    <div className="col-span-2 text-sm text-right text-muted-foreground">{item.unique_visitors.toLocaleString()}</div>
                    <div className="col-span-1 text-sm text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium",
                        item.engagement_score >= 70 ? "bg-market-up/20 text-market-up" :
                        item.engagement_score >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-terminal-bg-elevated text-muted-foreground"
                      )}>
                        {item.engagement_score.toFixed(0)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {item.trend_direction === "up" ? (
                        <TrendingUp className="h-4 w-4 text-market-up" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-market-down" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Section 4: Trending Content */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="px-4 py-3 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-market-up" />
              Trending Now
            </h2>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : trending.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No trending content right now.
            </div>
          ) : (
            <div className="divide-y divide-terminal-border">
              {trending.map((item) => (
                <div key={item.id} className="px-4 py-3 hover:bg-terminal-bg-elevated transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium truncate flex-1" title={item.article_headline}>
                      {item.article_headline}
                    </div>
                    <span className="text-xs text-market-up flex items-center gap-0.5 flex-shrink-0">
                      <ArrowUpRight className="h-3 w-3" />
                      {item.trend_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.total_views.toLocaleString()} views &middot; {item.unique_visitors.toLocaleString()} unique
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: Geographic Analytics */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="px-4 py-3 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-orange" />
              Top Countries
            </h2>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : geoData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No geographic data available yet.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-terminal-border text-xs font-medium text-muted-foreground">
                <div>Country</div>
                <div className="text-right">Page Views</div>
                <div className="text-right">Unique Visitors</div>
              </div>
              <div className="divide-y divide-terminal-border">
                {geoData.map((item) => (
                  <div key={item.country__code} className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-terminal-bg-elevated transition-colors items-center">
                    <div className="text-sm font-medium">{item.country__name}</div>
                    <div className="text-sm text-right">{item.total_views.toLocaleString()}</div>
                    <div className="text-sm text-right text-muted-foreground">{item.total_visitors.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 7: Recent User Activity Feed */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="px-4 py-3 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-orange" />
              Recent Activity
            </h2>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : !dashboard?.recent_activity?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              No recent activity.
            </div>
          ) : (
            <div className="divide-y divide-terminal-border max-h-[400px] overflow-y-auto">
              {dashboard.recent_activity.slice(0, 10).map((activity, idx) => {
                const Icon = getActivityIcon(activity.activity_type);
                return (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-terminal-bg-elevated transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm capitalize">
                        {activity.activity_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 truncate">
                        {activity.user__email}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(activity.created_at).toLocaleTimeString("en-ZA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 8: System Health */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="px-4 py-3 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-brand-orange" />
              System Health
            </h2>
          </div>
          {loading ? (
            <TableSkeleton rows={3} />
          ) : !dashboard?.system_health ? (
            <div className="p-8 text-center text-muted-foreground">
              No system health data available.
            </div>
          ) : (
            <div className="divide-y divide-terminal-border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">API Response Time</span>
                <span className={cn(
                  "text-sm font-medium",
                  (dashboard.system_health.api_response_time ?? 0) < 200 ? "text-market-up" :
                  (dashboard.system_health.api_response_time ?? 0) < 500 ? "text-yellow-400" :
                  "text-market-down"
                )}>
                  {dashboard.system_health.api_response_time != null
                    ? `${dashboard.system_health.api_response_time}ms`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Error Count</span>
                <span className={cn(
                  "text-sm font-medium",
                  (dashboard.system_health.error_count ?? 0) === 0 ? "text-market-up" : "text-market-down"
                )}>
                  {dashboard.system_health.error_count ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                <span className={cn(
                  "text-sm font-medium",
                  (dashboard.system_health.cache_hit_rate ?? 0) > 80 ? "text-market-up" :
                  (dashboard.system_health.cache_hit_rate ?? 0) > 50 ? "text-yellow-400" :
                  "text-market-down"
                )}>
                  {dashboard.system_health.cache_hit_rate != null
                    ? `${dashboard.system_health.cache_hit_rate.toFixed(1)}%`
                    : "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
