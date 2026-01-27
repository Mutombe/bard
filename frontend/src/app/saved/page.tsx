"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Search,
  Heart,
  Play,
  Newspaper,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

// LocalStorage keys (same as in page.tsx)
const LIKES_KEY = "bardiq_likes";
const BOOKMARKS_KEY = "bardiq_bookmarks";

function getLikes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
  } catch {
    return [];
  }
}

function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
}

function removeBookmark(id: string) {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);
  if (index > -1) {
    bookmarks.splice(index, 1);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }
}

function removeLike(id: string) {
  const likes = getLikes();
  const index = likes.indexOf(id);
  if (index > -1) {
    likes.splice(index, 1);
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  }
}

interface SavedItem {
  id: string;
  type: "article" | "video";
  data: any;
}

function SavedItemSkeleton() {
  return (
    <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden animate-pulse">
      <Skeleton className="aspect-video" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export default function SavedPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookmarks" | "likes">("bookmarks");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedItems, setBookmarkedItems] = useState<SavedItem[]>([]);
  const [likedItems, setLikedItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadSavedItems();
  }, [mounted]);

  const loadSavedItems = async () => {
    setLoading(true);

    const bookmarkIds = getBookmarks();
    const likeIds = getLikes();

    // Parse IDs to get article/video info (now using slugs for articles)
    const articleBookmarkSlugs = bookmarkIds
      .filter((id) => id.startsWith("article-"))
      .map((id) => id.replace("article-", ""));
    const videoBookmarkIds = bookmarkIds
      .filter((id) => id.startsWith("video-"))
      .map((id) => id.replace("video-", ""));

    const articleLikeSlugs = likeIds
      .filter((id) => id.startsWith("article-"))
      .map((id) => id.replace("article-", ""));
    const videoLikeIds = likeIds
      .filter((id) => id.startsWith("video-"))
      .map((id) => id.replace("video-", ""));

    // Fetch articles for bookmarks
    const bookmarkedArticles: SavedItem[] = [];
    const likedArticles: SavedItem[] = [];

    // Fetch bookmarked articles by slug
    for (const slug of articleBookmarkSlugs.slice(0, 20)) {
      try {
        const response = await apiClient.get(`/news/articles/${slug}/`);
        bookmarkedArticles.push({
          id: `article-${slug}`,
          type: "article",
          data: response.data,
        });
      } catch (error) {
        // Article might be deleted, remove from bookmarks
        removeBookmark(`article-${slug}`);
      }
    }

    // Fetch liked articles by slug
    for (const slug of articleLikeSlugs.slice(0, 20)) {
      try {
        const response = await apiClient.get(`/news/articles/${slug}/`);
        likedArticles.push({
          id: `article-${slug}`,
          type: "article",
          data: response.data,
        });
      } catch (error) {
        // Article might be deleted, remove from likes
        removeLike(`article-${slug}`);
      }
    }

    // Fetch bookmarked videos
    for (const videoId of videoBookmarkIds.slice(0, 10)) {
      try {
        const response = await apiClient.get(`/media/videos/${videoId}/`);
        bookmarkedArticles.push({
          id: `video-${videoId}`,
          type: "video",
          data: response.data,
        });
      } catch (error) {
        // Video might not exist in DB, create placeholder
        bookmarkedArticles.push({
          id: `video-${videoId}`,
          type: "video",
          data: {
            video_id: videoId,
            title: "Saved Video",
            thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          },
        });
      }
    }

    // Fetch liked videos
    for (const videoId of videoLikeIds.slice(0, 10)) {
      try {
        const response = await apiClient.get(`/media/videos/${videoId}/`);
        likedArticles.push({
          id: `video-${videoId}`,
          type: "video",
          data: response.data,
        });
      } catch (error) {
        // Video might not exist in DB, create placeholder with YouTube thumbnail
        likedArticles.push({
          id: `video-${videoId}`,
          type: "video",
          data: {
            video_id: videoId,
            title: "Liked Video",
            thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          },
        });
      }
    }

    setBookmarkedItems(bookmarkedArticles);
    setLikedItems(likedArticles);
    setLoading(false);
  };

  const handleRemove = (id: string, type: "bookmark" | "like") => {
    if (type === "bookmark") {
      removeBookmark(id);
      setBookmarkedItems((items) => items.filter((item) => item.id !== id));
      toast.success("Removed from reading list");
    } else {
      removeLike(id);
      setLikedItems((items) => items.filter((item) => item.id !== id));
      toast.success("Removed from liked items");
    }
  };

  const currentItems = activeTab === "bookmarks" ? bookmarkedItems : likedItems;
  const filteredItems = currentItems.filter((item) => {
    if (!searchQuery) return true;
    const title = item.data.title || "";
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-brand-orange" />
              Saved Items
            </h1>
            <p className="text-muted-foreground">
              Your bookmarked articles and liked content.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search saved items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-terminal-border">
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "bookmarks"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className="h-4 w-4" />
            Reading List
            <span className="px-2 py-0.5 text-xs rounded-full bg-terminal-bg-elevated">
              {bookmarkedItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "likes"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className="h-4 w-4" />
            Liked
            <span className="px-2 py-0.5 text-xs rounded-full bg-terminal-bg-elevated">
              {likedItems.length}
            </span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SavedItemSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange/50 transition-colors group"
              >
                {item.type === "article" ? (
                  <>
                    <div className="relative aspect-video bg-terminal-bg-elevated">
                      {item.data.featured_image ? (
                        <Image
                          src={item.data.featured_image}
                          alt={item.data.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRemove(item.id, activeTab === "bookmarks" ? "bookmark" : "like")}
                          className="p-2 bg-black/70 rounded-full text-white hover:bg-black/90 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs bg-brand-orange/20 text-brand-orange rounded">
                          {item.data.category?.name || "Article"}
                        </span>
                      </div>
                      <Link href={`/news/${item.data.slug}`}>
                        <h3 className="font-semibold mb-2 line-clamp-2 hover:text-brand-orange transition-colors">
                          {item.data.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.data.excerpt}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {item.data.author?.full_name || "Staff Writer"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative aspect-video bg-terminal-bg-elevated">
                      {item.data.thumbnail_url ? (
                        <Image
                          src={item.data.thumbnail_url}
                          alt={item.data.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRemove(item.id, activeTab === "bookmarks" ? "bookmark" : "like")}
                          className="p-2 bg-black/70 rounded-full text-white hover:bg-black/90 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                          Video
                        </span>
                        {item.data.channel_title && (
                          <span className="text-xs text-muted-foreground">
                            {item.data.channel_title}
                          </span>
                        )}
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${item.data.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <h3 className="font-semibold mb-2 line-clamp-2 hover:text-brand-orange transition-colors">
                          {item.data.title}
                        </h3>
                      </a>
                      {item.data.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.data.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            {activeTab === "bookmarks" ? (
              <>
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved articles</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "No articles match your search."
                    : "Click the bookmark icon on any article to save it for later."}
                </p>
              </>
            ) : (
              <>
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No liked articles</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "No articles match your search."
                    : "Click the heart icon on any article to like it."}
                </p>
              </>
            )}
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
            >
              Browse News
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
