"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  Quote,
  Heading1,
  Heading2,
  X,
  Upload,
  User,
} from "lucide-react";

export default function NewOpinionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorImage, setAuthorImage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<"draft" | "pending_review" | "published">("draft");
  const [isSaving, setIsSaving] = useState(false);

  // SEO fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const handleSave = async (saveStatus: typeof status) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/news/articles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          content_type: 'OPINION',
          featured_image: featuredImage,
          meta_title: metaTitle || title.substring(0, 70),
          meta_description: metaDescription || excerpt.substring(0, 160),
          status: saveStatus === 'published' ? 'PUBLISHED' : 'DRAFT',
        }),
      });

      if (response.ok) {
        router.push("/admin/opinions");
      } else {
        console.error('Failed to save opinion');
      }
    } catch (error) {
      console.error('Error saving opinion:', error);
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
            href="/admin/opinions"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Opinion Piece</h1>
            <p className="text-sm text-muted-foreground">
              Create a new opinion or column article
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave("pending_review")}
            disabled={isSaving}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            Submit for Review
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={isSaving}
            className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2"
          >
            {isSaving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
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

          {/* Excerpt */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Summary / Hook
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Compelling summary that hooks readers..."
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
                <Quote className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-terminal-border mx-1" />
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <LinkIcon className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-terminal-bg-elevated rounded">
                <ImageIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Editor Area */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your opinion piece here...

Share your perspective, analysis, and insights on current market events, economic policies, or industry trends."
              className="w-full h-[500px] p-6 bg-transparent border-none outline-none resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Info */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Author Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Author Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author's full name"
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title / Role</label>
                <input
                  type="text"
                  value={authorTitle}
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  placeholder="e.g., Senior Market Analyst"
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  placeholder="Brief author biography..."
                  rows={3}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>
            </div>
          </div>

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
                  <option value="pending_review">Pending Review</option>
                  <option value="published">Published</option>
                </select>
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

          {/* SEO Settings */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Title <span className="text-muted-foreground">({metaTitle.length}/70)</span>
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value.substring(0, 70))}
                  placeholder="SEO title (defaults to article title)"
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Description <span className="text-muted-foreground">({metaDescription.length}/160)</span>
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.substring(0, 160))}
                  placeholder="SEO description (defaults to excerpt)"
                  rows={3}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
