"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Save,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Code,
  X,
  Upload,
  User,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService } from "@/services/api/editorial";
import { newsService } from "@/services/api/news";
import { toast } from "sonner";
import type { Category } from "@/types";

export default function NewOpinionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Array<{ name: string; slug: string }>>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageCaption, setFeaturedImageCaption] = useState("");
  const [status, setStatus] = useState<"draft" | "pending_review" | "published">("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // SEO fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await newsService.getCategories();
        setCategories(cats);
        // Default to opinion category if exists
        const opinionCat = cats.find((c) => c.slug === "opinion" || c.name.toLowerCase() === "opinion");
        if (opinionCat) {
          setCategory(opinionCat.slug);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    const tagSlug = trimmed.toLowerCase().replace(/\s+/g, "-");
    if (!tags.find((t) => t.slug === tagSlug)) {
      setTags([...tags, { name: trimmed, slug: tagSlug }]);
      setTagInput("");
    }
  };

  const removeTag = (tagSlug: string) => {
    setTags(tags.filter((t) => t.slug !== tagSlug));
  };

  const handleSave = async (saveStatus: typeof status) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!category) {
      toast.error("Category is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsSaving(true);
    try {
      await editorialService.createArticle({
        title,
        subtitle,
        excerpt,
        content,
        category,
        content_type: "opinion",
        tags: tags.map((t) => t.slug),
        featured_image_url: featuredImage,
        featured_image_caption: featuredImageCaption,
        status: saveStatus,
        is_featured: isFeatured,
        is_premium: isPremium,
        meta_title: metaTitle || title.substring(0, 70),
        meta_description: metaDescription || excerpt.substring(0, 160),
      });

      toast.success(saveStatus === "published" ? "Opinion published successfully!" : "Opinion saved as draft");
      router.push("/admin/opinions");
    } catch (error: any) {
      console.error("Failed to save opinion:", error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Failed to save opinion";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Word count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/opinions"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Opinion Piece</h1>
            <p className="text-sm text-muted-foreground">
              Share your analysis, commentary, or editorial perspective
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
          <div className="relative bg-terminal-bg border border-terminal-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-terminal-bg-secondary rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <article className="prose prose-invert max-w-none">
                <h1 className="text-3xl font-bold mb-2">{title || "Untitled Opinion"}</h1>
                {subtitle && <p className="text-xl text-muted-foreground mb-4">{subtitle}</p>}
                {featuredImage && (
                  <img src={featuredImage} alt={title} className="w-full rounded-lg mb-6" />
                )}
                <ReactMarkdown>{content}</ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Opinion title..."
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Subtitle */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A compelling subtitle for your piece..."
              className="w-full bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief summary of your opinion (shown in listings)..."
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Content */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="flex items-center gap-1 p-2 border-b border-terminal-border bg-terminal-bg text-xs text-muted-foreground">
              Write your opinion in Markdown format
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your perspective, analysis, or commentary...

Use Markdown for formatting:
- **bold** for emphasis
- *italic* for subtle emphasis
- ## Headings for sections
- > Blockquotes for key points
- Lists with - or 1. 2. 3."
              className="w-full h-96 p-4 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between px-4 py-2 border-t border-terminal-border text-xs text-muted-foreground">
              <span>{wordCount} words ({readTime} min read)</span>
              <span>Markdown supported</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category & Status */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-4">
            <h3 className="font-semibold">Publishing</h3>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loadingCategories}
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-terminal-border"
                />
                <span className="text-sm">Featured Opinion</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="rounded border-terminal-border"
                />
                <span className="text-sm">Premium Content</span>
              </label>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <h3 className="font-semibold mb-4">Featured Image</h3>
            {featuredImage ? (
              <div className="relative mb-4">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  onClick={() => setFeaturedImage("")}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mb-4 p-8 border-2 border-dashed border-terminal-border rounded-lg text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No image selected</p>
              </div>
            )}
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Image URL..."
              className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary mb-2"
            />
            <input
              type="text"
              value={featuredImageCaption}
              onChange={(e) => setFeaturedImageCaption(e.target.value)}
              placeholder="Image caption..."
              className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Tags */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <h3 className="font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="flex items-center gap-1 px-2 py-1 bg-terminal-bg rounded text-sm"
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.slug)}
                    className="hover:text-market-down"
                  >
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => addTag(tagInput)}
                className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <h3 className="font-semibold mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Meta title..."}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={excerpt || "Meta description..."}
                  rows={3}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
