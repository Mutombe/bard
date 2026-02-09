"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  X,
  User,
  Loader2,
  Plus,
  Settings,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService } from "@/services/api/editorial";
import { newsService } from "@/services/api/news";
import { mediaService } from "@/services/api/media";
import { toast } from "sonner";
import { ModernEditor } from "@/components/editor/ModernEditor";
import { ImagePicker } from "@/components/editor/ImagePicker";
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
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // SEO fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await newsService.getCategories();
        setCategories(cats);
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

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await mediaService.uploadFile(file);
    return result.url;
  }, []);

  const handleImageSelect = (image: { url: string }) => {
    setFeaturedImage(image.url);
    setShowImagePicker(false);
    toast.success("Cover image selected");
  };

  const handleSave = async (saveStatus: "draft" | "published") => {
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

  // Word count from HTML content
  const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-terminal-bg/95 backdrop-blur-sm border-b border-terminal-border">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/opinions"
              className="p-2 hover:bg-terminal-bg-secondary rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">New Opinion Piece</h1>
              <p className="text-xs text-muted-foreground">
                {wordCount} words • {readTime} min read
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-md transition-colors",
                showSettings ? "bg-primary/20 text-primary" : "hover:bg-terminal-bg-secondary"
              )}
              title="Toggle settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving}
              className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={isSaving}
              className="px-4 py-2 bg-brand-burgundy text-white rounded-md hover:bg-brand-burgundy-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
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
      </div>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Main Content */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          showSettings ? "pr-80" : ""
        )}>
          <div className="max-w-4xl mx-auto py-8 px-6">
            {/* Cover Image */}
            <div className="mb-8">
              {featuredImage ? (
                <div className="relative group">
                  <img
                    src={featuredImage}
                    alt="Cover"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                    <button
                      onClick={() => setShowImagePicker(true)}
                      className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium"
                    >
                      Change Image
                    </button>
                    <button
                      onClick={() => setFeaturedImage("")}
                      className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowImagePicker(true)}
                  className="w-full h-48 border-2 border-dashed border-terminal-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <span className="text-sm font-medium">Add cover image</span>
                </button>
              )}
            </div>

            {/* Title */}
            <textarea
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Opinion title..."
              className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 mb-4"
              rows={1}
            />

            {/* Subtitle */}
            <textarea
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Add a subtitle..."
              className="w-full text-xl text-muted-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 mb-8"
              rows={1}
            />

            {/* Editor */}
            <ModernEditor
              content={content}
              onChange={setContent}
              placeholder="Share your perspective, analysis, or commentary..."
              onImageUpload={handleImageUpload}
            />
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className={cn(
          "fixed right-0 top-[57px] bottom-0 w-80 bg-terminal-bg-secondary border-l border-terminal-border overflow-y-auto transition-transform duration-300",
          showSettings ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-6 space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
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

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium mb-2">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary for listings..."
                rows={3}
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="flex items-center gap-1 px-2 py-1 bg-terminal-bg rounded text-xs"
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
                  className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-terminal-border"
                />
                <span className="text-sm">Featured Opinion</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="rounded border-terminal-border"
                />
                <span className="text-sm">Premium Content</span>
              </label>
            </div>

            {/* SEO */}
            <div className="border-t border-terminal-border pt-6">
              <h3 className="font-semibold mb-4">SEO Settings</h3>
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

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImageSelect}
        defaultQuery="opinion editorial"
      />
    </div>
  );
}
