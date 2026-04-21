"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  FloppyDisk,
  Eye,
  Clock,
  Image as ImageIcon,
  Plus,
  X,
  UploadSimple,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  ArrowsOut,
  ArrowsIn,
  GearSix,
  CaretDown,
  CaretUp,
  Sparkle,
  Calendar,
  Tag,
  BookmarkSimple,
  FileText,
  DotsThree,
  Globe,
  Lock,
  Star,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { editorialService, type Writer } from "@/services/api/editorial";
import { newsService } from "@/services/api/news";
import { ImagePicker } from "@/components/editor/ImagePicker";
import { ModernEditor } from "@/components/editor/ModernEditor";
import { toast } from "sonner";
import type { Category } from "@/types";

// Helper to convert tag name to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// Field limits — MUST match backend/apps/news/models.py
const LIMITS = {
  title: 300,
  subtitle: 500,
  excerpt: 500,
  imageCaption: 300,
  metaTitle: 70,
  metaDescription: 160,
} as const;

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
  { name: "Technology", slug: "technology" },
  { name: "Earnings", slug: "earnings" },
  { name: "IPO", slug: "ipo" },
  { name: "M&A", slug: "m-a" },
  { name: "Interest Rates", slug: "interest-rates" },
  { name: "Inflation", slug: "inflation" },
];

