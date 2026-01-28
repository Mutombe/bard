"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService, type Article } from "@/services/api/editorial";
import { toast } from "sonner";

interface Opinion extends Article {}

const categories = [
  "All Categories",
  "Market Commentary",
  "Economic Analysis",
  "Investment Strategy",
  "Sector Deep Dive",
  "Policy Watch",
];

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "published":
      return "bg-market-up/20 text-market-up";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "pending_review":
      return "bg-blue-500/20 text-blue-400";
    case "archived":
      return "bg-gray-500/20 text-gray-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

function OpinionSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden animate-pulse"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-terminal-bg" />
                <div className="space-y-2">
                  <div className="h-4 bg-terminal-bg rounded w-24" />
                  <div className="h-3 bg-terminal-bg rounded w-16" />
                </div>
              </div>
              <div className="h-6 w-16 bg-terminal-bg rounded" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-5 bg-terminal-bg rounded w-3/4" />
              <div className="h-4 bg-terminal-bg rounded w-full" />
              <div className="h-4 bg-terminal-bg rounded w-2/3" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-6 w-24 bg-terminal-bg rounded" />
                <div className="h-6 w-16 bg-terminal-bg rounded" />
              </div>
              <div className="flex gap-1">
                <div className="h-8 w-8 bg-terminal-bg rounded" />
                <div className="h-8 w-8 bg-terminal-bg rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function OpinionsPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const fetchOpinions = useCallback(async () => {
    try {
      const response = await editorialService.getArticles({
        content_type: "opinion",
        search: searchQuery || undefined,
        page_size: 50,
      });
      setOpinions(response.results);
    } catch (error) {
      console.error("Failed to fetch opinions:", error);
      toast.error("Failed to load opinions");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchOpinions();
  }, [fetchOpinions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        setIsLoading(true);
        fetchOpinions();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (id: number, slug: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this opinion piece?");
    if (!confirmed) return;

    setDeletingIds((prev) => [...prev, id]);
    try {
      await editorialService.deleteArticle(slug);
      setOpinions((prev) => prev.filter((o) => o.id !== id));
      toast.success("Opinion deleted successfully");
    } catch (error) {
      console.error("Failed to delete opinion:", error);
      toast.error("Failed to delete opinion");
    } finally {
      setDeletingIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const filteredOpinions = opinions.filter((opinion) => {
    const matchesSearch =
      opinion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opinion.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" ||
      opinion.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Opinions & Columns</h1>
          <p className="text-muted-foreground">
            Manage opinion pieces, columns, and editorial content.
          </p>
        </div>
        <Link
          href="/admin/opinions/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Opinion
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search opinions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Opinions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OpinionSkeleton />
        </div>
      ) : filteredOpinions.length === 0 ? (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No opinions found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedCategory !== "All Categories"
              ? "Try adjusting your search or create a new opinion piece."
              : "Create your first opinion piece to get started."}
          </p>
          <Link
            href="/admin/opinions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Opinion
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpinions.map((opinion) => (
            <div
              key={opinion.id}
              className={cn(
                "bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-primary/50 transition-colors",
                deletingIds.includes(opinion.id) && "opacity-50"
              )}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                      {opinion.author?.full_name ? (
                        <span className="text-primary font-medium text-sm">
                          {opinion.author.full_name.split(" ").map(n => n[0]).join("")}
                        </span>
                      ) : (
                        <span className="text-primary font-medium">?</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{opinion.author?.full_name || "Unknown Author"}</div>
                      <div className="text-sm text-muted-foreground">
                        {opinion.category?.name || "Uncategorized"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium capitalize",
                      getStatusColor(opinion.status)
                    )}
                  >
                    {opinion.status?.replace("_", " ") || "draft"}
                  </span>
                </div>

                <Link
                  href={`/admin/articles/${opinion.id}`}
                  className="block mb-3"
                >
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                    {opinion.title}
                  </h3>
                </Link>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {opinion.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {opinion.published_at && (
                      <span className="text-xs">
                        {new Date(opinion.published_at).toLocaleDateString()}
                      </span>
                    )}
                    {opinion.status?.toLowerCase() === "published" && (
                      <>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {opinion.view_count?.toLocaleString() || 0}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/articles/${opinion.id}`}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(opinion.id, opinion.slug)}
                      disabled={deletingIds.includes(opinion.id)}
                      className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg-elevated rounded disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingIds.includes(opinion.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
