"use client";

import { useState } from "react";
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
  MoreHorizontal,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "audio";
  url: string;
  size: string;
  dimensions?: string;
  uploadedAt: string;
  uploadedBy: string;
}

const mockMedia: MediaItem[] = [
  {
    id: "1",
    name: "jse-trading-floor.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
    size: "1.2 MB",
    dimensions: "1920x1080",
    uploadedAt: "2025-01-24T10:00:00Z",
    uploadedBy: "Thabo Mokoena",
  },
  {
    id: "2",
    name: "nairobi-skyline.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=400&h=300&fit=crop",
    size: "2.4 MB",
    dimensions: "2560x1440",
    uploadedAt: "2025-01-23T14:00:00Z",
    uploadedBy: "Sarah Mulondo",
  },
  {
    id: "3",
    name: "mining-operations.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=300&fit=crop",
    size: "1.8 MB",
    dimensions: "1920x1280",
    uploadedAt: "2025-01-22T09:00:00Z",
    uploadedBy: "Dr. Fatima Hassan",
  },
  {
    id: "4",
    name: "currency-forex.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=300&fit=crop",
    size: "0.9 MB",
    dimensions: "1600x900",
    uploadedAt: "2025-01-21T16:00:00Z",
    uploadedBy: "Chidi Okonkwo",
  },
  {
    id: "5",
    name: "lagos-business-district.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&h=300&fit=crop",
    size: "1.5 MB",
    dimensions: "1920x1080",
    uploadedAt: "2025-01-20T11:00:00Z",
    uploadedBy: "Amara Obi",
  },
  {
    id: "6",
    name: "market-report-q4.pdf",
    type: "document",
    url: "#",
    size: "4.2 MB",
    uploadedAt: "2025-01-19T08:00:00Z",
    uploadedBy: "Dr. Fatima Hassan",
  },
];

function getTypeIcon(type: MediaItem["type"]) {
  switch (type) {
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "video":
      return <Film className="h-5 w-5" />;
    case "document":
      return <FileText className="h-5 w-5" />;
    case "audio":
      return <Music className="h-5 w-5" />;
  }
}

export default function MediaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("all");

  const filteredMedia = mockMedia.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Media Library</h1>
          <p className="text-muted-foreground">
            Upload and manage images, videos, and documents.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors">
          <Upload className="h-4 w-4" />
          Upload Files
        </button>
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
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
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
                  ? "bg-brand-orange text-white"
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
                  ? "bg-brand-orange text-white"
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
          <button className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 flex items-center gap-1">
            <Download className="h-3 w-3" />
            Download
          </button>
          <button className="px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30 flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}

      {/* Media Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-terminal-bg-secondary rounded-lg border overflow-hidden group cursor-pointer transition-colors",
                selectedItems.includes(item.id)
                  ? "border-brand-orange"
                  : "border-terminal-border hover:border-brand-orange/50"
              )}
              onClick={() => toggleSelect(item.id)}
            >
              <div className="relative aspect-square bg-terminal-bg">
                {item.type === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    {getTypeIcon(item.type)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyUrl(item.url);
                      }}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                    >
                      <Copy className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.size}
                  {item.dimensions && ` • ${item.dimensions}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <div className="col-span-1"></div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-terminal-border">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
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
                  <div className="h-10 w-10 rounded bg-terminal-bg flex items-center justify-center overflow-hidden">
                    {item.type === "image" ? (
                      <Image
                        src={item.url}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {getTypeIcon(item.type)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded capitalize">
                    {item.type}
                  </span>
                </div>
                <div className="col-span-1 text-sm">{item.size}</div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(item.uploadedAt).toLocaleDateString()}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="mt-6 border-2 border-dashed border-terminal-border rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">Drop files here to upload</h3>
        <p className="text-sm text-muted-foreground mb-4">
          or click the button above to select files
        </p>
        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, GIF, MP4, PDF, DOC
        </p>
      </div>
    </div>
  );
}
