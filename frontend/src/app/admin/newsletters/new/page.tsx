"use client";

import { useState, useEffect } from "react";
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
  Grip,
  Loader2,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/api/admin";
import { UnsplashImagePicker } from "@/components/editor/UnsplashImagePicker";
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
  const [status, setStatus] = useState<"draft" | "scheduled" | "sending">("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [sendResult, setSendResult] = useState<{
    emails_sent: number;
    total_subscribers: number;
  } | null>(null);
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false);

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

  const handleInsertImage = (image: { url: string; photographer: string; alt: string }) => {
    const imageHtml = `\n<div style="margin: 20px 0; text-align: center;">
  <img src="${image.url}" alt="${image.alt}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  <p style="font-size: 12px; color: #888; margin-top: 8px;">Photo by ${image.photographer} on Unsplash</p>
</div>\n`;
    setContent((prev) => prev + imageHtml);
    toast.success("Image inserted into content");
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
              className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/newsletters"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Newsletter</h1>
            <p className="text-sm text-muted-foreground">
              Compose and send a newsletter to your subscribers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Email Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your newsletter subject line..."
              className="w-full text-xl font-semibold bg-transparent border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange"
            />
          </div>

          {/* Content */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Newsletter Content *
              </label>
              <button
                type="button"
                onClick={() => setShowUnsplashPicker(true)}
                className="px-3 py-1.5 text-xs bg-terminal-bg-elevated border border-terminal-border rounded-md hover:bg-terminal-bg flex items-center gap-2"
              >
                <ImageIcon className="h-3 w-3" />
                Insert Image
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              You can use HTML tags for formatting. The content will be wrapped in a professional email template.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<h2>Market Update</h2>
<p>Here's your morning market briefing...</p>

<h3>Top Movers</h3>
<ul>
  <li>Stock A: +5.2%</li>
  <li>Stock B: -3.1%</li>
</ul>

<p>Stay informed with Bardiq Journal.</p>"
              rows={20}
              className="w-full bg-terminal-bg-elevated border border-terminal-border rounded-md p-4 outline-none focus:border-brand-orange font-mono text-sm resize-none"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Newsletter Types */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
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
                    className="rounded border-terminal-border text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule (Optional)
            </h3>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Leave empty to send immediately
            </p>
          </div>

          {/* Stats */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
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
                  <span className="font-mono font-semibold text-brand-orange">
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

      {/* Unsplash Image Picker Modal */}
      <UnsplashImagePicker
        isOpen={showUnsplashPicker}
        onClose={() => setShowUnsplashPicker(false)}
        onSelect={handleInsertImage}
        defaultQuery={subject ? subject.split(" ").slice(0, 2).join(" ") : ""}
      />
    </div>
  );
}
