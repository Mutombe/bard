"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Eye,
  Clock,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Mic,
  Globe,
  Tag,
  Factory,
  Download,
  Headphones,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton, Skeleton } from "@/components/ui/loading";
import { editorialService, type Article, type EditorialAssignment } from "@/services/api/editorial";
import { adminService } from "@/services/api/admin";
import { toast } from "sonner";

interface DashboardStats {
  totalArticles: number;
  publishedToday: number;
  pendingReview: number;
  totalUsers: number;
  newsletterSubs: number;
  draftCount: number;
}

// Mock research institute metrics - to be replaced with API calls
const mockResearchStats = {
  totalReports: 47,
  reportsThisMonth: 3,
  totalDownloads: 12450,
  avgReadTime: "12 min",
};

const mockPodcastStats = {
  totalEpisodes: 368,
  totalListens: 198000,
  activeShows: 3,
  newThisWeek: 5,
};

const mockCoverageStats = {
  regions: 5,
  countries: 54,
  industries: 12,
  topics: 24,
};

// Recent research reports mock data
const recentReports = [
  { id: "1", title: "African Banking Sector Outlook 2025", downloads: 1234, status: "published" },
  { id: "2", title: "Mobile Money Revolution Analysis", downloads: 987, status: "published" },
  { id: "3", title: "ESG Investment Trends in Africa", downloads: 0, status: "review" },
];

// Top performing content
const topContent = [
  { title: "Central Bank Policy Changes", type: "Article", views: 8934 },
  { title: "African Banking Outlook 2025", type: "Research", views: 5678 },
  { title: "JSE Rally Analysis", type: "Podcast", views: 3456 },
];

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "published":
      return "bg-market-up/20 text-market-up";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "scheduled":
      return "bg-blue-500/20 text-blue-400";
    case "pending":
    case "pending_review":
    case "review":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

// Priority is now an integer: 0=Low, 1=Medium, 2=High, 3=Urgent
function getPriorityColor(priority: number) {
  switch (priority) {
    case 3: // Urgent
    case 2: // High
      return "text-market-down";
    case 1: // Medium
      return "text-yellow-400";
    case 0: // Low
    default:
      return "text-muted-foreground";
  }
}

const priorityLabels: Record<number, string> = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Urgent",
};

