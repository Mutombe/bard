"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  Loader2,
  AlertCircle,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { editorialService, type Article } from "@/services/api/editorial";
import { newsService } from "@/services/api/news";
import { toast } from "sonner";

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

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch article data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch categories first
        const cats = await newsService.getCategories();
        setCategories(cats);

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
        setLastSaved(article.updated_at ? new Date(article.updated_at) : null);
        setUndoStack([article.content || ""]);
      } catch (err) {
        console.error("Failed to fetch article:", err);
        setError("Failed to load article. It may not exist or you may not have permission to edit it.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [articleId]);

  // Auto-save content to undo stack
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== undoStack[undoStack.length - 1]) {
        setUndoStack((prev) => [...prev.slice(-19), content]);
        setRedoStack([]);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (undoStack.length > 1) {
      const current = undoStack[undoStack.length - 1];
      const previous = undoStack[undoStack.length - 2];
      setRedoStack((prev) => [...prev, current]);
      setUndoStack((prev) => prev.slice(0, -1));
      setContent(previous);
    }
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, next]);
      setRedoStack((prev) => prev.slice(0, -1));
      setContent(next);
    }
  }, [redoStack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Markdown formatting
  const wrapSelection = useCallback((prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    if (start === end) {
      const newText = text.substring(0, start) + prefix + suffix + text.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    } else {
      const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    }
  }, []);

  const insertAtCursor = useCallback((insertText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    const newText = text.substring(0, start) + insertText + text.substring(start);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 0);
  }, []);

  const insertLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;

    let lineStart = start;
    while (lineStart > 0 && text[lineStart - 1] !== "\n") {
      lineStart--;
    }

    const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, []);

  const formatBold = () => wrapSelection("**");
  const formatItalic = () => wrapSelection("*");
  const formatHeading1 = () => insertLinePrefix("# ");
  const formatHeading2 = () => insertLinePrefix("## ");
  const formatQuote = () => insertLinePrefix("> ");
  const formatCode = () => wrapSelection("`");
  const formatBulletList = () => insertLinePrefix("- ");
  const formatNumberedList = () => insertLinePrefix("1. ");
  const formatLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selectedText) {
      wrapSelection("[", "](url)");
    } else {
      insertAtCursor("[link text](url)");
    }
  };
  const formatImage = () => insertAtCursor("![alt text](image-url)");

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
      await editorialService.updateArticle(slug, {
        title,
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
      });

      setLastSaved(new Date());
      toast.success("Article saved successfully");
    } catch (err: any) {
      console.error("Failed to save article:", err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to save article";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
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
        <AlertCircle className="h-12 w-12 text-market-down mx-auto mb-4" />
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
    <div className={cn("max-w-6xl mx-auto", isFullscreen && "fixed inset-0 z-50 bg-terminal-bg p-6 overflow-auto max-w-none")}>
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
            <Trash2 className="h-4 w-4" />
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
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
                    <Loader2 className="h-4 w-4 animate-spin" />
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
              <article className="prose prose-invert max-w-none">
                <h1 className="text-3xl font-bold mb-2">{title || "Untitled Article"}</h1>
                {subtitle && <p className="text-xl text-muted-foreground mb-4">{subtitle}</p>}
                {featuredImageUrl && (
                  <img src={featuredImageUrl} alt={title} className="w-full rounded-lg mb-6" />
                )}
                <ReactMarkdown>{content}</ReactMarkdown>
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
              placeholder="Optional subtitle..."
              className="w-full bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary for article listings..."
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Content Editor */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-terminal-border bg-terminal-bg">
              <button onClick={formatBold} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Bold (Ctrl+B)">
                <Bold className="h-4 w-4" />
              </button>
              <button onClick={formatItalic} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Italic (Ctrl+I)">
                <Italic className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button onClick={formatHeading1} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Heading 1">
                <Heading1 className="h-4 w-4" />
              </button>
              <button onClick={formatHeading2} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Heading 2">
                <Heading2 className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button onClick={formatBulletList} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Bullet List">
                <List className="h-4 w-4" />
              </button>
              <button onClick={formatNumberedList} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Numbered List">
                <ListOrdered className="h-4 w-4" />
              </button>
              <button onClick={formatQuote} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Quote">
                <Quote className="h-4 w-4" />
              </button>
              <button onClick={formatCode} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Code">
                <Code className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button onClick={formatLink} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Link (Ctrl+K)">
                <LinkIcon className="h-4 w-4" />
              </button>
              <button onClick={formatImage} className="p-2 hover:bg-terminal-bg-secondary rounded" title="Image">
                <ImageIcon className="h-4 w-4" />
              </button>
              <div className="flex-1" />
              <button
                onClick={handleUndo}
                disabled={undoStack.length <= 1}
                className="p-2 hover:bg-terminal-bg-secondary rounded disabled:opacity-30"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 hover:bg-terminal-bg-secondary rounded disabled:opacity-30"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-terminal-bg-secondary rounded"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content in Markdown..."
              className="w-full h-96 p-4 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground"
            />
            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-terminal-border text-xs text-muted-foreground">
              <span>{wordCount} words ({readTime} min read)</span>
              <span>Markdown supported</span>
            </div>
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
