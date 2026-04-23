"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FloppyDisk,
  Eye,
  Clock,
  Image as ImageIcon,
  Plus,
  X,
  Trash,
  CircleNotch,
  WarningCircle,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { cn, slugify as toUrlSlug } from "@/lib/utils";
import { editorialService, type Article, type Writer } from "@/services/api/editorial";
import { newsService } from "@/services/api/news";
import { mediaService } from "@/services/api/media";
import { ModernEditor } from "@/components/editor/ModernEditor";
import { toast } from "sonner";

// Field limits — MUST match backend/apps/news/models.py
const LIMITS = {
  title: 300,
  subtitle: 500,
  excerpt: 500,
  imageCaption: 300,
  metaTitle: 70,
  metaDescription: 160,
} as const;

// Content type options
const contentTypes = [
  { value: "news", label: "News" },
  { value: "analysis", label: "Analysis" },
  { value: "opinion", label: "Opinion" },
  { value: "interview", label: "Interview" },
  { value: "press_release", label: "Press Release" },
];

// Status options
const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-terminal-bg-secondary rounded-md" />
          <div>
            <div className="h-8 bg-terminal-bg-secondary rounded w-48 mb-2" />
            <div className="h-4 bg-terminal-bg-secondary rounded w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-terminal-bg-secondary rounded" />
          <div className="h-10 w-32 bg-terminal-bg-secondary rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-20 bg-terminal-bg-secondary rounded-lg" />
          <div className="h-32 bg-terminal-bg-secondary rounded-lg" />
          <div className="h-96 bg-terminal-bg-secondary rounded-lg" />
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-terminal-bg-secondary rounded-lg" />
          <div className="h-48 bg-terminal-bg-secondary rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  // Data states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("news");
  const [tags, setTags] = useState<Array<{ name: string; slug: string }>>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageCaption, setFeaturedImageCaption] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [selectedWriter, setSelectedWriter] = useState<string>("");
  const [writers, setWriters] = useState<Writer[]>([]);

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Fetch article data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch categories + writers in parallel
        const [cats, writersList] = await Promise.all([
          newsService.getCategories(),
          editorialService.getWriters().catch(() => [] as Writer[]),
        ]);
        setCategories(cats);
        setWriters(writersList);

        // Fetch article by ID
        const article = await editorialService.getArticle(articleId);

        // Populate form
        setTitle(article.title || "");
        setSlug(article.slug || "");
        setSubtitle(article.subtitle || "");
        setExcerpt(article.excerpt || "");
        setContent(article.content || "");
        setCategory(article.category?.slug || "");
        setContentType(article.content_type?.toLowerCase() || "news");
        setTags(
          (article.tags || []).map((t: any) =>
            typeof t === "string" ? { name: t, slug: t.toLowerCase().replace(/\s+/g, "-") } : t
          )
        );
        setFeaturedImageUrl(article.featured_image_url || article.featured_image || "");
        setFeaturedImageCaption(article.featured_image_caption || "");
        setStatus(article.status?.toLowerCase() || "draft");
        setIsFeatured(article.is_featured || false);
        setIsBreaking(article.is_breaking || false);
        setIsPremium(article.is_premium || false);
        setMetaTitle(article.meta_title || "");
        setMetaDescription(article.meta_description || "");
        setSelectedWriter(article.writer?.slug || "");
        setLastSaved(article.updated_at ? new Date(article.updated_at) : null);
      } catch (err) {
        console.error("Failed to fetch article:", err);
        setError("Failed to load article. It may not exist or you may not have permission to edit it.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [articleId]);

  // Ctrl/Cmd+S to save. Undo/redo and formatting are now handled inside
  // the TipTap editor, so we don't register those shortcuts here anymore.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Inline image upload hook for the WYSIWYG editor — stores uploads in the
  // media library and inserts an <img> tag referencing the returned URL.
  const handleInlineImageUpload = async (file: File): Promise<string> => {
    try {
      const mediaFile = await mediaService.uploadFile(file, {
        name: file.name,
        alt_text: title || "",
      });
      return mediaFile.url;
    } catch (err) {
      console.error("Inline image upload failed:", err);
      toast.error("Failed to upload image. Please try again.");
      throw err;
    }
  };

  // Tag management
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

  // Save article
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (title.length > LIMITS.title) {
      toast.error(`Title is ${title.length} chars — max ${LIMITS.title}.`);
      return;
    }
    if (subtitle.length > LIMITS.subtitle) {
      toast.error(`Subtitle is ${subtitle.length} chars — max ${LIMITS.subtitle}.`);
      return;
    }
    if (excerpt.length > LIMITS.excerpt) {
      toast.error(`Excerpt is ${excerpt.length} chars — max ${LIMITS.excerpt}.`);
      return;
    }
    if (featuredImageCaption.length > LIMITS.imageCaption) {
      toast.error(`Image caption is ${featuredImageCaption.length} chars — max ${LIMITS.imageCaption}.`);
      return;
    }
    if (metaTitle.length > LIMITS.metaTitle) {
      toast.error(`Meta title is ${metaTitle.length} chars — max ${LIMITS.metaTitle}.`);
      return;
    }
    if (metaDescription.length > LIMITS.metaDescription) {
      toast.error(`Meta description is ${metaDescription.length} chars — max ${LIMITS.metaDescription}.`);
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
      const updated = await editorialService.updateArticle(slug, {
        title,
        slug: slug, // send current slug so edits survive the round-trip
        subtitle,
        excerpt,
        content,
        category,
        content_type: contentType,
        tags: tags.map((t) => t.slug),
        featured_image_url: featuredImageUrl,
        featured_image_caption: featuredImageCaption,
        status,
        is_featured: isFeatured,
        is_breaking: isBreaking,
        is_premium: isPremium,
        meta_title: metaTitle,
        meta_description: metaDescription,
        writer: selectedWriter || null,
      });

      // If the slug changed (user renamed the URL or dedup kicked in),
      // update local state so subsequent saves hit the right record.
      if (updated?.slug && updated.slug !== slug) {
        setSlug(updated.slug);
        // Swap the URL in-place without a full navigation, so the editor
        // doesn't lose their scroll/focus position.
        window.history.replaceState(null, "", `/admin/articles/${updated.slug}`);
      }

      setLastSaved(new Date());
      toast.success("Article saved successfully");
    } catch (err: any) {
      console.error("Failed to save article:", err);
      const httpStatus = err.response?.status;
      const data = err.response?.data;
      let errorMessage = "Failed to save article";
      if (typeof data === "string" && data.includes("<!doctype html")) {
        errorMessage =
          httpStatus === 500
            ? "The server rejected this article (500). Usually a duplicate title or a field exceeding its length limit."
            : `Server returned an HTML error page (${httpStatus}).`;
      } else if (data) {
        if (typeof data === "string") errorMessage = data;
        else if (data.detail) errorMessage = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        else if (data.message) errorMessage = data.message;
        else {
          const fieldErrors = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" | ");
          if (fieldErrors) errorMessage = fieldErrors;
        }
      } else if (!err.response) {
        errorMessage = "Network error — could not reach the server.";
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Send featured-article email to subscribers (manual re-send)
  const handleSendFeaturedEmail = async () => {
    if (!confirm(
      `Send "${title}" to all verified breaking-news subscribers?\n\n` +
      `This queues an email to every subscriber on the list. The automatic ` +
      `signal already fires when an article first becomes featured — use this ` +
      `button only if you need to re-send.`
    )) return;

    setIsSendingEmail(true);
    try {
      const result = await editorialService.sendFeaturedEmail(slug);
      toast.success(result.detail || `Queued to ${result.sent} subscriber(s).`);
    } catch (err: any) {
      console.error("Failed to send featured email:", err);
      const data = err.response?.data;
      const msg = data?.detail || "Failed to send featured-article email.";
      toast.error(msg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Delete article
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await editorialService.deleteArticle(slug);
      toast.success("Article deleted successfully");
      router.push("/admin/articles");
    } catch (err) {
      console.error("Failed to delete article:", err);
      toast.error("Failed to delete article");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Word count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <WarningCircle className="h-12 w-12 text-market-down mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Article</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>
      </div>
    );
  }

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
            {lastSaved && (
              <p className="text-sm text-muted-foreground">
                Last saved {lastSaved.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-market-down border border-market-down/30 rounded-md hover:bg-market-down/10 transition-colors text-sm flex items-center gap-2"
          >
            <Trash className="h-4 w-4" />
            Delete
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <CircleNotch className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDisk className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <div className="relative bg-terminal-bg-secondary border border-terminal-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Article?</h3>
            <p className="text-muted-foreground mb-6">
              This action cannot be undone. The article will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-market-down text-white rounded-md hover:bg-market-down/80 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <CircleNotch className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
          <div className="relative bg-terminal-bg border border-terminal-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h3 className="text-lg font-semibold">Article Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-terminal-bg-secondary rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <article className="prose-journal max-w-none">
                <h1 className="text-3xl font-bold mb-2">{title || "Untitled Article"}</h1>
                {subtitle && <p className="text-xl text-muted-foreground mb-4">{subtitle}</p>}
                {featuredImageUrl && (
                  <img src={featuredImageUrl} alt={title} className="w-full rounded-lg mb-6" />
                )}
                {/* Content is HTML (from the WYSIWYG editor) — render as-is so
                    the preview matches the reader view. */}
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </article>
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
              maxLength={LIMITS.title}
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
            <div className="mt-2 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <span className="opacity-60 flex-shrink-0">URL:</span>
                <span className="opacity-60 flex-shrink-0">/news/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(toUrlSlug(e.target.value))}
                  placeholder={toUrlSlug(title) || "article-url"}
                  className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-terminal-border focus:border-primary text-foreground outline-none transition-colors"
                />
              </div>
              <span className={cn(
                "flex-shrink-0",
                title.length > LIMITS.title * 0.9 ? "text-amber-500" : "text-muted-foreground",
                title.length >= LIMITS.title && "text-red-500"
              )}>
                {title.length}/{LIMITS.title}
              </span>
            </div>
          </div>

          {/* Subtitle */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional subtitle..."
              maxLength={LIMITS.subtitle}
              className="w-full bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
            <p className={cn(
              "text-xs mt-2 text-right",
              subtitle.length > LIMITS.subtitle * 0.9 ? "text-amber-500" : "text-muted-foreground",
              subtitle.length >= LIMITS.subtitle && "text-red-500"
            )}>
              {subtitle.length}/{LIMITS.subtitle}
            </p>
          </div>

          {/* Excerpt */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary for article listings..."
              rows={3}
              maxLength={LIMITS.excerpt}
              className="w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground"
            />
            <p className={cn(
              "text-xs mt-2 text-right",
              excerpt.length > LIMITS.excerpt * 0.9 ? "text-amber-500" : "text-muted-foreground",
              excerpt.length >= LIMITS.excerpt && "text-red-500"
            )}>
              {excerpt.length}/{LIMITS.excerpt}
            </p>
          </div>

          {/* Content Editor — same TipTap WYSIWYG as the new-article page so
              formatting (bold, lists, headings, images, tables) round-trips
              cleanly. The textarea+markdown toolbar was replaced because it
              left raw markdown in the HTML, which the reader view didn't
              render as formatted output. */}
          <ModernEditor
            content={content}
            onChange={setContent}
            onImageUpload={handleInlineImageUpload}
            placeholder="Write your article..."
            className="min-h-[500px]"
          />
          <div className="flex items-center justify-end px-1 text-xs text-muted-foreground">
            <span>{wordCount} words · {readTime} min read</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Type */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-4">
            <h3 className="font-semibold">Publishing</h3>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
              >
                {contentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Writer (Byline)</label>
              <select
                value={selectedWriter}
                onChange={(e) => setSelectedWriter(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Default (uploading user)</option>
                {writers.map((w) => (
                  <option key={w.id} value={w.slug}>
                    {w.full_name}{w.title ? ` — ${w.title}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Credit shown on feed and detail page. Clear to restore your own byline.
              </p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-terminal-border"
                />
                <span className="text-sm">Featured Article</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="rounded border-terminal-border"
                />
                <span className="text-sm">Breaking News</span>
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

            {/* Manual email blast — sends the featured-article template to all
                verified breaking-news subscribers. The backend signal sends
                this automatically the first time an article becomes featured;
                this button is for re-sends (fixed typo, new image, etc.). */}
            {isFeatured && status === "published" && (
              <div className="pt-4 border-t border-terminal-border">
                <button
                  type="button"
                  onClick={handleSendFeaturedEmail}
                  disabled={isSendingEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? (
                    <>
                      <CircleNotch className="h-4 w-4 animate-spin" />
                      Queuing...
                    </>
                  ) : (
                    <>
                      <PaperPlaneTilt className="h-4 w-4" />
                      Email to subscribers
                    </>
                  )}
                </button>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Sends this featured article to all verified breaking-news subscribers.
                </p>
              </div>
            )}
          </div>

          {/* Featured Image */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <h3 className="font-semibold mb-4">Featured Image</h3>
            {featuredImageUrl ? (
              <div className="relative mb-4">
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  onClick={() => setFeaturedImageUrl("")}
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
              value={featuredImageUrl}
              onChange={(e) => setFeaturedImageUrl(e.target.value)}
              placeholder="Image URL..."
              className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary mb-2"
            />
            <input
              type="text"
              value={featuredImageCaption}
              onChange={(e) => setFeaturedImageCaption(e.target.value)}
              placeholder="Image caption..."
              maxLength={LIMITS.imageCaption}
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
                <label className="block text-sm text-muted-foreground mb-2">
                  Meta Title
                  <span className={cn(
                    "ml-2 text-xs",
                    metaTitle.length > LIMITS.metaTitle * 0.9 ? "text-amber-500" : "text-muted-foreground",
                    metaTitle.length >= LIMITS.metaTitle && "text-red-500"
                  )}>
                    ({metaTitle.length}/{LIMITS.metaTitle})
                  </span>
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Meta title..."}
                  maxLength={LIMITS.metaTitle}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Meta Description
                  <span className={cn(
                    "ml-2 text-xs",
                    metaDescription.length > LIMITS.metaDescription * 0.9 ? "text-amber-500" : "text-muted-foreground",
                    metaDescription.length >= LIMITS.metaDescription && "text-red-500"
                  )}>
                    ({metaDescription.length}/{LIMITS.metaDescription})
                  </span>
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={excerpt || "Meta description..."}
                  maxLength={LIMITS.metaDescription}
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
