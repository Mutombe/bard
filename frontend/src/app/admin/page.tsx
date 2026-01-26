"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService, type Article, type EditorialAssignment } from "@/services/api/editorial";

interface DashboardStats {
  totalArticles: number;
  activeUsers: number;
  pageViews: number;
  newsletterSubs: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-market-up/20 text-market-up";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "scheduled":
      return "bg-blue-500/20 text-blue-400";
    case "review":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
    case "HIGH":
    case "URGENT":
      return "text-market-down";
    case "medium":
    case "MEDIUM":
      return "text-yellow-400";
    case "low":
    case "LOW":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [assignments, setAssignments] = useState<EditorialAssignment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    activeUsers: 0,
    pageViews: 0,
    newsletterSubs: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch articles
        const articlesResponse = await editorialService.getArticles({ page_size: 5 });
        setArticles(articlesResponse.results || []);
        setStats(prev => ({ ...prev, totalArticles: articlesResponse.count || 0 }));

        // Try to fetch assignments (may fail if not authenticated as editor)
        try {
          const myAssignments = await editorialService.getMyAssignments();
          setAssignments(myAssignments || []);
        } catch {
          // User may not have editor permissions
          setAssignments([]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: "Total Articles",
      value: stats.totalArticles.toLocaleString(),
      change: "+12%",
      isUp: true,
      icon: FileText,
      href: "/admin/articles",
    },
    {
      label: "Active Users",
      value: stats.activeUsers.toLocaleString() || "45,892",
      change: "+8%",
      isUp: true,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Page Views (Today)",
      value: stats.pageViews.toLocaleString() || "128,456",
      change: "+23%",
      isUp: true,
      icon: Eye,
      href: "/admin",
    },
    {
      label: "Newsletter Subs",
      value: stats.newsletterSubs.toLocaleString() || "68,234",
      change: "+5%",
      isUp: true,
      icon: TrendingUp,
      href: "/admin/newsletters",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 hover:border-brand-orange transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                <stat.icon className="h-5 w-5" />
              </div>
              <div
                className={cn(
                  "flex items-center text-sm",
                  stat.isUp ? "text-market-up" : "text-market-down"
                )}
              >
                {stat.isUp ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Link>
        ))}
      </div>

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
          <div className="divide-y divide-terminal-border">
            {articles.length > 0 ? articles.map((article) => (
              <Link
                key={article.id}
                href={`/admin/articles/${article.slug}`}
                className="flex items-center justify-between p-4 hover:bg-terminal-bg-elevated transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="font-medium truncate mb-1">{article.title}</div>
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
                      getStatusColor((article.status || "draft").toLowerCase())
                    )}
                  >
                    {(article.status || "draft").toLowerCase().replace("_", " ")}
                  </span>
                </div>
              </Link>
            )) : (
              <div className="p-8 text-center text-muted-foreground">
                No articles yet. <Link href="/admin/articles/new" className="text-brand-orange hover:underline">Create your first article</Link>
              </div>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-brand-orange" />
              Pending Tasks
            </h2>
          </div>
          <div className="divide-y divide-terminal-border">
            {assignments.length > 0 ? assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 hover:bg-terminal-bg-elevated transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full mt-2 flex-shrink-0",
                      (assignment.priority || "").toUpperCase() === "HIGH" || (assignment.priority || "").toUpperCase() === "URGENT"
                        ? "bg-market-down"
                        : (assignment.priority || "").toUpperCase() === "MEDIUM"
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
                        getPriorityColor(assignment.priority || "LOW")
                      )}
                    >
                      {(assignment.priority || "low").toLowerCase()} priority
                      {assignment.due_date && ` - Due ${new Date(assignment.due_date).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No pending tasks
              </div>
            )}
          </div>
          <div className="p-4 border-t border-terminal-border">
            <button className="w-full py-2 text-sm text-brand-orange hover:text-brand-orange-light">
              View All Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/articles/new"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-brand-orange transition-colors text-center"
        >
          <FileText className="h-6 w-6 mx-auto mb-2 text-brand-orange" />
          <span className="text-sm">New Article</span>
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
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-brand-orange transition-colors text-center"
        >
          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-brand-orange" />
          <span className="text-sm">Send Newsletter</span>
        </Link>
        <Link
          href="/admin/users"
          className="p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border hover:border-brand-orange transition-colors text-center"
        >
          <Users className="h-6 w-6 mx-auto mb-2 text-brand-orange" />
          <span className="text-sm">Manage Users</span>
        </Link>
      </div>
    </div>
  );
}
