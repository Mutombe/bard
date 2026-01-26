"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Clock,
  Image as ImageIcon,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Plus,
  X,
  Upload,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  "Markets",
  "Economics",
  "Companies",
  "Commodities",
  "Forex",
  "Analysis",
  "Opinion",
  "Breaking",
];

// Mock article data
const mockArticle = {
  id: "1",
  title: "JSE All Share Index Hits Record High Amid Global Rally",
  excerpt: "The Johannesburg Stock Exchange's All Share Index reached unprecedented levels today, driven by strong performance in mining and financial stocks.",
  content: `The Johannesburg Stock Exchange's All Share Index (ALSI) surged to a record high on Tuesday, breaking through the 80,000-point barrier for the first time in its history.

The milestone comes amid a broader rally in global equity markets, with investors responding positively to signs of easing inflation and expectations of interest rate cuts in major economies.

## Key Drivers

**Mining stocks** led the charge, with Anglo American (AGL) gaining 8.75% and BHP Group rising 5.2%. The sector benefited from rising commodity prices and strong demand from China.

**Financial services** also posted significant gains, with Standard Bank (SBK) up 4.8% and FirstRand (FSR) climbing 3.57%.

## Analyst Views

"This is a significant psychological milestone for the South African market," said Thabo Mokoena, Chief Market Analyst at Bardiq Journal. "It reflects both global risk-on sentiment and improving fundamentals in key sectors."

However, some analysts urged caution. "While the momentum is encouraging, investors should be mindful of potential headwinds, including rand volatility and ongoing load shedding concerns," noted Dr. Fatima Hassan.

## What's Next

Market participants will be closely watching the South African Reserve Bank's upcoming monetary policy decision, with most economists expecting rates to remain on hold.`,
  category: "Markets",
  tags: ["JSE", "Equities", "South Africa", "Mining", "Banking"],
  relatedStocks: ["AGL", "SBK", "FSR", "NPN"],
  featuredImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
  status: "published" as const,
  featured: true,
  author: "Thabo Mokoena",
  publishedAt: "2025-01-24T08:00:00Z",
  createdAt: "2025-01-23T14:30:00Z",
};

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const [title, setTitle] = useState(mockArticle.title);
  const [excerpt, setExcerpt] = useState(mockArticle.excerpt);
  const [content, setContent] = useState(mockArticle.content);
  const [category, setCategory] = useState(mockArticle.category);
  const [tags, setTags] = useState<string[]>(mockArticle.tags);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState(mockArticle.featuredImage);
  const [relatedStocks, setRelatedStocks] = useState<string[]>(mockArticle.relatedStocks);
  const [stockInput, setStockInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">(mockArticle.status);
  const [scheduledDate, setScheduledDate] = useState("");
  const [featured, setFeatured] = useState(mockArticle.featured);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addStock = () => {
    if (stockInput && !relatedStocks.includes(stockInput.toUpperCase())) {
      setRelatedStocks([...relatedStocks, stockInput.toUpperCase()]);
      setStockInput("");
    }
  };

  const removeStock = (stock: string) => {
    setRelatedStocks(relatedStocks.filter((s) => s !== stock));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push("/admin/articles");
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Article</h1>
            <p className="text-sm text-muted-foreground">
              Last saved {new Date(mockArticle.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-market-down border border-market-down/30 rounded-md hover:bg-market-down/10 transition-colors text-sm flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <Link
            href={`/news/${params.id}`}
            target="_blank"
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-terminal-bg-secondary border border-terminal-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Article?</h3>
            <p className="text-muted-foreground mb-6">
              This action cannot be undone. The article will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-market-down text-white rounded-md hover:bg-market-down/80"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title..."
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Excerpt / Summary
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the article..."
              rows={3}
              className="w-full bg-transparent border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange resize-none"
            />
          </div>

          {/* Content Editor */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="flex items-center gap-1 p-2 border-b border-terminal-border bg-terminal-bg overflow-x-auto">
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <Heading1 className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <Heading2 className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <Bold className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <Italic className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <List className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <ListOrdered className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <Quote className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <LinkIcon className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <ImageIcon className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <Code className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[500px] p-6 bg-transparent border-none outline-none resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Publish Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              {status === "scheduled" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Schedule Date
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-terminal-border"
                />
                <label htmlFor="featured" className="text-sm">
                  Featured article
                </label>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Category</h3>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-brand-orange/20 text-brand-orange rounded"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag(tagInput)}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
              />
              <button
                onClick={() => addTag(tagInput)}
                className="px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md hover:bg-terminal-bg text-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Featured Image</h3>
            {featuredImage && (
              <div className="relative aspect-video rounded-md overflow-hidden mb-3">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setFeaturedImage("")}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Image URL..."
              className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Related Stocks */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Related Stocks</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {relatedStocks.map((stock) => (
                <span
                  key={stock}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded font-mono"
                >
                  {stock}
                  <button onClick={() => removeStock(stock)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStock()}
                placeholder="Add stock symbol..."
                className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange font-mono uppercase"
              />
              <button
                onClick={addStock}
                className="px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md hover:bg-terminal-bg text-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
