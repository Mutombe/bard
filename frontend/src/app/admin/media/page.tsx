"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Search,
  Grid,
  List,
  Trash2,
  Download,
  Copy,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  X,
  Check,
  Loader2,
  AlertCircle,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaService, type MediaFile } from "@/services/api/media";
import { toast } from "sonner";

function getTypeIcon(type: MediaFile["file_type"]) {
  switch (type) {
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "video":
      return <Film className="h-5 w-5" />;
    case "document":
      return <FileText className="h-5 w-5" />;
    case "audio":
      return <Music className="h-5 w-5" />;
    default:
      return <File className="h-5 w-5" />;
  }
}

function MediaSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden animate-pulse"
          >
            <div className="aspect-square bg-terminal-bg" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-terminal-bg rounded w-3/4" />
              <div className="h-3 bg-terminal-bg rounded w-1/2" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-4 p-4 animate-pulse items-center"
        >
          <div className="col-span-1">
            <div className="h-4 w-4 bg-terminal-bg rounded" />
          </div>
          <div className="col-span-5 flex items-center gap-3">
            <div className="h-10 w-10 bg-terminal-bg rounded" />
            <div className="h-4 bg-terminal-bg rounded w-32" />
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-terminal-bg rounded w-16" />
          </div>
          <div className="col-span-1">
            <div className="h-4 bg-terminal-bg rounded w-12" />
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-terminal-bg rounded w-20" />
          </div>
          <div className="col-span-1" />
        </div>
      ))}
    </>
  );
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [stats, setStats] = useState<{ total_files: number; total_size_display: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedType !== "all") params.file_type = selectedType;
      if (searchQuery) params.search = searchQuery;

      const response = await mediaService.getFiles(params);
      setFiles(response.results);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      toast.error("Failed to load media files");
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await mediaService.getStats();
      setStats({ total_files: statsData.total_files, total_size_display: statsData.total_size_display });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [fetchFiles, fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true);
      fetchFiles();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedType, fetchFiles]);

  const toggleSelect = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleUpload = async (uploadFiles: FileList | null) => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = uploadFiles.length;
    let uploaded = 0;
    const newFiles: MediaFile[] = [];

    for (const file of Array.from(uploadFiles)) {
      try {
        const mediaFile = await mediaService.uploadFile(file);
        newFiles.push(mediaFile);
        uploaded++;
        setUploadProgress(Math.round((uploaded / totalFiles) * 100));
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...newFiles, ...prev]);
      toast.success(`Uploaded ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}`);
      fetchStats();
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: number) => {
    setDeletingIds((prev) => [...prev, id]);
    try {
      await mediaService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setSelectedItems((prev) => prev.filter((i) => i !== id));
      toast.success("File deleted");
      fetchStats();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeletingIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    const confirmed = window.confirm(`Delete ${selectedItems.length} file${selectedItems.length > 1 ? "s" : ""}?`);
    if (!confirmed) return;

    setDeletingIds(selectedItems);
    try {
      const result = await mediaService.bulkDelete(selectedItems);
      setFiles((prev) => prev.filter((f) => !selectedItems.includes(f.id)));
      setSelectedItems([]);
      toast.success(result.message);
      fetchStats();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete files");
    } finally {
      setDeletingIds([]);
    }
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${file.name}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const filteredFiles = files.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || item.file_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Media Library</h1>
          <p className="text-muted-foreground">
            {stats ? `${stats.total_files} files (${stats.total_size_display})` : "Upload and manage images, videos, and documents."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Files
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="audio">Audio</option>
          </select>
          <div className="flex border border-terminal-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2",
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2",
                viewMode === "list"
                  ? "bg-primary text-white"
                  : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={deletingIds.length > 0}
            className="px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30 flex items-center gap-1 disabled:opacity-50"
          >
            {deletingIds.length > 0 ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Delete
          </button>
          <button
            onClick={() => setSelectedItems([])}
            className="px-3 py-1 text-sm bg-terminal-bg-elevated text-muted-foreground rounded hover:text-foreground"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <MediaSkeleton viewMode="grid" />
          </div>
        ) : (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
              <div className="col-span-1" />
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-2">Uploaded</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-terminal-border">
              <MediaSkeleton viewMode="list" />
            </div>
          </div>
        )
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No files found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedType !== "all"
              ? "Try adjusting your filters"
              : "Upload your first file to get started"}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-terminal-bg-secondary rounded-lg border overflow-hidden group cursor-pointer transition-all",
                selectedItems.includes(item.id)
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-terminal-border hover:border-primary/50",
                deletingIds.includes(item.id) && "opacity-50"
              )}
              onClick={() => toggleSelect(item.id)}
            >
              <div className="relative aspect-square bg-terminal-bg">
                {item.file_type === "image" && item.url ? (
                  <Image
                    src={item.url}
                    alt={item.alt_text || item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    {getTypeIcon(item.file_type)}
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyUrl(item.url);
                      }}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deletingIds.includes(item.id)}
                      className="p-2 bg-market-down/80 rounded-full hover:bg-market-down"
                      title="Delete"
                    >
                      {deletingIds.includes(item.id) ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Selection indicator */}
                {selectedItems.includes(item.id) && (
                  <div className="absolute top-2 left-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.size_display}
                  {item.dimensions && ` \u2022 ${item.dimensions}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <div className="col-span-1" />
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-terminal-border">
            {filteredFiles.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center",
                  deletingIds.includes(item.id) && "opacity-50"
                )}
              >
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded border-terminal-border"
                  />
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-terminal-bg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.file_type === "image" && item.url ? (
                      <Image
                        src={item.url}
                        alt={item.alt_text || item.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {getTypeIcon(item.file_type)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded capitalize">
                    {item.file_type}
                  </span>
                </div>
                <div className="col-span-1 text-sm">{item.size_display}</div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingIds.includes(item.id)}
                    className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingIds.includes(item.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area (Drag & Drop) */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "mt-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isUploading
            ? "border-primary bg-primary/5"
            : "border-terminal-border hover:border-primary/50"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 mb-4 text-primary animate-spin" />
            <h3 className="font-medium mb-2">Uploading files...</h3>
            <div className="w-64 h-2 bg-terminal-bg rounded-full overflow-hidden">
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
            <h3 className="font-medium mb-2">Drop files here to upload</h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click the button above to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, GIF, MP4, PDF, DOC
            </p>
          </>
        )}
      </div>
    </div>
  );
}
