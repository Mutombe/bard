"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Upload,
  FolderOpen,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaService, type MediaFile } from "@/services/api/media";
import { toast } from "sonner";

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  photographer: string;
  alt: string;
}

type TabType = "library" | "unsplash" | "upload";

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: { url: string; photographer?: string; alt?: string; file?: File }) => void;
  defaultQuery?: string;
  uploadOnly?: boolean;
}

export function ImagePicker({
  isOpen,
  onClose,
  onSelect,
  defaultQuery = "",
  uploadOnly = false,
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>(uploadOnly ? "upload" : "library");

  // Library state
  const [libraryImages, setLibraryImages] = useState<MediaFile[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [librarySearch, setLibrarySearch] = useState("");

  // Unsplash state
  const [unsplashQuery, setUnsplashQuery] = useState(defaultQuery);
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection
  const [selectedImage, setSelectedImage] = useState<{ type: "library" | "unsplash"; data: MediaFile | UnsplashImage } | null>(null);

  // Fetch library images on mount
  useEffect(() => {
    if (isOpen && activeTab === "library") {
      fetchLibraryImages();
    }
  }, [isOpen, activeTab]);

  const fetchLibraryImages = async () => {
    setLibraryLoading(true);
    try {
      const response = await mediaService.getFiles({
        file_type: "image",
        page_size: 50,
        search: librarySearch || undefined,
      });
      setLibraryImages(response.results);
    } catch (error) {
      console.error("Failed to fetch library images:", error);
      toast.error("Failed to load media library");
    } finally {
      setLibraryLoading(false);
    }
  };

  // Debounced library search
  useEffect(() => {
    if (activeTab === "library") {
      const timer = setTimeout(() => {
        fetchLibraryImages();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [librarySearch, activeTab]);

  const searchUnsplash = useCallback(async (query: string, pageNum: number = 1) => {
    if (!query.trim()) return;

    setUnsplashLoading(true);
    setHasSearched(true);

    try {
      const response = await mediaService.searchUnsplash({
        q: query,
        per_page: 12,
        page: pageNum,
        orientation: "landscape",
      });

      if (pageNum === 1) {
        setUnsplashImages(response.results || []);
      } else {
        setUnsplashImages((prev) => [...prev, ...(response.results || [])]);
      }
      setUnsplashPage(pageNum);
    } catch (error: any) {
      console.error("Unsplash search error:", error);
      toast.error(error.response?.data?.error || "Failed to search Unsplash");
    } finally {
      setUnsplashLoading(false);
    }
  }, []);

  const handleUnsplashSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUnsplashImages([]);
    setSelectedImage(null);
    searchUnsplash(unsplashQuery, 1);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploaded = 0;
    const newFiles: MediaFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }

      try {
        const mediaFile = await mediaService.uploadFile(file, {
          alt_text: file.name.replace(/\.[^/.]+$/, ""),
        });
        newFiles.push(mediaFile);
        uploaded++;
        setUploadProgress(Math.round((uploaded / totalFiles) * 100));
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setLibraryImages((prev) => [...newFiles, ...prev]);
      toast.success(`Uploaded ${newFiles.length} image${newFiles.length > 1 ? "s" : ""}`);

      // In uploadOnly mode, directly call onSelect with the file
      if (uploadOnly && newFiles[0]) {
        const uploadedFile = files[0];
        onSelect({
          url: newFiles[0].url,
          alt: newFiles[0].alt_text || newFiles[0].name,
          file: uploadedFile,
        });
        onClose();
        return;
      }

      // Auto-select the first uploaded image
      if (newFiles[0]) {
        setSelectedImage({ type: "library", data: newFiles[0] });
        setActiveTab("library");
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleConfirm = () => {
    if (!selectedImage) return;

    if (selectedImage.type === "library") {
      const file = selectedImage.data as MediaFile;
      onSelect({
        url: file.url,
        alt: file.alt_text || file.name,
      });
    } else {
      const image = selectedImage.data as UnsplashImage;
      onSelect({
        url: image.url,
        photographer: image.photographer,
        alt: image.alt,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-terminal-bg rounded-lg border border-terminal-border w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{uploadOnly ? "Upload Profile Picture" : "Select Image"}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-terminal-bg-secondary rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        {!uploadOnly && (
          <div className="flex border-b border-terminal-border">
            <button
              onClick={() => setActiveTab("library")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "library"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              Media Library
            </button>
            <button
              onClick={() => setActiveTab("unsplash")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "unsplash"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Camera className="h-4 w-4" />
              Unsplash
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "upload"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Media Library Tab */}
          {activeTab === "library" && (
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search media library..."
                  className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Grid */}
              {libraryLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : libraryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p>No images in library</p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm"
                  >
                    Upload Images
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {libraryImages.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => setSelectedImage({ type: "library", data: image })}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all",
                        selectedImage?.type === "library" && (selectedImage.data as MediaFile).id === image.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-terminal-border"
                      )}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt_text || image.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">
                          {image.name}
                        </p>
                      </div>
                      {selectedImage?.type === "library" && (selectedImage.data as MediaFile).id === image.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unsplash Tab */}
          {activeTab === "unsplash" && (
            <div className="p-4">
              {/* Search */}
              <form onSubmit={handleUnsplashSearch} className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    placeholder="Search Unsplash for images..."
                    className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={unsplashLoading || !unsplashQuery.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {unsplashLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </button>
              </form>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-muted-foreground">Suggestions:</span>
                {["stock market", "african business", "finance", "technology", "economy"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setUnsplashQuery(term);
                      setUnsplashImages([]);
                      searchUnsplash(term, 1);
                    }}
                    className="px-2 py-1 text-xs bg-terminal-bg-secondary rounded hover:bg-terminal-bg-elevated"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {!hasSearched ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Camera className="h-12 w-12 mb-4 opacity-50" />
                  <p>Search for images to get started</p>
                  <p className="text-sm">Free high-quality photos from Unsplash</p>
                </div>
              ) : unsplashLoading && unsplashImages.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : unsplashImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p>No images found for &quot;{unsplashQuery}&quot;</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {unsplashImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => setSelectedImage({ type: "unsplash", data: image })}
                        className={cn(
                          "relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all",
                          selectedImage?.type === "unsplash" && (selectedImage.data as UnsplashImage).id === image.id
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent hover:border-terminal-border"
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
                        {selectedImage?.type === "unsplash" && (selectedImage.data as UnsplashImage).id === image.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {unsplashImages.length >= 12 && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => searchUnsplash(unsplashQuery, unsplashPage + 1)}
                        disabled={unsplashLoading}
                        className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary text-sm flex items-center gap-2"
                      >
                        {unsplashLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="p-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
                multiple
                accept="image/*"
              />

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                  uploading
                    ? "border-primary bg-primary/5"
                    : "border-terminal-border hover:border-primary/50 cursor-pointer"
                )}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 mb-4 text-primary animate-spin" />
                    <h3 className="font-medium mb-2">Uploading...</h3>
                    <div className="w-64 h-2 bg-terminal-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Drop images here to upload</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to select files
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: JPG, PNG, GIF, WebP
                    </p>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Uploaded images are stored in your media library and can be reused
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {uploadOnly ? (
          <div className="flex items-center justify-end p-4 border-t border-terminal-border bg-terminal-bg-secondary">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 border-t border-terminal-border bg-terminal-bg-secondary">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {activeTab === "unsplash" && (
                <>
                  <span>Powered by</span>
                  <a
                    href="https://unsplash.com/?utm_source=bardiq&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Unsplash
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
              {activeTab === "library" && (
                <span>{libraryImages.length} images in library</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedImage}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm disabled:opacity-50"
              >
                Use Selected Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simplified button version
export function ImagePickerButton({
  onSelect,
  className,
  children,
}: {
  onSelect: (image: { url: string; photographer?: string; alt?: string }) => void;
  className?: string;
  children?: React.ReactNode;
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
        {children || (
          <>
            <ImageIcon className="h-4 w-4" />
            Select Image
          </>
        )}
      </button>
      <ImagePicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
      />
    </>
  );
}
