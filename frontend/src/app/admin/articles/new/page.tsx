"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService } from "@/services/api/editorial";

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

const availableTags = [
  "JSE",
  "NGX",
  "EGX",
  "South Africa",
  "Nigeria",
  "Egypt",
  "Kenya",
  "Banking",
  "Mining",
  "Telecom",
  "Energy",
  "Retail",
  "Technology",
  "Earnings",
  "IPO",
  "M&A",
  "Interest Rates",
  "Inflation",
  "GDP",
  "Forex",
  "Commodities",
  "Gold",
  "Oil",
  "Research",
];

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [relatedStocks, setRelatedStocks] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (saveStatus: typeof status) => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const articleData = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        status: (saveStatus === "published" ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
        is_featured: featured,
        featured_image: featuredImage || undefined,
        content_type: "NEWS" as const,
      };

      await editorialService.createArticle(articleData);
      setSuccess(true);

      // Redirect after short delay to show success
      setTimeout(() => {
        router.push("/admin/articles");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to save article:", err);
      setError(err.response?.data?.message || err.response?.data?.detail || "Failed to save article. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
            <h1 className="text-2xl font-bold">New Article</h1>
            <p className="text-sm text-muted-foreground">
              Create a new news article or story
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave("draft")}
            disabled={isSaving || success}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            onClick={() => {}}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={isSaving || success}
            className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish"
            )}
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-green-400">Article saved successfully! Redirecting...</p>
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
              placeholder="Brief summary of the article (appears in previews)..."
              rows={3}
              className="w-full bg-transparent border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange resize-none"
            />
          </div>

          {/* Content Editor */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            {/* Toolbar */}
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

            {/* Editor Area */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content here...

You can use markdown formatting:
- **bold** for emphasis
- *italic* for subtle emphasis
- [links](url) for references
- > blockquotes for citations

Start writing..."
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
              <option value="">Select category...</option>
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
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-2">
                Suggested tags:
              </div>
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter((t) => !tags.includes(t))
                  .slice(0, 8)
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="px-2 py-0.5 text-xs bg-terminal-bg-elevated rounded hover:bg-terminal-bg"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Featured Image</h3>
            {featuredImage ? (
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
            ) : (
              <div className="border-2 border-dashed border-terminal-border rounded-md p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop or click to upload
                </p>
                <button className="px-3 py-1 text-sm bg-terminal-bg-elevated rounded hover:bg-terminal-bg">
                  Browse
                </button>
              </div>
            )}
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Or paste image URL..."
              className="w-full mt-3 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
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
