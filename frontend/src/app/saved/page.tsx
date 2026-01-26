"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Search,
  Trash2,
  ExternalLink,
  Calendar,
  Folder,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";

interface SavedArticle {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  image: string;
  url: string;
  savedAt: string;
  folder?: string;
}

const mockSaved: SavedArticle[] = [
  {
    id: "1",
    title: "JSE All Share Index Hits Record High Amid Global Rally",
    excerpt: "The Johannesburg Stock Exchange's All Share Index reached unprecedented levels today...",
    author: "Thabo Mokoena",
    category: "Markets",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
    url: "/news/jse-record-high",
    savedAt: "2025-01-24T10:00:00Z",
    folder: "Market Analysis",
  },
  {
    id: "2",
    title: "Central Bank of Nigeria Holds Interest Rates Steady",
    excerpt: "The Monetary Policy Committee decided to maintain the benchmark rate...",
    author: "Amara Obi",
    category: "Economics",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=200&fit=crop",
    url: "/news/cbn-rates-decision",
    savedAt: "2025-01-23T14:00:00Z",
    folder: "Central Banks",
  },
  {
    id: "3",
    title: "Mining Sector Outlook: Opportunities in African Resources",
    excerpt: "Expert analysis on the African mining sector and investment opportunities...",
    author: "Dr. Fatima Hassan",
    category: "Analysis",
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=200&fit=crop",
    url: "/news/mining-outlook",
    savedAt: "2025-01-22T09:00:00Z",
  },
  {
    id: "4",
    title: "Interview: Aliko Dangote on Africa's Industrial Future",
    excerpt: "Africa's richest man shares his vision for manufacturing...",
    author: "Chidi Okonkwo",
    category: "Interview",
    image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=200&fit=crop",
    url: "/news/dangote-interview",
    savedAt: "2025-01-20T16:00:00Z",
    folder: "Interviews",
  },
];

const folders = ["All", "Market Analysis", "Central Banks", "Interviews", "Research"];

export default function SavedPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [saved, setSaved] = useState(mockSaved);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All");

  const removeFromSaved = (id: string) => {
    setSaved(saved.filter((article) => article.id !== id));
  };

  const filteredArticles = saved.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder =
      selectedFolder === "All" || article.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12">
          <div className="max-w-md mx-auto text-center">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Saved Articles</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to save articles and read them later.
            </p>
            <Link
              href="/login"
              className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-brand-orange" />
              Saved Articles
            </h1>
            <p className="text-muted-foreground">
              {saved.length} articles saved for later reading.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search saved articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Folders Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Folder className="h-4 w-4 text-brand-orange" />
                  Folders
                </h3>
                <button className="p-1 text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      selectedFolder === folder
                        ? "bg-brand-orange text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                    )}
                  >
                    {folder}
                    <span className="float-right">
                      {folder === "All"
                        ? saved.length
                        : saved.filter((a) => a.folder === folder).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="flex-1">
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => removeFromSaved(article.id)}
                          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                          <Bookmark className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs bg-terminal-bg-elevated rounded">
                          {article.category}
                        </span>
                        {article.folder && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Folder className="h-3 w-3" />
                            {article.folder}
                          </span>
                        )}
                      </div>
                      <Link href={article.url}>
                        <h3 className="font-semibold mb-2 line-clamp-2 hover:text-brand-orange transition-colors">
                          {article.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{article.author}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Saved {new Date(article.savedAt).toLocaleDateString("en-ZA", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved articles</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "No articles match your search."
                    : "Save articles to read them later."}
                </p>
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
                >
                  Browse News
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
