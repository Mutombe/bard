"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
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
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService } from "@/services/api/editorial";
import { newsService } from "@/services/api/news";
import { UnsplashImagePicker } from "@/components/editor/UnsplashImagePicker";
import { toast } from "sonner";
import type { Category } from "@/types";

// Helper to convert tag name to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const availableTags = [
  { name: "JSE", slug: "jse" },
  { name: "NGX", slug: "ngx" },
  { name: "EGX", slug: "egx" },
  { name: "South Africa", slug: "south-africa" },
  { name: "Nigeria", slug: "nigeria" },
  { name: "Egypt", slug: "egypt" },
  { name: "Kenya", slug: "kenya" },
  { name: "Banking", slug: "banking" },
  { name: "Mining", slug: "mining" },
  { name: "Telecom", slug: "telecom" },
  { name: "Energy", slug: "energy" },
  { name: "Retail", slug: "retail" },
  { name: "Technology", slug: "technology" },
  { name: "Earnings", slug: "earnings" },
  { name: "IPO", slug: "ipo" },
  { name: "M&A", slug: "m-a" },
  { name: "Interest Rates", slug: "interest-rates" },
  { name: "Inflation", slug: "inflation" },
  { name: "GDP", slug: "gdp" },
  { name: "Forex", slug: "forex" },
  { name: "Commodities", slug: "commodities" },
  { name: "Gold", slug: "gold" },
  { name: "Oil", slug: "oil" },
  { name: "Research", slug: "research" },
];

