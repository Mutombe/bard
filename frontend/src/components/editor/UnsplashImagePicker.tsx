"use client";

import { useState, useCallback } from "react";
import {
  Search,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/services/api/client";
import { toast } from "sonner";

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  photographer: string;
  alt: string;
}

interface UnsplashImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: { url: string; photographer: string; alt: string }) => void;
  defaultQuery?: string;
}

export function UnsplashImagePicker({
  isOpen,
  onClose,
  onSelect,
  defaultQuery = "",
}: UnsplashImagePickerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const searchImages = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await authClient.get("/media/unsplash/search/", {
        params: {
          q: searchQuery,
          per_page: 12,
          page: pageNum,
          orientation: "landscape",
        },
      });

      if (pageNum === 1) {
        setImages(response.data.results || []);
      } else {
        setImages((prev) => [...prev, ...(response.data.results || [])]);
      }
      setPage(pageNum);
    } catch (error: any) {
      console.error("Unsplash search error:", error);
      toast.error(error.response?.data?.error || "Failed to search images");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setImages([]);
    setSelectedImage(null);
    searchImages(query, 1);
  };

  const handleLoadMore = () => {
    searchImages(query, page + 1);
  };

  const handleSelect = () => {
    if (selectedImage) {
      onSelect({
        url: selectedImage.url,
        photographer: selectedImage.photographer,
        alt: selectedImage.alt,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-terminal-bg rounded-lg border border-terminal-border w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-brand-orange" />
            <h2 className="text-lg font-semibold">Search Unsplash</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-terminal-bg-secondary rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-terminal-border">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images (e.g., 'stock market', 'african business')"
                className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Suggestions:</span>
            {["stock market", "african business", "finance", "technology", "economy", "banking"].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  setImages([]);
                  searchImages(term, 1);
                }}
                className="px-2 py-1 text-xs bg-terminal-bg-secondary rounded hover:bg-terminal-bg-elevated"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>Search for images to get started</p>
              <p className="text-sm">Free high-quality photos from Unsplash</p>
            </div>
          ) : loading && images.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>No images found for &quot;{query}&quot;</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all",
                      selectedImage?.id === image.id
                        ? "border-brand-orange ring-2 ring-brand-orange/30"
                        : "border-transparent hover:border-terminal-border-light"
                    )}
                  >
                    <img
                      src={image.thumb}
                      alt={image.alt || "Unsplash image"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">
                        Photo by {image.photographer}
                      </p>
                    </div>
                    {selectedImage?.id === image.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-brand-orange rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More */}
              {images.length >= 12 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary text-sm flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-terminal-border bg-terminal-bg-secondary">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>
            <a
              href="https://unsplash.com/?utm_source=bardiq&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange hover:underline flex items-center gap-1"
            >
              Unsplash
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedImage}
              className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm disabled:opacity-50"
            >
              Use Selected Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified inline version for embedding in forms
export function UnsplashInlinePicker({
  onSelect,
  className,
}: {
  onSelect: (image: { url: string; photographer: string; alt: string }) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "px-3 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary text-sm flex items-center gap-2",
          className
        )}
      >
        <Search className="h-4 w-4" />
        Search Unsplash
      </button>
      <UnsplashImagePicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
      />
    </>
  );
}
