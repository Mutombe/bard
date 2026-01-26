"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  status: "published" | "draft" | "scheduled" | "review";
  views: number;
  publishedAt: string | null;
  createdAt: string;
  featured: boolean;
}

const categories = [
  { id: "all", label: "All Categories" },
  { id: "markets", label: "Markets" },
  { id: "economics", label: "Economics" },
  { id: "companies", label: "Companies" },
  { id: "commodities", label: "Commodities" },
  { id: "forex", label: "Forex" },
  { id: "analysis", label: "Analysis" },
];

const statuses = [
  { id: "all", label: "All Status" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "scheduled", label: "Scheduled" },
  { id: "review", label: "In Review" },
];

const mockArticles: Article[] = [
  {
    id: "1",
    title: "JSE All Share Index Hits Record High Amid Global Rally",
    excerpt: "The Johannesburg Stock Exchange's All Share Index reached unprecedented levels...",
    author: "Thabo Mokoena",
    category: "Markets",
    tags: ["JSE", "Equities", "South Africa"],
    status: "published",
    views: 12456,
    publishedAt: "2025-01-24T08:00:00Z",
    createdAt: "2025-01-23T14:30:00Z",
    featured: true,
  },
  {
    id: "2",
    title: "Central Bank of Nigeria Holds Interest Rates Steady",
    excerpt: "The Monetary Policy Committee decided to maintain rates...",
    author: "Amara Obi",
    category: "Economics",
    tags: ["Nigeria", "CBN", "Interest Rates"],
    status: "published",
    views: 8934,
    publishedAt: "2025-01-24T06:00:00Z",
    createdAt: "2025-01-23T18:00:00Z",
    featured: false,
  },
  {
    id: "3",
    title: "Mining Sector Outlook 2025: Opportunities and Challenges",
    excerpt: "An in-depth analysis of the African mining sector...",
    author: "Dr. Fatima Hassan",
    category: "Analysis",
    tags: ["Mining", "Commodities", "Research"],
    status: "draft",
    views: 0,
    publishedAt: null,
    createdAt: "2025-01-23T10:00:00Z",
    featured: false,
  },
  {
    id: "4",
    title: "MTN Q4 Earnings Preview: What to Expect",
    excerpt: "Analysts predict strong results driven by mobile money growth...",
    author: "Chidi Okonkwo",
    category: "Companies",
    tags: ["MTN", "Earnings", "Telecom"],
    status: "scheduled",
    views: 0,
    publishedAt: "2025-01-25T08:00:00Z",
    createdAt: "2025-01-22T16:00:00Z",
    featured: false,
  },
  {
    id: "5",
    title: "Rand Forecast: Currency Analysts Weigh In",
    excerpt: "The South African Rand faces mixed signals as global factors...",
    author: "Sarah Mulondo",
    category: "Forex",
    tags: ["Rand", "Forex", "South Africa"],
    status: "review",
    views: 0,
    publishedAt: null,
    createdAt: "2025-01-23T09:00:00Z",
    featured: false,
  },
];

function getStatusColor(status: Article["status"]) {
  switch (status) {
    case "published":
      return "bg-market-up/20 text-market-up";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "scheduled":
      return "bg-blue-500/20 text-blue-400";
    case "review":
      return "bg-purple-500/20 text-purple-400";
  }
}

function getStatusIcon(status: Article["status"]) {
  switch (status) {
    case "published":
      return <CheckCircle className="h-4 w-4" />;
    case "draft":
      return <Edit className="h-4 w-4" />;
    case "scheduled":
      return <Clock className="h-4 w-4" />;
    case "review":
      return <Eye className="h-4 w-4" />;
  }
}

export default function ArticlesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      article.category.toLowerCase() === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || article.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleSelectArticle = (id: string) => {
    setSelectedArticles((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map((a) => a.id));
    }
  };

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
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
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
          <button className="px-3 py-1 text-sm bg-market-up/20 text-market-up rounded hover:bg-market-up/30">
            Publish
          </button>
          <button className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30">
            Unpublish
          </button>
          <button className="px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30">
            Delete
          </button>
        </div>
      )}

      {/* Articles Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedArticles.length === filteredArticles.length}
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
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
            >
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedArticles.includes(article.id)}
                  onChange={() => toggleSelectArticle(article.id)}
                  className="rounded border-terminal-border"
                />
              </div>
              <div className="col-span-5">
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="font-medium hover:text-brand-orange transition-colors line-clamp-1"
                >
                  {article.featured && (
                    <span className="text-brand-orange mr-1">*</span>
                  )}
                  {article.title}
                </Link>
                <div className="text-sm text-muted-foreground mt-1">
                  By {article.author}
                </div>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded">
                  {article.category}
                </span>
              </div>
              <div className="col-span-1 flex justify-center">
                <span
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                    getStatusColor(article.status)
                  )}
                >
                  {getStatusIcon(article.status)}
                  <span className="hidden sm:inline capitalize">{article.status}</span>
                </span>
              </div>
              <div className="col-span-1 text-right text-sm">
                {article.views > 0 ? article.views.toLocaleString() : "-"}
              </div>
              <div className="col-span-1 text-right text-sm text-muted-foreground">
                {new Date(article.createdAt).toLocaleDateString("en-ZA", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredArticles.length} of {mockArticles.length} articles
        </p>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50">
            Previous
          </button>
          <button className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