const contentTypes = [
  { value: "news", label: "News" },
  { value: "analysis", label: "Analysis" },
  { value: "research", label: "Research Report" },
  { value: "opinion", label: "Opinion" },
  { value: "market_update", label: "Market Update" },
  { value: "earnings", label: "Earnings Report" },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<{ name: string; slug: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [relatedStocks, setRelatedStocks] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">("draft");
  const [contentType, setContentType] = useState("news");
  const [scheduledDate, setScheduledDate] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false);
  const [imageCredit, setImageCredit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await newsService.getCategories();
        setCategories(cats);
        if (cats.length > 0 && !category) {
          setCategory(cats[0].slug);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Update word/char count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(content.length);
  }, [content]);

  // Undo/Redo functionality
  const saveToUndo = useCallback((text: string) => {
    setUndoStack(prev => [...prev.slice(-20), text]);
    setRedoStack([]);
  }, []);

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, content]);
      setContent(previous);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, content]);
      setContent(next);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const addTag = (tagName: string, tagSlug?: string) => {
    const slug = tagSlug || toSlug(tagName);
    if (tagName && !tags.find(t => t.slug === slug)) {
      setTags([...tags, { name: tagName, slug }]);
      setTagInput("");
    }
  };

  const removeTag = (slug: string) => {
    setTags(tags.filter((t) => t.slug !== slug));
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

  // Markdown formatting functions
  const wrapSelection = useCallback((prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    saveToUndo(content);
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
  }, [content, saveToUndo]);

  const insertAtCursor = useCallback((insertText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    saveToUndo(content);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newText = text.substring(0, start) + insertText + text.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 0);
  }, [content, saveToUndo]);

  const insertLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    saveToUndo(content);
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
  }, [content, saveToUndo]);

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

  // Handle keyboard shortcuts and auto-continue lists
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          formatBold();
          return;
        case "i":
          e.preventDefault();
          formatItalic();
          return;
        case "k":
          e.preventDefault();
          formatLink();
          return;
        case "z":
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
          return;
        case "y":
          e.preventDefault();
          handleRedo();
          return;
      }
    }

    // Auto-continue lists on Enter
    if (e.key === "Enter") {
      const cursorPos = textarea.selectionStart;
      const text = textarea.value;

      // Find the current line
      let lineStart = cursorPos;
      while (lineStart > 0 && text[lineStart - 1] !== "\n") {
        lineStart--;
      }
      const currentLine = text.substring(lineStart, cursorPos);

      // Check for numbered list (e.g., "1. ", "2. ", "10. ")
      const numberedMatch = currentLine.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        const num = parseInt(numberedMatch[1], 10);
        const lineContent = currentLine.substring(numberedMatch[0].length);

        // If line is empty (just the number), remove it
        if (!lineContent.trim()) {
          e.preventDefault();
          const newText = text.substring(0, lineStart) + text.substring(cursorPos);
          setContent(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        // Continue with next number
        e.preventDefault();
        const nextNum = `${num + 1}. `;
        const newText = text.substring(0, cursorPos) + "\n" + nextNum + text.substring(cursorPos);
        saveToUndo(content);
        setContent(newText);
        setTimeout(() => {
          textarea.focus();
          const newPos = cursorPos + 1 + nextNum.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }

      // Check for bullet list (e.g., "- " or "* ")
      const bulletMatch = currentLine.match(/^([-*])\s/);
      if (bulletMatch) {
        const lineContent = currentLine.substring(bulletMatch[0].length);

        // If line is empty (just the bullet), remove it
        if (!lineContent.trim()) {
          e.preventDefault();
          const newText = text.substring(0, lineStart) + text.substring(cursorPos);
          setContent(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        // Continue with bullet
        e.preventDefault();
        const bullet = `${bulletMatch[1]} `;
        const newText = text.substring(0, cursorPos) + "\n" + bullet + text.substring(cursorPos);
        saveToUndo(content);
        setContent(newText);
        setTimeout(() => {
          textarea.focus();
          const newPos = cursorPos + 1 + bullet.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }

      // Check for blockquote
      const quoteMatch = currentLine.match(/^>\s/);
      if (quoteMatch) {
        const lineContent = currentLine.substring(quoteMatch[0].length);

        if (!lineContent.trim()) {
          e.preventDefault();
          const newText = text.substring(0, lineStart) + text.substring(cursorPos);
          setContent(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        e.preventDefault();
        const newText = text.substring(0, cursorPos) + "\n> " + text.substring(cursorPos);
        saveToUndo(content);
        setContent(newText);
        setTimeout(() => {
          textarea.focus();
          const newPos = cursorPos + 3;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }
    }
  };

  const handleSave = async (saveStatus: typeof status) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!excerpt.trim()) {
      toast.error("Excerpt is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const articleData = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: category,
        status: saveStatus === "published" ? "published" : "draft",
        is_featured: featured,
        featured_image_url: featuredImage || undefined,
        content_type: contentType,
        tags: tags.map(t => t.slug),
      };

      console.log("Saving article with data:", articleData);
      const result = await editorialService.createArticle(articleData);
      console.log("Article saved successfully:", result);

      setSuccess(true);
      toast.success(saveStatus === "published" ? "Article published!" : "Draft saved!");

      // Use replace instead of push to prevent back navigation issues
      router.replace("/admin/articles");
    } catch (err: any) {
      console.error("Failed to save article:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // Check if article might have been saved despite error
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        toast.warning("Request timed out, but article may have been saved. Check the articles list.");
        setTimeout(() => router.replace("/admin/articles"), 2000);
        return;
      }

      const errorData = err.response?.data;
      let errorMsg = "Failed to save article. Please try again.";

      if (typeof errorData === "string") {
        errorMsg = errorData;
      } else if (errorData?.error) {
        errorMsg = typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
      } else if (errorData?.detail) {
        errorMsg = errorData.detail;
      } else if (errorData?.non_field_errors) {
        errorMsg = errorData.non_field_errors.join(", ");
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate estimated read time
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

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
            <h1 className="text-2xl font-bold">New Article</h1>
            <p className="text-sm text-muted-foreground">
              {wordCount} words · {readTime} min read
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen editor"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={isSaving || success}
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
            disabled={isSaving || success}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
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
              className="w-full bg-transparent border border-terminal-border rounded-md p-3 outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Content Editor */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-terminal-border bg-terminal-bg overflow-x-auto">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors disabled:opacity-30"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors disabled:opacity-30"
              >
                <Redo className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button
                type="button"
                onClick={formatHeading1}
                title="Heading 1 (# )"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <Heading1 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={formatHeading2}
                title="Heading 2 (## )"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button
                type="button"
                onClick={formatBold}
                title="Bold (Ctrl+B)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={formatItalic}
                title="Italic (Ctrl+I)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <Italic className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button
                type="button"
                onClick={formatBulletList}
                title="Bullet list (- item)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={formatNumberedList}
                title="Numbered list (1. item) - auto-continues on Enter"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={formatQuote}
                title="Blockquote (> text)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <Quote className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button
                type="button"
                onClick={formatLink}
                title="Insert link (Ctrl+K)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={formatImage}
                title="Insert image ![alt](url)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={formatCode}
                title="Inline code (`code`)"
                className="p-2 hover:bg-terminal-bg-elevated rounded transition-colors"
              >
                <Code className="h-4 w-4" />
              </button>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground px-2">
                {charCount} chars
              </span>
            </div>

            {/* Editor Area */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                saveToUndo(content);
                setContent(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write your article content here...

Tips:
• Use toolbar buttons or keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)
• Type 1. to start a numbered list - it auto-continues when you press Enter
• Type - for bullet lists
• Type > for blockquotes
• Press Enter on empty list item to exit list

Start writing your article..."
              className={cn(
                "w-full p-6 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed",
                isFullscreen ? "h-[calc(100vh-400px)]" : "h-[500px]"
              )}
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
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
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
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
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
              disabled={loadingCategories}
              className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50"
            >
              {loadingCategories ? (
                <option value="">Loading categories...</option>
              ) : (
                <>
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded"
                >
                  {tag.name}
                  <button onClick={() => removeTag(tag.slug)}>
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
                className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
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
                  .filter((t) => !tags.find(tag => tag.slug === t.slug))
                  .slice(0, 8)
                  .map((tag) => (
                    <button
                      key={tag.slug}
                      onClick={() => addTag(tag.name, tag.slug)}
                      className="px-2 py-0.5 text-xs bg-terminal-bg-elevated rounded hover:bg-terminal-bg"
                    >
                      {tag.name}
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
                  onClick={() => {
                    setFeaturedImage("");
                    setImageCredit("");
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-terminal-border rounded-md p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Search Unsplash or paste URL
                </p>
                <button
                  type="button"
                  onClick={() => setShowUnsplashPicker(true)}
                  className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                >
                  Search Unsplash
                </button>
              </div>
            )}
            {imageCredit && (
              <p className="text-xs text-muted-foreground mt-2">
                Photo by {imageCredit} on Unsplash
              </p>
            )}
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => {
                setFeaturedImage(e.target.value);
                setImageCredit("");
              }}
              placeholder="Or paste image URL..."
              className="w-full mt-3 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
            />
            {!featuredImage && (
              <button
                type="button"
                onClick={() => setShowUnsplashPicker(true)}
                className="w-full mt-2 px-3 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated text-sm flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Search Unsplash
              </button>
            )}
          </div>

          {/* Unsplash Picker Modal */}
          <UnsplashImagePicker
            isOpen={showUnsplashPicker}
            onClose={() => setShowUnsplashPicker(false)}
            onSelect={(image) => {
              setFeaturedImage(image.url);
              setImageCredit(image.photographer);
            }}
            defaultQuery={title ? title.split(" ").slice(0, 2).join(" ") : ""}
          />

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
                className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary font-mono uppercase"
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
          <div className="relative bg-terminal-bg border border-terminal-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="font-semibold">Article Preview</h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-terminal-bg-elevated rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6">
              {featuredImage && (
                <div className="aspect-video rounded-lg overflow-hidden mb-6">
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {imageCredit && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Photo by {imageCredit} on Unsplash
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                {categories.find(c => c.slug === category)?.name && (
                  <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                    {categories.find(c => c.slug === category)?.name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {readTime} min read
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-4">{title || "Untitled Article"}</h1>

              {excerpt && (
                <p className="text-lg text-muted-foreground mb-6 border-l-4 border-primary pl-4">
                  {excerpt}
                </p>
              )}

              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-terminal-bg-elevated px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-terminal-bg-elevated p-4 rounded-lg overflow-x-auto my-4">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                  }}
                >
                  {content || "*No content yet*"}
                </ReactMarkdown>
              </div>

              {tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-terminal-border">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.slug}
                        className="px-3 py-1 text-sm bg-terminal-bg-elevated rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
