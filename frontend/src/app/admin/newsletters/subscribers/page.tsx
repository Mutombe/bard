"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  Mail,
  Users,
  UserPlus,
  MoreVertical,
  Check,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminService, NewsletterSubscription } from "@/services/api/admin";
import { Skeleton } from "@/components/ui/loading";
import { toast } from "sonner";

// Skeleton Components
function StatCardSkeleton() {
  return (
    <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-48 mb-1" />
      </td>
      <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-6 w-16" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
    </tr>
  );
}

const NEWSLETTER_TYPE_LABELS: Record<string, string> = {
  morning_brief: "Morning Brief",
  evening_wrap: "Evening Wrap",
  weekly_digest: "Weekly Digest",
  breaking_news: "Breaking News",
  earnings: "Earnings Alerts",
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSubscribers();
    fetchStats();
  }, [currentPage, filterType, filterStatus]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        page_size: 20,
      };
      if (filterType !== "all") {
        params.newsletter_type = filterType;
      }
      if (filterStatus !== "all") {
        params.is_active = filterStatus === "active";
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await adminService.getNewsletterSubscriptions(params);
      setSubscribers(response.results);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await adminService.getNewsletterStats();
      setStats({
        total: statsData.total_subscribers,
        active: statsData.active_subscribers,
        inactive: statsData.total_subscribers - statsData.active_subscribers,
        verified: 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSubscribers();
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    if (!searchQuery) return true;
    return sub.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscribers.map((s) => s.id));
    }
  };

  const exportSubscribers = () => {
    const csv = [
      ["Email", "Newsletter Type", "Active", "Verified", "Subscribed Date"].join(","),
      ...filteredSubscribers.map((sub) =>
        [
          sub.email,
          NEWSLETTER_TYPE_LABELS[sub.newsletter_type] || sub.newsletter_type,
          sub.is_active ? "Yes" : "No",
          sub.is_verified ? "Yes" : "No",
          new Date(sub.created_at).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Subscribers exported successfully");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/newsletters"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your newsletter subscriber list
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportSubscribers}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total Subscribers</span>
              </div>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="flex items-center gap-2 text-market-up mb-1">
                <Check className="h-4 w-4" />
                <span className="text-sm">Active</span>
              </div>
              <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <X className="h-4 w-4" />
                <span className="text-sm">Inactive</span>
              </div>
              <div className="text-2xl font-bold">{stats.inactive.toLocaleString()}</div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Verified</span>
              </div>
              <div className="text-2xl font-bold">{stats.verified.toLocaleString()}</div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          <option value="all">All Types</option>
          <option value="morning_brief">Morning Brief</option>
          <option value="evening_wrap">Evening Wrap</option>
          <option value="weekly_digest">Weekly Digest</option>
          <option value="breaking_news">Breaking News</option>
          <option value="earnings">Earnings Alerts</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm"
        >
          Search
        </button>
      </form>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-brand-orange/10 border border-brand-orange/30 rounded-lg">
          <span className="text-sm">
            {selectedIds.length} subscriber(s) selected
          </span>
          <button className="px-3 py-1 bg-market-down/20 text-market-down border border-market-down/30 rounded text-sm hover:bg-market-down/30">
            <Trash2 className="h-4 w-4 inline mr-1" />
            Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-terminal-bg border-b border-terminal-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-terminal-border"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Newsletter Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Subscribed
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border">
            {loading ? (
              <>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </>
            ) : filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No subscribers found</p>
                  <p className="text-sm">Subscribers will appear here when users sign up for newsletters.</p>
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-terminal-bg-elevated">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(subscriber.id)}
                      onChange={() => toggleSelect(subscriber.id)}
                      className="rounded border-terminal-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{subscriber.email}</div>
                    {subscriber.is_verified && (
                      <span className="text-xs text-market-up">Verified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-brand-orange/20 text-brand-orange">
                      {NEWSLETTER_TYPE_LABELS[subscriber.newsletter_type] || subscriber.newsletter_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded",
                        subscriber.is_active
                          ? "bg-market-up/20 text-market-up"
                          : "bg-market-down/20 text-market-down"
                      )}
                    >
                      {subscriber.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(subscriber.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1 hover:bg-terminal-bg-elevated rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-terminal-border rounded text-sm hover:bg-terminal-bg-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-terminal-border rounded text-sm hover:bg-terminal-bg-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
