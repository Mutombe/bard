"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Plus,
  X,
  FileText,
  Users,
  Globe,
  Tag,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { researchService, type Topic, type Industry } from "@/services/api/research";
import { mediaService } from "@/services/api/media";
import { ImagePicker } from "@/components/editor/ImagePicker";
import { ModernEditor } from "@/components/editor/ModernEditor";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "analysis", label: "Market Analysis" },
  { value: "forecast", label: "Economic Forecast" },
  { value: "sector", label: "Sector Report" },
  { value: "company", label: "Company Research" },
  { value: "policy", label: "Policy Analysis" },
  { value: "quarterly", label: "Quarterly Review" },
  { value: "annual", label: "Annual Report" },
  { value: "special", label: "Special Report" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "published", label: "Published" },
];

export default function NewResearchReportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [content, setContent] = useState("");
  const [keyFindings, setKeyFindings] = useState<string[]>([""]);
  const [methodology, setMethodology] = useState("");
  const [dataSources, setDataSources] = useState("");
  const [reportType, setReportType] = useState("analysis");
  const [status, setStatus] = useState("draft");
  const [coverImage, setCoverImage] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [readTimeMinutes, setReadTimeMinutes] = useState(15);
  const [pageCount, setPageCount] = useState(1);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Relationships
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [externalAuthors, setExternalAuthors] = useState<Array<{
    name: string;
    title: string;
    organization: string;
  }>>([]);

  // Options from API
  const [topics, setTopics] = useState<Topic[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [topicsData, industriesData] = await Promise.all([
        researchService.getTopics(),
        researchService.getIndustries(),
      ]);
      setTopics(topicsData);
      setIndustries(industriesData);
    } catch (error) {
      console.error("Failed to fetch options:", error);
    }
  };

  const addKeyFinding = () => {
    setKeyFindings([...keyFindings, ""]);
  };

  const updateKeyFinding = (index: number, value: string) => {
    const updated = [...keyFindings];
    updated[index] = value;
    setKeyFindings(updated);
  };

  const removeKeyFinding = (index: number) => {
    setKeyFindings(keyFindings.filter((_, i) => i !== index));
  };

  const addExternalAuthor = () => {
    setExternalAuthors([...externalAuthors, { name: "", title: "", organization: "" }]);
  };

  const updateExternalAuthor = (index: number, field: string, value: string) => {
    const updated = [...externalAuthors];
    updated[index] = { ...updated[index], [field]: value };
    setExternalAuthors(updated);
  };

  const removeExternalAuthor = (index: number) => {
    setExternalAuthors(externalAuthors.filter((_, i) => i !== index));
  };

  const handleImageSelect = (image: { url: string }) => {
    setCoverImage(image.url);
    setShowImagePicker(false);
    toast.success("Cover image selected");
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await mediaService.uploadFile(file);
    return result.url;
  }, []);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await researchService.createReport({
        title,
        subtitle,
        abstract,
        content,
        key_findings: keyFindings.filter(f => f.trim()),
        methodology,
        data_sources: dataSources,
        report_type: reportType,
        status: "draft",
        cover_image: coverImage || undefined,
        is_featured: isFeatured,
        is_premium: isPremium,
        read_time_minutes: readTimeMinutes,
        page_count: pageCount,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
        external_authors: externalAuthors.filter(a => a.name.trim()),
      });
      toast.success("Draft saved successfully");
      router.push("/admin/research");
    } catch (error: any) {
      console.error("Failed to save draft:", error);
      toast.error(error.response?.data?.error || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!abstract.trim()) {
      toast.error("Please enter an abstract");
      return;
    }
    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }

    setIsLoading(true);
    try {
      await researchService.createReport({
        title,
        subtitle,
        abstract,
        content,
        key_findings: keyFindings.filter(f => f.trim()),
        methodology,
        data_sources: dataSources,
        report_type: reportType,
        status: "published",
        cover_image: coverImage || undefined,
        is_featured: isFeatured,
        is_premium: isPremium,
        read_time_minutes: readTimeMinutes,
        page_count: pageCount,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
        external_authors: externalAuthors.filter(a => a.name.trim()),
      });
      toast.success("Research report published!");
      router.push("/admin/research");
    } catch (error: any) {
      console.error("Failed to publish:", error);
      toast.error(error.response?.data?.error || "Failed to publish report");
    } finally {
      setIsLoading(false);
    }
  };

  // Word count from HTML content
  const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-terminal-bg/95 backdrop-blur-sm border-b border-terminal-border">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/research"
              className="p-2 hover:bg-terminal-bg-secondary rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">New Research Report</h1>
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
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="px-4 py-2 bg-brand-burgundy text-white rounded-md hover:bg-brand-burgundy-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Main Content */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          showSettings ? "pr-96" : ""
        )}>
          <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
            {/* Cover Image */}
            <div>
              {coverImage ? (
                <div className="relative group">
                  <img
                    src={coverImage}
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
                      onClick={() => setCoverImage("")}
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
              placeholder="Research report title..."
              className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50"
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
              className="w-full text-xl text-muted-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50"
              rows={1}
            />

            {/* Abstract */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Abstract / Executive Summary *
              </label>
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Provide a concise summary of the report's main findings and conclusions..."
                rows={5}
                className="w-full bg-terminal-bg-elevated border border-terminal-border rounded-md p-4 outline-none focus:border-primary text-sm resize-none"
              />
            </div>

            {/* Key Findings */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-muted-foreground">
                  Key Findings
                </label>
                <button
                  type="button"
                  onClick={addKeyFinding}
                  className="px-3 py-1.5 text-xs bg-terminal-bg-elevated border border-terminal-border rounded-md hover:bg-terminal-bg flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Add Finding
                </button>
              </div>
              <div className="space-y-3">
                {keyFindings.map((finding, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={finding}
                      onChange={(e) => updateKeyFinding(index, e.target.value)}
                      placeholder="Enter a key finding..."
                      className="flex-1 bg-terminal-bg-elevated border border-terminal-border rounded-md p-2 text-sm outline-none focus:border-primary"
                    />
                    {keyFindings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKeyFinding(index)}
                        className="p-2 hover:bg-red-500/20 rounded-md text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Full Content with Modern Editor */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Full Report Content *
              </label>
              <ModernEditor
                content={content}
                onChange={setContent}
                placeholder="Write your comprehensive research report here..."
                onImageUpload={handleImageUpload}
              />
            </div>

            {/* Methodology & Data Sources */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Methodology
                  </label>
                  <textarea
                    value={methodology}
                    onChange={(e) => setMethodology(e.target.value)}
                    placeholder="Describe the research methodology used..."
                    rows={4}
                    className="w-full bg-terminal-bg-elevated border border-terminal-border rounded-md p-3 outline-none focus:border-primary text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Data Sources
                  </label>
                  <textarea
                    value={dataSources}
                    onChange={(e) => setDataSources(e.target.value)}
                    placeholder="List primary data sources..."
                    rows={4}
                    className="w-full bg-terminal-bg-elevated border border-terminal-border rounded-md p-3 outline-none focus:border-primary text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className={cn(
          "fixed right-0 top-[57px] bottom-0 w-96 bg-terminal-bg-secondary border-l border-terminal-border overflow-y-auto transition-transform duration-300",
          showSettings ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-6 space-y-6">
            {/* Report Type & Status */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Report Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                  >
                    {REPORT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Read Time (min)</label>
                    <input
                      type="number"
                      value={readTimeMinutes}
                      onChange={(e) => setReadTimeMinutes(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Page Count</label>
                    <input
                      type="number"
                      value={pageCount}
                      onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-terminal-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="rounded border-terminal-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Premium</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="border-t border-terminal-border pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Topics
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {topics.map((topic) => (
                  <label key={topic.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTopics([...selectedTopics, topic.id]);
                        } else {
                          setSelectedTopics(selectedTopics.filter(id => id !== topic.id));
                        }
                      }}
                      className="rounded border-terminal-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{topic.name}</span>
                  </label>
                ))}
                {topics.length === 0 && (
                  <p className="text-sm text-muted-foreground">No topics available</p>
                )}
              </div>
            </div>

            {/* Industries */}
            <div className="border-t border-terminal-border pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Industries
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {industries.map((industry) => (
                  <label key={industry.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIndustries.includes(industry.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIndustries([...selectedIndustries, industry.id]);
                        } else {
                          setSelectedIndustries(selectedIndustries.filter(id => id !== industry.id));
                        }
                      }}
                      className="rounded border-terminal-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{industry.name}</span>
                  </label>
                ))}
                {industries.length === 0 && (
                  <p className="text-sm text-muted-foreground">No industries available</p>
                )}
              </div>
            </div>

            {/* External Authors */}
            <div className="border-t border-terminal-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  External Authors
                </h3>
                <button
                  type="button"
                  onClick={addExternalAuthor}
                  className="p-1 hover:bg-terminal-bg-elevated rounded"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                {externalAuthors.map((author, index) => (
                  <div key={index} className="p-3 bg-terminal-bg rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Author {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeExternalAuthor(index)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={author.name}
                      onChange={(e) => updateExternalAuthor(index, "name", e.target.value)}
                      placeholder="Name"
                      className="w-full px-2 py-1 bg-terminal-bg-elevated border border-terminal-border rounded text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={author.title}
                      onChange={(e) => updateExternalAuthor(index, "title", e.target.value)}
                      placeholder="Title"
                      className="w-full px-2 py-1 bg-terminal-bg-elevated border border-terminal-border rounded text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={author.organization}
                      onChange={(e) => updateExternalAuthor(index, "organization", e.target.value)}
                      placeholder="Organization"
                      className="w-full px-2 py-1 bg-terminal-bg-elevated border border-terminal-border rounded text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
                {externalAuthors.length === 0 && (
                  <p className="text-xs text-muted-foreground">No external authors added</p>
                )}
              </div>
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
                    placeholder="SEO title (optional)"
                    className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Meta Description</label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO description (optional)"
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
        defaultQuery="research report finance"
      />
    </div>
  );
}