// Skeleton for stat cards
function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for articles list
function ArticlesListSkeleton() {
  return (
    <div className="divide-y divide-terminal-border">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 animate-pulse">
          <div className="flex-1 min-w-0 mr-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for tasks list
function TasksListSkeleton() {
  return (
    <div className="divide-y divide-terminal-border">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <Skeleton className="h-2 w-2 rounded-full mt-2" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [assignments, setAssignments] = useState<EditorialAssignment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedToday: 0,
    pendingReview: 0,
    totalUsers: 0,
    newsletterSubs: 0,
    draftCount: 0,
  });

  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      // Fetch articles - run in parallel for speed
      const [articlesResponse, userStats, newsletterStats] = await Promise.all([
        editorialService.getArticles({ page_size: 5 }),
        adminService.getUserStats().catch(() => ({ total_users: 0, premium_users: 0, admin_count: 0, new_today: 0 })),
        adminService.getNewsletterStats().catch(() => ({ total_subscribers: 0, active_subscribers: 0, open_rate: 0, click_rate: 0 })),
      ]);

      setArticles(articlesResponse.results || []);
      setStats(prev => ({
        ...prev,
        totalArticles: articlesResponse.count || 0,
        totalUsers: userStats.total_users || 0,
        newsletterSubs: newsletterStats.total_subscribers || 0,
      }));

      // Fetch all assignments for admin view (not just user's)
      try {
        const allAssignments = await editorialService.getAllAssignments({ status: "PENDING" });
        // Also get in-progress assignments
        const inProgressAssignments = await editorialService.getAllAssignments({ status: "IN_PROGRESS" });
        setAssignments([...allAssignments, ...inProgressAssignments].slice(0, 10) || []);
      } catch {
        // Fall back to user's assignments if all assignments not available
        try {
          const myAssignments = await editorialService.getMyAssignments();
          setAssignments(myAssignments || []);
        } catch {
          setAssignments([]);
        }
      }

      // Fetch admin stats for article counts (all articles, not just user's)
      try {
        const adminStats = await editorialService.getAdminStats();
        setStats(prev => ({
          ...prev,
          totalArticles: adminStats.articles_count || prev.totalArticles,
          publishedToday: adminStats.published_today || 0,
          pendingReview: adminStats.pending_review || 0,
          draftCount: adminStats.draft_count || 0,
        }));
      } catch {
        // Admin stats endpoint may not be available
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: "Total Articles",
      value: stats.totalArticles.toLocaleString(),
      subtext: stats.publishedToday > 0 ? `${stats.publishedToday} published today` : undefined,
      icon: FileText,
      href: "/admin/articles",
    },
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      subtext: undefined,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Pending Review",
      value: stats.pendingReview.toLocaleString(),
      subtext: stats.draftCount > 0 ? `${stats.draftCount} drafts` : undefined,
      icon: Eye,
      href: "/admin/articles?status=pending_review",
    },
    {
      label: "Newsletter Subs",
      value: stats.newsletterSubs.toLocaleString(),
      subtext: undefined,
      icon: TrendingUp,
      href: "/admin/newsletters",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your platform.
          </p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              {stat.subtext && (
                <div className="text-xs text-primary mt-1">{stat.subtext}</div>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="lg:col-span-2 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <div className="flex items-center justify-between p-4 border-b border-terminal-border">
            <h2 className="font-semibold">Recent Articles</h2>
            <Link
              href="/admin/articles"
              className="text-sm text-brand-orange hover:text-brand-orange-light"
            >
              View All
            </Link>
          </div>
          {isLoading ? (
            <ArticlesListSkeleton />
          ) : articles.length > 0 ? (
            <div className="divide-y divide-terminal-border">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/admin/articles/${article.id}`}
                  className="flex items-center justify-between p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-medium truncate mb-1">
                      {article.is_featured && <span className="text-brand-orange mr-1">★</span>}
                      {article.title}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{article.author?.full_name || "Unknown"}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.created_at ? new Date(article.created_at).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {(article.view_count || 0) > 0 && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {(article.view_count || 0).toLocaleString()}
                      </div>
                    )}
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium capitalize",
                        getStatusColor(article.status)
                      )}
                    >
                      {(article.status || "draft").toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No articles yet. <Link href="/admin/articles/new" className="text-brand-orange hover:underline">Create your first article</Link>
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-brand-orange" />
              Pending Tasks
            </h2>
          </div>
          {isLoading ? (
            <TasksListSkeleton />
          ) : assignments.length > 0 ? (
            <div className="divide-y divide-terminal-border">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full mt-2 flex-shrink-0",
                        assignment.priority >= 2
                          ? "bg-market-down"
                          : assignment.priority === 1
                          ? "bg-yellow-400"
                          : "bg-muted-foreground"
                      )}
                    />
                    <div>
                      <div className="text-sm">
                        {assignment.assignment_type}: {assignment.article?.title || "Article"}
                      </div>
                      <div
                        className={cn(
                          "text-xs capitalize mt-1",
                          getPriorityColor(assignment.priority ?? 0)
                        )}
                      >
                        {priorityLabels[assignment.priority ?? 0] || "Medium"} priority
                        {assignment.deadline && ` - Due ${new Date(assignment.deadline).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No pending tasks
            </div>
          )}
          <div className="p-4 border-t border-terminal-border">
            <Link
              href="/admin/tasks"
              className="block w-full py-2 text-sm text-center text-brand-orange hover:text-brand-orange-light"
            >
              View All Tasks
            </Link>
          </div>
        </div>
      </div>

      {/* Research Institute Metrics */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Research Institute Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Research Reports */}
          <Link
            href="/admin/research"
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 hover:border-primary transition-colors"
          >
            <BookOpen className="h-5 w-5 text-blue-400 mb-2" />
            <div className="text-xl font-bold">{mockResearchStats.totalReports}</div>
            <div className="text-sm text-muted-foreground">Research Reports</div>
            <div className="text-xs text-blue-400 mt-1">
              {mockResearchStats.reportsThisMonth} this month
            </div>
          </Link>

          {/* Podcast Episodes */}
          <Link
            href="/admin/podcasts"
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 hover:border-primary transition-colors"
          >
            <Mic className="h-5 w-5 text-purple-400 mb-2" />
            <div className="text-xl font-bold">{mockPodcastStats.totalEpisodes}</div>
            <div className="text-sm text-muted-foreground">Podcast Episodes</div>
            <div className="text-xs text-purple-400 mt-1">
              {mockPodcastStats.newThisWeek} new this week
            </div>
          </Link>

          {/* Total Downloads */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <Download className="h-5 w-5 text-green-400 mb-2" />
            <div className="text-xl font-bold">{mockResearchStats.totalDownloads.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Report Downloads</div>
          </div>

          {/* Total Listens */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <Headphones className="h-5 w-5 text-amber-400 mb-2" />
            <div className="text-xl font-bold">{mockPodcastStats.totalListens.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Podcast Listens</div>
          </div>
        </div>

        {/* Coverage Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Link
            href="/admin/regions"
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-3 hover:border-primary transition-colors text-center"
          >
            <Globe className="h-4 w-4 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold">{mockCoverageStats.regions}</div>
            <div className="text-xs text-muted-foreground">Regions</div>
          </Link>
          <Link
            href="/admin/regions"
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-3 hover:border-primary transition-colors text-center"
          >
            <Globe className="h-4 w-4 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold">{mockCoverageStats.countries}</div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </Link>
          <Link
            href="/admin/industries"
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-3 hover:border-primary transition-colors text-center"
          >
            <Factory className="h-4 w-4 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold">{mockCoverageStats.industries}</div>
            <div className="text-xs text-muted-foreground">Industries</div>
          </Link>
          <Link
            href="/admin/topics"
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-3 hover:border-primary transition-colors text-center"
          >
            <Tag className="h-4 w-4 text-green-400 mx-auto mb-1" />
            <div className="text-lg font-bold">{mockCoverageStats.topics}</div>
            <div className="text-xs text-muted-foreground">Topics</div>
          </Link>
        </div>
      </div>

      {/* Recent Research & Top Content */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Research Reports */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <div className="flex items-center justify-between p-4 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              Recent Research
            </h2>
            <Link
              href="/admin/research"
              className="text-sm text-brand-orange hover:text-brand-orange-light"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-terminal-border">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/admin/research/${report.id}`}
                className="flex items-center justify-between p-4 hover:bg-terminal-bg-elevated transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="font-medium truncate text-sm">{report.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Download className="h-3 w-3" />
                    {report.downloads.toLocaleString()} downloads
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium capitalize",
                    getStatusColor(report.status)
                  )}
                >
                  {report.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Performing Content */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <div className="flex items-center justify-between p-4 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-400" />
              Top Performing Content
            </h2>
          </div>
          <div className="divide-y divide-terminal-border">
            {topContent.map((content, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-terminal-bg flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{content.title}</div>
                    <div className="text-xs text-muted-foreground">{content.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {content.views.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Link
          href="/admin/articles/new"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-brand-orange transition-colors text-center"
        >
          <FileText className="h-6 w-6 mx-auto mb-2 text-brand-orange" />
          <span className="text-sm">New Article</span>
        </Link>
        <Link
          href="/admin/research/new"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-blue-400 transition-colors text-center"
        >
          <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-400" />
          <span className="text-sm">New Research</span>
        </Link>
        <Link
          href="/admin/podcasts/new"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-purple-400 transition-colors text-center"
        >
          <Mic className="h-6 w-6 mx-auto mb-2 text-purple-400" />
          <span className="text-sm">New Episode</span>
        </Link>
        <Link
          href="/admin/opinions/new"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-brand-orange transition-colors text-center"
        >
          <MessageSquare className="h-6 w-6 mx-auto mb-2 text-brand-orange" />
          <span className="text-sm">New Opinion</span>
        </Link>
        <Link
          href="/admin/newsletters/new"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-green-400 transition-colors text-center"
        >
          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-400" />
          <span className="text-sm">Newsletter</span>
        </Link>
        <Link
          href="/admin/users"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-amber-400 transition-colors text-center"
        >
          <Users className="h-6 w-6 mx-auto mb-2 text-amber-400" />
          <span className="text-sm">Users</span>
        </Link>
      </div>
    </div>
  );
}