const contentTypes = [
  { value: "news", label: "News", icon: FileText },
  { value: "analysis", label: "Analysis", icon: Sparkle },
  { value: "insights", label: "Insights", icon: Globe },
  { value: "opinion", label: "Opinion", icon: BookmarkSimple },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<{ name: string; slug: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageCredit, setImageCredit] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">("draft");
  const [contentType, setContentType] = useState("news");
  const [scheduledDate, setScheduledDate] = useState("");
  const [featured, setFeatured] = useState(false);
  const [premium, setPremium] = useState(false);
  const [selectedWriter, setSelectedWriter] = useState<string>("");
  const [writers, setWriters] = useState<Writer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Fetch categories + writers on mount
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
    const fetchWriters = async () => {
      try {
        const data = await editorialService.getWriters();
        setWriters(data);
      } catch {}
    };
    fetchCategories();
    fetchWriters();
  }, []);

  // Auto-focus title on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (title || content || excerpt) {
      setHasUnsavedChanges(true);
    }
  }, [title, content, excerpt, tags, category]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !success) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, success]);

  // Calculate reading time
  const wordCount = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Auto-resize title textarea
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
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

  // Handle image upload for editor
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    // TODO: Implement actual image upload to your backend/storage
    // For now, return a base64 preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (saveStatus: typeof status) => {
    if (!title.trim()) {
      toast.error("Please add a title for your article");
      titleRef.current?.focus();
      return;
    }
    if (title.length > LIMITS.title) {
      toast.error(`Title is ${title.length} chars — max ${LIMITS.title}. Please shorten it.`);
      return;
    }

    if (subtitle.length > LIMITS.subtitle) {
      toast.error(`Subtitle is ${subtitle.length} chars — max ${LIMITS.subtitle}. Please shorten it.`);
      return;
    }

    if (!content.trim() || content === "<p></p>") {
      toast.error("Please write some content");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    // Auto-generate excerpt if not provided — cap at backend limit
    const finalExcerpt = (
      excerpt.trim() ||
      content
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim()
        .slice(0, 200) + "..."
    ).slice(0, LIMITS.excerpt);

    if (finalExcerpt.length > LIMITS.excerpt) {
      toast.error(`Excerpt is ${finalExcerpt.length} chars — max ${LIMITS.excerpt}.`);
      return;
    }

    if (imageCaption.length > LIMITS.imageCaption) {
      toast.error(`Image caption is ${imageCaption.length} chars — max ${LIMITS.imageCaption}.`);
      return;
    }

    if (saveStatus === "scheduled" && !scheduledDate) {
      toast.error("Please pick a date & time to schedule this article");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const articleData: any = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        excerpt: finalExcerpt,
        content: content.trim(),
        category: category,
        status: saveStatus,
        is_featured: featured,
        is_premium: premium,
        featured_image_url: featuredImage || undefined,
        featured_image_caption: imageCaption || undefined,
        content_type: contentType,
        tags: tags.map(t => t.slug),
        writer: selectedWriter || null,
      };

      // When scheduling, send the future published_at datetime
      if (saveStatus === "scheduled" && scheduledDate) {
        articleData.published_at = new Date(scheduledDate).toISOString();
      } else if (saveStatus === "published") {
        articleData.published_at = new Date().toISOString();
      }

      const result = await editorialService.createArticle(articleData);

      setSuccess(true);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      toast.success(
        saveStatus === "published"
          ? "Your article is now live!"
          : "Draft saved successfully"
      );

      setTimeout(() => router.replace("/admin/articles"), 1500);
    } catch (err: any) {
      console.error("Failed to save article:", err);

      const status = err.response?.status;
      const errorData = err.response?.data;
      let errorMsg = "Something went wrong. Please try again.";

      // Server returned an HTML error page (Django 500 with DEBUG=False)
      if (typeof errorData === "string" && errorData.includes("<!doctype html")) {
        errorMsg =
          status === 500
            ? "The server rejected this article (500). This is usually a duplicate title or a field exceeding its length limit. Try shortening the title or adding a word to make it unique."
            : `Server returned an HTML error page (${status}).`;
      } else if (typeof errorData === "string") {
        errorMsg = errorData;
      } else if (errorData?.detail) {
        errorMsg = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
      } else if (errorData?.error) {
        errorMsg = typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
      } else if (errorData && typeof errorData === "object") {
        const fieldErrors = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        if (fieldErrors) errorMsg = fieldErrors;
      } else if (!err.response) {
        errorMsg = "Network error — could not reach the server. Check your connection and try again.";
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !title || success) return;

    const autoSaveTimer = setInterval(() => {
      // Silent auto-save could be implemented here
      // For now, we'll just track that changes exist
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [hasUnsavedChanges, title, success]);

  return (
    <div className={cn(
      "min-h-screen bg-terminal-bg",
      isFullscreen && "fixed inset-0 z-50 overflow-auto"
    )}>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-terminal-bg/95 backdrop-blur border-b border-terminal-border">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/articles"
              className="p-2 hover:bg-terminal-bg-secondary rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                status === "published" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
              )}>
                {status === "published" ? "Published" : "Draft"}
              </span>
              {lastSaved && (
                <span className="text-xs">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {hasUnsavedChanges && !lastSaved && (
                <span className="text-xs text-amber-400">Unsaved changes</span>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-2">
              <Clock className="h-3.5 w-3.5" />
              <span>{wordCount} words</span>
              <span>·</span>
              <span>{readTime} min read</span>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-terminal-bg-secondary rounded-md transition-colors hidden sm:flex"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <ArrowsIn className="h-4 w-4" /> : <ArrowsOut className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-md transition-colors",
                showSettings ? "bg-primary/20 text-primary" : "hover:bg-terminal-bg-secondary"
              )}
              title="Toggle settings"
            >
              <GearSix className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving || success}
              className="px-3 py-1.5 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
              <span className="hidden sm:inline">Save</span>
            </button>

            {/* Schedule input + button */}
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                className="hidden lg:block px-3 py-1.5 border border-terminal-border rounded-md bg-transparent text-sm focus:outline-none focus:border-brand-coral"
                title="Schedule publish date"
              />
            </div>
            <button
              onClick={() => handleSave("scheduled")}
              disabled={isSaving || success || !scheduledDate}
              className="px-3 py-1.5 border border-brand-violet text-brand-violet-accessible rounded-md hover:bg-brand-violet/5 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title={!scheduledDate ? "Pick a date first" : "Schedule for later"}
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </button>

            <button
              onClick={() => handleSave("published")}
              disabled={isSaving || success}
              className="px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <CircleNotch className="h-4 w-4 animate-spin" />
              ) : success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {success ? "Published!" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <WarningCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className={cn(
        "mx-auto px-4 py-8",
        isFullscreen ? "max-w-none" : "max-w-screen-2xl"
      )}>
        <div className={cn(
          "flex gap-8",
          showSettings ? "flex-col lg:flex-row" : ""
        )}>
          {/* Main Editor Area — wider in fullscreen */}
          <div className={cn(
            "flex-1 min-w-0",
            isFullscreen
              ? "max-w-none mx-auto"
              : showSettings ? "lg:max-w-4xl" : "max-w-4xl mx-auto"
          )}>
            {/* Featured Image */}
            <div className="mb-8">
              {featuredImage ? (
                <div className="relative group">
                  <div className="aspect-[21/9] rounded-xl overflow-hidden bg-terminal-bg-secondary">
                    <Image
                      src={featuredImage}
                      alt="Featured"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-4">
                    <button
                      onClick={() => setShowImagePicker(true)}
                      className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-white/90"
                    >
                      Change Image
                    </button>
                    <button
                      onClick={() => {
                        setFeaturedImage("");
                        setImageCredit("");
                        setImageCaption("");
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  {imageCredit && (
                    <p className="absolute bottom-3 left-3 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                      Photo by {imageCredit}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowImagePicker(true)}
                  className="w-full aspect-[21/9] rounded-xl border-2 border-dashed border-terminal-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary"
                >
                  <div className="p-4 rounded-full bg-terminal-bg-secondary">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Add a cover image</p>
                    <p className="text-xs mt-1">Recommended: 1200 x 630 pixels</p>
                  </div>
                </button>
              )}
              {featuredImage && (
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Add a caption for your image..."
                  maxLength={LIMITS.imageCaption}
                  className="w-full mt-2 px-3 py-2 bg-transparent border-b border-transparent hover:border-terminal-border focus:border-primary text-sm text-muted-foreground focus:text-foreground outline-none transition-colors text-center"
                />
              )}
            </div>

            {/* Title */}
            <textarea
              ref={titleRef}
              value={title}
              onChange={handleTitleChange}
              placeholder="Your headline here..."
              rows={1}
              maxLength={LIMITS.title}
              className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-tight"
              style={{ overflow: "hidden" }}
            />
            <p className={cn(
              "text-xs mt-1 text-right",
              title.length > LIMITS.title * 0.9 ? "text-amber-500" : "text-muted-foreground/60",
              title.length >= LIMITS.title && "text-red-500"
            )}>
              {title.length}/{LIMITS.title}
            </p>

            {/* Subtitle */}
            <textarea
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              placeholder="Add a subtitle to give more context..."
              rows={1}
              maxLength={LIMITS.subtitle}
              className="w-full mt-4 text-xl text-muted-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 leading-relaxed"
              style={{ overflow: "hidden" }}
            />
            {subtitle.length > 0 && (
              <p className={cn(
                "text-xs mt-1 text-right",
                subtitle.length > LIMITS.subtitle * 0.9 ? "text-amber-500" : "text-muted-foreground/60",
                subtitle.length >= LIMITS.subtitle && "text-red-500"
              )}>
                {subtitle.length}/{LIMITS.subtitle}
              </p>
            )}

            {/* Divider */}
            <div className="h-px bg-terminal-border my-8" />

            {/* Modern WYSIWYG Editor */}
            <ModernEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
              placeholder="Tell your story..."
              className="min-h-[500px]"
            />
          </div>

          {/* Settings Sidebar */}
          {showSettings && (
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
              {/* Publish Settings */}
              <div className="bg-terminal-bg-secondary rounded-xl border border-terminal-border p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GearSix className="h-4 w-4 text-primary" />
                  Publish Settings
                </h3>

                <div className="space-y-4">
                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {contentTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setContentType(type.value)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                            contentType === type.value
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "bg-terminal-bg-elevated border border-transparent hover:border-terminal-border"
                          )}
                        >
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={loadingCategories}
                      className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                    >
                      {loadingCategories ? (
                        <option value="">Loading...</option>
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

                  {/* Writer (Byline Credit) */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Writer (Byline)</label>
                    <select
                      value={selectedWriter}
                      onChange={(e) => setSelectedWriter(e.target.value)}
                      className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Default (you)</option>
                      {writers.map((w) => (
                        <option key={w.id} value={w.slug}>
                          {w.full_name}{w.title ? ` — ${w.title}` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Credit goes to the selected writer on the feed and detail page.
                    </p>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Featured article</span>
                    </div>
                    <button
                      onClick={() => setFeatured(!featured)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        featured ? "bg-primary" : "bg-terminal-border"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform",
                          featured ? "translate-x-5" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="text-sm">Premium content</span>
                    </div>
                    <button
                      onClick={() => setPremium(!premium)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        premium ? "bg-primary" : "bg-terminal-border"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform",
                          premium ? "translate-x-5" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div className="bg-terminal-bg-secondary rounded-xl border border-terminal-border p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Excerpt
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  A short summary that appears in article previews
                </p>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Write a compelling summary..."
                  rows={4}
                  maxLength={LIMITS.excerpt}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                />
                <p className={cn(
                  "text-xs mt-2 text-right",
                  excerpt.length > LIMITS.excerpt * 0.9 ? "text-amber-500" : "text-muted-foreground",
                  excerpt.length >= LIMITS.excerpt && "text-red-500"
                )}>
                  {excerpt.length}/{LIMITS.excerpt}
                </p>
              </div>

              {/* Tags */}
              <div className="bg-terminal-bg-secondary rounded-xl border border-terminal-border p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Tags
                </h3>

                {/* Selected Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
                      <span
                        key={tag.slug}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/20 text-primary rounded-full"
                      >
                        {tag.name}
                        <button onClick={() => removeTag(tag.slug)} className="hover:text-primary/70">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Tag Input */}
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
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-lg hover:bg-terminal-bg text-sm disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Suggested Tags */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Suggested:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags
                      .filter((t) => !tags.find(tag => tag.slug === t.slug))
                      .slice(0, 6)
                      .map((tag) => (
                        <button
                          key={tag.slug}
                          onClick={() => addTag(tag.name, tag.slug)}
                          className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded-full hover:bg-terminal-border transition-colors"
                        >
                          {tag.name}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* SEO Preview */}
              <div className="bg-terminal-bg-secondary rounded-xl border border-terminal-border p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Preview
                </h3>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-green-700 mb-1">
                    bgfi.com › insights › {category || "category"}
                  </p>
                  <p className="text-blue-800 text-sm font-medium hover:underline cursor-pointer line-clamp-2">
                    {title || "Your Article Title"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {excerpt || subtitle || "Your article excerpt will appear here..."}
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(image) => {
          setFeaturedImage(image.url);
          setImageCredit(image.photographer || "");
          setShowImagePicker(false);
        }}
        defaultQuery={title ? title.split(" ").slice(0, 3).join(" ") : "business finance"}
      />
    </div>
  );
}
