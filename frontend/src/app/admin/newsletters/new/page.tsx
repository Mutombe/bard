"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Calendar,
  Users,
  FileText,
  Plus,
  X,
  Loader2,
  Check,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/api/admin";
import { mediaService } from "@/services/api/media";
import { ImagePicker } from "@/components/editor/ImagePicker";
import { ModernEditor } from "@/components/editor/ModernEditor";
import { toast } from "sonner";

const NEWSLETTER_TYPES = [
  { value: "morning_brief", label: "Morning Brief" },
  { value: "evening_wrap", label: "Evening Wrap" },
  { value: "weekly_digest", label: "Weekly Digest" },
  { value: "breaking_news", label: "Breaking News" },
  { value: "earnings", label: "Earnings Alerts" },
];

export default function NewNewsletterPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["morning_brief"]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [sendResult, setSendResult] = useState<{
    emails_sent: number;
    total_subscribers: number;
  } | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await adminService.getNewsletterStats();
      setStats({
        total: statsData.total_subscribers,
        active: statsData.active_subscribers,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Draft saved");
    setIsSaving(false);
  };

  const handleSendTest = async () => {
    toast.info("Test email feature coming soon");
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await mediaService.uploadFile(file);
    return result.url;
  }, []);

  const handleInsertImage = (image: { url: string; photographer?: string; alt?: string }) => {
    const credit = image.photographer ? `<p style="font-size: 12px; color: #888; margin-top: 8px;">Photo by ${image.photographer} on Unsplash</p>` : "";
    const imageHtml = `<figure style="margin: 20px 0; text-align: center;">
      <img src="${image.url}" alt="${image.alt || ""}" style="max-width: 100%; height: auto; border-radius: 8px;" />${credit}
    </figure>`;
    setContent((prev) => prev + imageHtml);
    toast.success("Image inserted into content");
    setShowImagePicker(false);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line");
      return;
    }
    if (!content.trim()) {
      toast.error("Please enter newsletter content");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Please select at least one newsletter type");
      return;
    }

    setIsSending(true);
    try {
      const result = await adminService.createNewsletter({
        subject,
        content,
        subscription_types: selectedTypes,
        scheduled_for: scheduledDate || undefined,
      });

      setSendResult({
        emails_sent: result.emails_sent || 0,
        total_subscribers: result.total_subscribers || 0,
      });

      toast.success(`Newsletter sent to ${result.emails_sent} subscribers!`);
    } catch (error: any) {
      console.error("Failed to send newsletter:", error);
      toast.error(error.response?.data?.error || "Failed to send newsletter");
    } finally {
      setIsSending(false);
    }
  };

  // Word count from HTML content
  const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  if (sendResult) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8">
          <div className="w-16 h-16 bg-market-up/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-market-up" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Newsletter Sent!</h1>
          <p className="text-muted-foreground mb-6">
            Your newsletter has been sent to {sendResult.emails_sent} of {sendResult.total_subscribers} subscribers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/admin/newsletters"
              className="px-4 py-2 bg-brand-burgundy text-white rounded-md hover:bg-brand-burgundy-dark transition-colors"
            >
              Back to Newsletters
            </Link>
            <button
              onClick={() => {
                setSendResult(null);
                setSubject("");
                setContent("");
              }}
              className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-terminal-bg/95 backdrop-blur-sm border-b border-terminal-border">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/newsletters"
              className="p-2 hover:bg-terminal-bg-secondary rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">New Newsletter</h1>
              <p className="text-xs text-muted-foreground">
                {wordCount} words • {selectedTypes.length} lists selected
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
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={handleSendTest}
              className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Send Test
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-4 py-2 bg-brand-burgundy text-white rounded-md hover:bg-brand-burgundy-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Now
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Main Editor */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          showSettings ? "pr-80" : ""
        )}>
          <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your newsletter subject line..."
                className="w-full text-2xl font-semibold bg-transparent border border-terminal-border rounded-md p-4 outline-none focus:border-primary"
              />
            </div>

            {/* Content with Modern Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Newsletter Content *
                </label>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="px-3 py-1.5 text-xs bg-terminal-bg-secondary border border-terminal-border rounded-md hover:bg-terminal-bg-elevated flex items-center gap-2"
                >
                  <ImageIcon className="h-3 w-3" />
                  Insert Image
                </button>
              </div>
              <ModernEditor
                content={content}
                onChange={setContent}
                placeholder="Write your newsletter content here..."
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className={cn(
          "fixed right-0 top-[57px] bottom-0 w-80 bg-terminal-bg-secondary border-l border-terminal-border overflow-y-auto transition-transform duration-300",
          showSettings ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-6 space-y-6">
            {/* Newsletter Types */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Newsletter Types *
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Select which subscriber lists should receive this newsletter
              </p>
              <div className="space-y-2">
                {NEWSLETTER_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => toggleType(type.value)}
                      className="rounded border-terminal-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="border-t border-terminal-border pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule (Optional)
              </h3>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Leave empty to send immediately
              </p>
            </div>

            {/* Stats */}
            <div className="border-t border-terminal-border pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Subscriber Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Subscribers</span>
                  <span className="font-mono">{stats.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-mono text-market-up">{stats.active.toLocaleString()}</span>
                </div>
                <div className="border-t border-terminal-border pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected Types</span>
                    <span className="font-mono font-semibold text-primary">
                      {selectedTypes.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-400 mb-2">Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Keep subject lines under 60 characters</li>
                <li>• Include a clear call-to-action</li>
                <li>• Test before sending to all subscribers</li>
                <li>• Best send times: 7-9 AM or 5-7 PM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleInsertImage}
        defaultQuery={subject ? subject.split(" ").slice(0, 2).join(" ") : ""}
      />
    </div>
  );
}
