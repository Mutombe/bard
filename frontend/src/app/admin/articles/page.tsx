"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton, LoadingSpinner } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { editorialService, type Article } from "@/services/api/editorial";
import { newsService } from "@/services/api/news";
import { toast } from "sonner";

const statuses = [
  { id: "all", label: "All Status" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "pending", label: "Pending Review" },
  { id: "archived", label: "Archived" },
];

function getStatusColor(status: string) {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case "published":
      return "bg-market-up/20 text-market-up";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "pending":
    case "pending_review":
      return "bg-purple-500/20 text-purple-400";
    case "archived":
      return "bg-gray-500/20 text-gray-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

function getStatusIcon(status: string) {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case "published":
      return <CheckCircle className="h-4 w-4" />;
    case "draft":
      return <Edit className="h-4 w-4" />;
    case "pending":
    case "pending_review":
      return <Clock className="h-4 w-4" />;
    case "archived":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    published: "Published",
    draft: "Draft",
    pending: "Pending",
    pending_review: "Pending",
    archived: "Archived",
  };
  return statusMap[status?.toLowerCase()] || status;
}

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([
    { id: "all", label: "All Categories" },
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "single" | "bulk";
    articleSlug?: string;
    articleId?: string;
    articleTitle?: string;
    count?: number;
  }>({
    open: false,
    type: "single",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch articles
  const fetchArticles = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: Record<string, any> = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      const response = await editorialService.getArticles(params);
      setArticles(response.results || []);
      setPagination((prev) => ({
        ...prev,
        total: response.count || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setError("Failed to load articles. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.pageSize, searchQuery, selectedCategory, selectedStatus]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const cats = await newsService.getCategories();
      setCategories([
        { id: "all", label: "All Categories" },
        ...cats.map((c) => ({ id: c.slug, label: c.name })),
      ]);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [selectedCategory, selectedStatus]);

  const toggleSelectArticle = (id: string) => {
    setSelectedArticles((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map((a) => a.id));
    }
  };

  // Bulk actions with optimistic UI
  const handleBulkAction = async (action: "publish" | "unpublish" | "delete") => {
    if (selectedArticles.length === 0) return;

    // For delete, show confirmation modal
    if (action === "delete") {
      setDeleteModal({
        open: true,
        type: "bulk",
        count: selectedArticles.length,
      });
      return;
    }

    await executeBulkAction(action);
  };

  // Execute bulk action (called after confirmation for delete)
  const executeBulkAction = async (action: "publish" | "unpublish" | "delete") => {
    setActionLoading(true);

    // Optimistic update
    const previousArticles = [...articles];
    if (action === "delete") {
      setArticles((prev) => prev.filter((a) => !selectedArticles.includes(a.id)));
    } else if (action === "publish") {
      setArticles((prev) =>
        prev.map((a) =>
          selectedArticles.includes(a.id) ? { ...a, status: "PUBLISHED" as const } : a
        )
      );
    } else if (action === "unpublish") {
      setArticles((prev) =>
        prev.map((a) =>
          selectedArticles.includes(a.id) ? { ...a, status: "DRAFT" as const } : a
        )
      );
    }

    try {
      await editorialService.bulkAction(action, selectedArticles);
      toast.success(`Successfully ${action === "delete" ? "deleted" : action === "publish" ? "published" : "unpublished"} ${selectedArticles.length} article(s)`);
      setSelectedArticles([]);
      // Refresh to get accurate counts
      fetchArticles(true);
    } catch (err) {
      console.error(`Failed to ${action} articles:`, err);
      toast.error(`Failed to ${action} articles. Please try again.`);
      // Revert optimistic update
      setArticles(previousArticles);
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete confirmation modal for single article
  const openDeleteModal = (article: Article) => {
    setDeleteModal({
      open: true,
      type: "single",
      articleSlug: article.slug,
      articleId: article.id,
      articleTitle: article.title,
    });
  };

  // Execute delete after confirmation
  const executeDelete = async () => {
    setDeleteLoading(true);

    if (deleteModal.type === "bulk") {
      // Handle bulk delete
      try {
        await executeBulkAction("delete");
        setDeleteModal({ open: false, type: "single" });
      } finally {
        setDeleteLoading(false);
      }
      return;
    }

    // Handle single delete - use ID for more reliable deletion
    const { articleId } = deleteModal;
    if (!articleId) return;

    // Optimistic update
    const previousArticles = [...articles];
    setArticles((prev) => prev.filter((a) => a.id !== articleId));

    try {
      await editorialService.deleteArticle(articleId);
      toast.success("Article deleted successfully");
      setDeleteModal({ open: false, type: "single" });
    } catch (err: any) {
      console.error("Failed to delete article:", err);
      const errorMessage = err?.response?.data?.error || "Failed to delete article";
      if (err?.response?.status === 404) {
        // Article already deleted or doesn't exist - remove from UI
        toast.info("Article was already deleted");
        setDeleteModal({ open: false, type: "single" });
      } else {
        toast.error(errorMessage);
        setArticles(previousArticles);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Articles</h1>
          <p className="text-muted-foreground">
            Manage and publish news articles and stories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchArticles(true)}
            disabled={refreshing}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          </button>
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Article
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          >
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <span className="text-sm text-muted-foreground">
            {selectedArticles.length} selected
          </span>
          <button
            onClick={() => handleBulkAction("publish")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm bg-market-up/20 text-market-up rounded hover:bg-market-up/30 disabled:opacity-50"
          >
            Publish
          </button>
          <button
            onClick={() => handleBulkAction("unpublish")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 disabled:opacity-50"
          >
            Unpublish
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30 disabled:opacity-50"
          >
            Delete
          </button>
          {actionLoading && <LoadingSpinner size="sm" />}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-market-down/10 border border-market-down/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-market-down" />
          <p className="text-market-down">{error}</p>
          <button
            onClick={() => fetchArticles()}
            className="ml-auto px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <div className="col-span-1">
              <div className="h-5 w-5 bg-terminal-border rounded animate-pulse" />
            </div>
            <div className="col-span-5">Article</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Views</div>
            <div className="col-span-1 text-right">Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <LoadingSkeleton type="article-row" count={10} />
        </div>
      ) : articles.length === 0 ? (
        /* Empty State */
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
          <div className="text-muted-foreground mb-4">
            <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No articles found</h3>
            <p className="text-sm">
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                ? "Try adjusting your filters or search query."
                : "Get started by creating your first article."}
            </p>
          </div>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Article
          </Link>
        </div>
      ) : (
        /* Articles Table */
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden relative">
          {refreshing && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-orange/20">
              <div className="h-full bg-brand-orange animate-pulse" style={{ width: "100%" }} />
            </div>
          )}
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedArticles.length === articles.length && articles.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-terminal-border"
              />
            </div>
            <div className="col-span-5">Article</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Views</div>
            <div className="col-span-1 text-right">Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-terminal-border">
            {articles.map((article) => (
              <div
                key={article.id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center",
                  selectedArticles.includes(article.id) && "bg-brand-orange/5"
                )}
              >
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedArticles.includes(article.id)}
                    onChange={() => toggleSelectArticle(article.id)}
                    className="rounded border-terminal-border"
                  />
                </div>
                <div className="col-span-5 min-w-0">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="font-medium hover:text-brand-orange transition-colors line-clamp-1"
                  >
                    {article.is_featured && (
                      <span className="text-brand-orange mr-1">★</span>
                    )}
                    {article.is_breaking && (
                      <span className="text-market-down mr-1">🔴</span>
                    )}
                    {article.title}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    By {article.author?.full_name || "Unknown"}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded truncate block">
                    {article.category?.name || "Uncategorized"}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
                      getStatusColor(article.status)
                    )}
                  >
                    {getStatusIcon(article.status)}
                    <span className="hidden sm:inline">{formatStatus(article.status)}</span>
                  </span>
                </div>
                <div className="col-span-1 text-right text-sm tabular-nums">
                  {article.view_count > 0 ? article.view_count.toLocaleString() : "-"}
                </div>
                <div className="col-span-1 text-right text-sm text-muted-foreground">
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                      })
                    : new Date(article.created_at).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                      })}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => openDeleteModal(article)}
                    className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && articles.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} articles
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground px-2">
              Page {pagination.page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal((prev) => ({ ...prev, open }))}
        title={
          deleteModal.type === "bulk"
            ? `Delete ${deleteModal.count} article${deleteModal.count !== 1 ? "s" : ""}?`
            : "Delete article?"
        }
        description={
          deleteModal.type === "bulk"
            ? `Are you sure you want to delete ${deleteModal.count} selected article${deleteModal.count !== 1 ? "s" : ""}? This action cannot be undone.`
            : `Are you sure you want to delete "${deleteModal.articleTitle}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={executeDelete}
        onCancel={() => setDeleteModal({ open: false, type: "single" })}
      />
    </div>
  );
}
