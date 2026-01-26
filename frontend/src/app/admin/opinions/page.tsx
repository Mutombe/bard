"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Opinion {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    title: string;
    avatar: string;
  };
  category: string;
  status: "published" | "draft" | "scheduled";
  views: number;
  comments: number;
  publishedAt: string | null;
  createdAt: string;
}

const mockOpinions: Opinion[] = [
  {
    id: "1",
    title: "Why the JSE Rally Has More Room to Run",
    excerpt: "Despite hitting record highs, fundamental factors suggest the South African market remains undervalued...",
    author: {
      name: "Dr. Fatima Hassan",
      title: "Chief Economist",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
    },
    category: "Market Commentary",
    status: "published",
    views: 8456,
    comments: 45,
    publishedAt: "2025-01-24T10:00:00Z",
    createdAt: "2025-01-23T14:00:00Z",
  },
  {
    id: "2",
    title: "Nigeria's Reform Path: A Reality Check",
    excerpt: "While the government has made bold moves, implementation challenges remain significant...",
    author: {
      name: "Chidi Okonkwo",
      title: "Nigeria Bureau Chief",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    category: "Economic Analysis",
    status: "published",
    views: 6234,
    comments: 32,
    publishedAt: "2025-01-23T08:00:00Z",
    createdAt: "2025-01-22T16:00:00Z",
  },
  {
    id: "3",
    title: "The Case for African Infrastructure Bonds",
    excerpt: "Institutional investors are missing a significant opportunity in African fixed income...",
    author: {
      name: "Sarah Mulondo",
      title: "Fixed Income Analyst",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    },
    category: "Investment Strategy",
    status: "draft",
    views: 0,
    comments: 0,
    publishedAt: null,
    createdAt: "2025-01-24T09:00:00Z",
  },
];

const categories = [
  "All Categories",
  "Market Commentary",
  "Economic Analysis",
  "Investment Strategy",
  "Sector Deep Dive",
  "Policy Watch",
];

function getStatusColor(status: Opinion["status"]) {
  switch (status) {
    case "published":
      return "bg-market-up/20 text-market-up";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "scheduled":
      return "bg-blue-500/20 text-blue-400";
  }
}

export default function OpinionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredOpinions = mockOpinions.filter((opinion) => {
    const matchesSearch =
      opinion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opinion.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" ||
      opinion.category === selectedCategory;
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
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
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
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Opinions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOpinions.map((opinion) => (
          <div
            key={opinion.id}
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src={opinion.author.avatar}
                      alt={opinion.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{opinion.author.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {opinion.author.title}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium capitalize",
                    getStatusColor(opinion.status)
                  )}
                >
                  {opinion.status}
                </span>
              </div>

              <Link
                href={`/admin/opinions/${opinion.id}`}
                className="block mb-3"
              >
                <h3 className="font-semibold text-lg hover:text-brand-orange transition-colors">
                  {opinion.title}
                </h3>
              </Link>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {opinion.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="px-2 py-1 bg-terminal-bg-elevated rounded text-xs">
                    {opinion.category}
                  </span>
                  {opinion.status === "published" && (
                    <>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {opinion.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {opinion.comments}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/opinions/${opinion.id}`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg-elevated rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOpinions.length === 0 && (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No opinions found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or create a new opinion piece.
          </p>
          <Link
            href="/admin/opinions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Opinion
          </Link>
        </div>
      )}
    </div>
  );
}
