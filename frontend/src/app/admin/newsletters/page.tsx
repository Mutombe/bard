"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Send,
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  BarChart3,
  Loader2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/api/admin";
import { toast } from "sonner";

interface Newsletter {
  id: string;
  subject: string;
  subscription_types: string[];
  status: "draft" | "scheduled" | "sent";
  recipients_count: number;
  open_rate?: number;
  click_rate?: number;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
}

interface NewsletterStats {
  total_subscribers: number;
  active_subscribers: number;
  newsletters_sent: number;
  avg_open_rate: number;
}

function getStatusColor(status: Newsletter["status"]) {
  switch (status) {
    case "sent":
      return "bg-market-up/20 text-market-up";
    case "scheduled":
      return "bg-blue-500/20 text-blue-400";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
  }
}

function getTypeLabel(types: string[]) {
  if (types.length === 0) return "General";
  const typeLabels: Record<string, string> = {
    morning_brief: "Morning Brief",
    evening_wrap: "Evening Wrap",
    weekly_digest: "Weekly Digest",
    breaking_news: "Breaking News",
    earnings: "Earnings Alerts",
  };
  return types.map(t => typeLabels[t] || t).join(", ");
}

export default function NewslettersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsData, newslettersData] = await Promise.all([
        adminService.getNewsletterStats(),
        adminService.getNewsletters?.() || Promise.resolve([]),
      ]);
      setStats(statsData);
      setNewsletters(newslettersData || []);
    } catch (error) {
      console.error("Failed to fetch newsletter data:", error);
      toast.error("Failed to load newsletters");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNewsletters = newsletters.filter((newsletter) => {
    const matchesSearch = newsletter.subject
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" || newsletter.subscription_types.includes(selectedType);
    return matchesSearch && matchesType;
  });

  const statsDisplay = [
    {
      label: "Total Subscribers",
      value: stats?.total_subscribers?.toLocaleString() || "0",
      icon: Users
    },
    {
      label: "Active Subscribers",
      value: stats?.active_subscribers?.toLocaleString() || "0",
      icon: Eye
    },
    {
      label: "Newsletters Sent",
      value: stats?.newsletters_sent?.toLocaleString() || "0",
      icon: Send
    },
    {
      label: "Avg Open Rate",
      value: stats?.avg_open_rate ? `${stats.avg_open_rate}%` : "N/A",
      icon: BarChart3
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Newsletters</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage email newsletters.
          </p>
        </div>
        <Link
          href="/admin/newsletters/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Newsletter
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsDisplay.map((stat) => (
          <div
            key={stat.label}
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-5 w-5 text-brand-orange" />
            </div>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-block w-16 h-6 bg-terminal-bg-elevated animate-pulse rounded" />
              ) : (
                stat.value
              )}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search newsletters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          <option value="all">All Types</option>
          <option value="morning_brief">Morning Brief</option>
          <option value="evening_wrap">Evening Wrap</option>
          <option value="weekly_digest">Weekly Digest</option>
          <option value="breaking_news">Breaking News</option>
          <option value="earnings">Earnings Alerts</option>
        </select>
      </div>

      {/* Newsletters Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
          <div className="col-span-5">Subject</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Recipients</div>
          <div className="col-span-1 text-right">Open %</div>
          <div className="col-span-1 text-right">Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-terminal-border">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-orange" />
              <p className="text-muted-foreground mt-2">Loading newsletters...</p>
            </div>
          ) : filteredNewsletters.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No newsletters yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first newsletter to engage with your subscribers.
              </p>
              <Link
                href="/admin/newsletters/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Newsletter
              </Link>
            </div>
          ) : (
            filteredNewsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
              >
                <div className="col-span-5">
                  <Link
                    href={`/admin/newsletters/${newsletter.id}`}
                    className="font-medium hover:text-brand-orange transition-colors line-clamp-1"
                  >
                    {newsletter.subject}
                  </Link>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded line-clamp-1">
                    {getTypeLabel(newsletter.subscription_types)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize",
                      getStatusColor(newsletter.status)
                    )}
                  >
                    {newsletter.status === "sent" && <CheckCircle className="h-3 w-3" />}
                    {newsletter.status === "scheduled" && <Clock className="h-3 w-3" />}
                    {newsletter.status}
                  </span>
                </div>
                <div className="col-span-1 text-right text-sm">
                  {newsletter.recipients_count > 0
                    ? newsletter.recipients_count.toLocaleString()
                    : "-"}
                </div>
                <div className="col-span-1 text-right text-sm">
                  {newsletter.open_rate ? `${newsletter.open_rate}%` : "-"}
                </div>
                <div className="col-span-1 text-right text-sm text-muted-foreground">
                  {new Date(
                    newsletter.sent_at || newsletter.scheduled_for || newsletter.created_at
                  ).toLocaleDateString("en-ZA", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Link
                    href={`/admin/newsletters/${newsletter.id}`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  {newsletter.status === "draft" && (
                    <button className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subscriber Management Link */}
      <div className="mt-6 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Subscriber Management</h3>
            <p className="text-sm text-muted-foreground">
              View, export, and manage newsletter subscribers.
            </p>
          </div>
          <Link
            href="/admin/newsletters/subscribers"
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors text-sm"
          >
            Manage Subscribers
          </Link>
        </div>
      </div>
    </div>
  );
}
