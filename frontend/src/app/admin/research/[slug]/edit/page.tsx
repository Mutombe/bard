"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FloppyDisk,
  CircleNotch,
  FileText,
  Image as ImageIcon,
  Trash,
} from "@phosphor-icons/react";
import { ImagePicker } from "@/components/editor/ImagePicker";
import { ModernEditor } from "@/components/editor/ModernEditor";
import { researchService, type ResearchReport } from "@/services/api/research";
import { mediaService } from "@/services/api/media";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "quarterly", label: "Finance Africa Quarterly (Flagship Journal)" },
  { value: "analysis", label: "Finance Africa Insights (Editorial)" },
  { value: "outlook", label: "AfriFin Analytics (Data Intelligence)" },
  { value: "annual", label: "Annual Report" },
  { value: "country", label: "Country Report" },
  { value: "special", label: "Special Report" },
  { value: "whitepaper", label: "Whitepaper" },
];

export default function EditResearchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [report, setReport] = useState<ResearchReport | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [content, setContent] = useState("");
  const [reportType, setReportType] = useState("quarterly");
  const [status, setStatus] = useState("published");
  const [coverImage, setCoverImage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [readTimeMinutes, setReadTimeMinutes] = useState(15);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!slug) return;
    researchService
      .getReport(slug)
      .then((r) => {
        setReport(r);
        setTitle(r.title || "");
        setSubtitle(r.subtitle || "");
        setAbstract(r.abstract || "");
        setContent(r.content || "");
        setReportType(r.report_type || "quarterly");
        setStatus(r.status || "published");
        setCoverImage(r.image_url || r.cover_image_url || "");
        setExistingPdfUrl(r.pdf_url || r.pdf_file || null);
        setIsFeatured(r.is_featured || false);
        setIsPremium(r.is_premium || false);
        setReadTimeMinutes(r.read_time_minutes || 15);
        setPageCount(r.page_count || 0);
      })
      .catch(() => toast.error("Could not load report"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleImageSelected = (image: any) => {
    setCoverImage(image.url);
    setShowImagePicker(false);
    toast.success("Cover image selected");
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await mediaService.uploadFile(file);
    return result.url;
  }, []);

  const handleSave = async (newStatus?: string) => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!abstract.trim()) {
      toast.error("Please enter an abstract");
      return;
    }

    setSaving(true);
    try {
      const finalStatus = newStatus || status;
      const baseData: Record<string, any> = {
        title,
        subtitle,
        abstract,
        content: content || "",
        report_type: reportType,
        status: finalStatus,
        cover_image_url: coverImage || "",
        is_featured: isFeatured,
        is_premium: isPremium,
        read_time_minutes: readTimeMinutes,
        page_count: pageCount,
      };

      // If a new PDF is attached, use multipart
      if (pdfFile) {
        const formData = new FormData();
        Object.entries(baseData).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (typeof v === "boolean") {
            formData.append(k, v ? "true" : "false");
          } else {
            formData.append(k, String(v));
          }
        });
        formData.append("pdf_file", pdfFile);
        // PATCH via multipart
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/research/reports/${slug}/`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
          },
          body: formData,
        });
      } else {
        await researchService.updateReport(slug, baseData);
      }

      toast.success(finalStatus === "published" ? "Published!" : "Saved");
      router.push("/admin/research");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await researchService.deleteReport(slug);
      toast.success("Deleted");
      router.push("/admin/research");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-terminal-bg-elevated" />
          <div className="h-12 bg-terminal-bg-elevated" />
          <div className="h-48 bg-terminal-bg-elevated" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <p className="text-muted-foreground mb-4">Report not found</p>
        <Link href="/admin/research" className="text-brand-coral hover:underline">
          ← Back to all reports
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin/research"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all reports
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 text-sm font-medium"
          >
            <Trash className="h-4 w-4" />
            Delete
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-terminal-border hover:bg-terminal-bg-elevated text-sm font-medium disabled:opacity-50"
          >
            {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
            Save
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-coral text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-coral-dark disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Cover Image
          </label>
          {coverImage ? (
            <div className="relative group">
              <img src={coverImage} alt="Cover" className="w-full max-h-64 object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowImagePicker(true)}
                  className="px-4 py-2 bg-white text-black text-sm font-medium"
                >
                  Change
                </button>
                <button
                  onClick={() => setCoverImage("")}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowImagePicker(true)}
              className="w-full h-48 border-2 border-dashed border-terminal-border flex flex-col items-center justify-center text-muted-foreground hover:border-brand-violet hover:text-brand-violet transition-colors"
            >
              <ImageIcon className="h-10 w-10 mb-2" />
              <span className="text-sm font-medium">Add cover image</span>
            </button>
          )}
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            PDF Document
          </label>
          {pdfFile ? (
            <div className="flex items-center justify-between p-4 bg-terminal-bg-elevated border border-terminal-border">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-brand-coral" />
                <div>
                  <div className="font-medium text-sm">{pdfFile.name}</div>
                  <div className="text-xs text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB · NEW upload</div>
                </div>
              </div>
              <button onClick={() => setPdfFile(null)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium">
                Cancel
              </button>
            </div>
          ) : existingPdfUrl ? (
            <div className="flex items-center justify-between p-4 bg-terminal-bg-elevated border border-terminal-border">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-brand-violet" />
                <div>
                  <div className="font-medium text-sm">PDF attached</div>
                  <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-coral hover:underline">
                    View current PDF
                  </a>
                </div>
              </div>
              <label className="px-3 py-1.5 bg-terminal-bg border border-terminal-border text-xs font-medium cursor-pointer hover:bg-terminal-bg-secondary">
                Replace
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="block w-full p-8 border-2 border-dashed border-terminal-border hover:border-brand-violet cursor-pointer text-center transition-colors">
              <input type="file" accept="application/pdf,.pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
              <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm font-medium">Click to upload PDF</div>
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-terminal-bg-secondary border border-terminal-border text-2xl font-bold focus:outline-none focus:border-brand-violet"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-4 py-3 bg-terminal-bg-secondary border border-terminal-border focus:outline-none focus:border-brand-violet"
          />
        </div>

        {/* Abstract */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Abstract *
          </label>
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-terminal-bg-secondary border border-terminal-border focus:outline-none focus:border-brand-violet font-serif-body"
          />
        </div>

        {/* Settings grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Publication Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 bg-terminal-bg-secondary border border-terminal-border focus:outline-none focus:border-brand-violet"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-terminal-bg-secondary border border-terminal-border focus:outline-none focus:border-brand-violet"
            >
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Page Count
            </label>
            <input
              type="number"
              value={pageCount}
              onChange={(e) => setPageCount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-terminal-bg-secondary border border-terminal-border focus:outline-none focus:border-brand-violet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Read Time (minutes)
            </label>
            <input
              type="number"
              value={readTimeMinutes}
              onChange={(e) => setReadTimeMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-terminal-bg-secondary border border-terminal-border focus:outline-none focus:border-brand-violet"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 p-4 bg-terminal-bg-secondary border border-terminal-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Premium</span>
          </label>
        </div>

        {/* Optional content */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Body Content
            <span className="ml-2 text-xs normal-case font-normal text-muted-foreground/70">
              Optional — leave empty if research is in PDF
            </span>
          </label>
          <ModernEditor
            content={content}
            onChange={setContent}
            placeholder="Optional. If you only have a PDF, skip this field..."
            onImageUpload={handleImageUpload}
          />
        </div>
      </div>

      {/* Image picker modal */}
      <ImagePicker
        isOpen={showImagePicker}
        onSelect={handleImageSelected}
        onClose={() => setShowImagePicker(false)}
      />
    </div>
  );
}
