"use client";

import { useState } from "react";
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
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterSection {
  id: string;
  type: "header" | "article" | "market_summary" | "text" | "divider";
  title?: string;
  content?: string;
  articleId?: string;
}

const sectionTypes = [
  { type: "header", label: "Header Section", icon: FileText },
  { type: "article", label: "Article Link", icon: FileText },
  { type: "market_summary", label: "Market Summary", icon: FileText },
  { type: "text", label: "Text Block", icon: FileText },
  { type: "divider", label: "Divider", icon: FileText },
];

export default function NewNewsletterPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [sections, setSections] = useState<NewsletterSection[]>([
    { id: "1", type: "header", title: "Morning Market Briefing" },
  ]);
  const [status, setStatus] = useState<"draft" | "scheduled" | "sent">("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  const addSection = (type: NewsletterSection["type"]) => {
    const newSection: NewsletterSection = {
      id: Date.now().toString(),
      type,
      title: "",
      content: "",
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<NewsletterSection>) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    router.push("/admin/newsletters");
  };

  const handleSendTest = async () => {
    alert("Test email sent to your address");
  };

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
              Compose and schedule a new newsletter edition
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
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
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {status === "scheduled" ? "Schedule" : "Send Now"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your newsletter subject line..."
              className="w-full text-xl font-semibold bg-transparent border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange"
            />
          </div>

          {/* Preheader */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Preheader Text
            </label>
            <input
              type="text"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Preview text shown in email clients..."
              className="w-full bg-transparent border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange text-sm"
            />
          </div>

          {/* Content Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Newsletter Content</h3>
            </div>

            {sections.map((section, index) => (
              <div
                key={section.id}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Grip className="h-4 w-4 text-muted-foreground cursor-move" />
                    <span className="text-sm font-medium capitalize">
                      {section.type.replace("_", " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSection(section.id)}
                    className="p-1 hover:bg-terminal-bg-elevated rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {section.type === "header" && (
                  <input
                    type="text"
                    value={section.title || ""}
                    onChange={(e) =>
                      updateSection(section.id, { title: e.target.value })
                    }
                    placeholder="Section heading..."
                    className="w-full bg-terminal-bg-elevated border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange font-semibold"
                  />
                )}

                {section.type === "text" && (
                  <textarea
                    value={section.content || ""}
                    onChange={(e) =>
                      updateSection(section.id, { content: e.target.value })
                    }
                    placeholder="Write your content here..."
                    rows={4}
                    className="w-full bg-terminal-bg-elevated border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange resize-none"
                  />
                )}

                {section.type === "article" && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search for an article..."
                      className="w-full bg-terminal-bg-elevated border border-terminal-border rounded-md p-3 outline-none focus:border-brand-orange"
                    />
                    <p className="text-xs text-muted-foreground">
                      Select an article to include in the newsletter
                    </p>
                  </div>
                )}

                {section.type === "market_summary" && (
                  <div className="p-4 bg-terminal-bg-elevated rounded-md text-center text-muted-foreground text-sm">
                    Market summary will be auto-generated with latest data
                  </div>
                )}

                {section.type === "divider" && (
                  <div className="border-t border-terminal-border my-2" />
                )}
              </div>
            ))}

            {/* Add Section */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-dashed border-terminal-border p-4">
              <p className="text-sm text-muted-foreground mb-3">Add a section:</p>
              <div className="flex flex-wrap gap-2">
                {sectionTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => addSection(type.type as NewsletterSection["type"])}
                    className="px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md hover:border-brand-orange/50 text-sm flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Send Settings */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              {status === "scheduled" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Schedule Date
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Audience */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Target Audience
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={targetAudience === "all"}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="text-brand-orange"
                />
                <span className="text-sm">All Subscribers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="audience"
                  value="premium"
                  checked={targetAudience === "premium"}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="text-brand-orange"
                />
                <span className="text-sm">Premium Subscribers Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="audience"
                  value="free"
                  checked={targetAudience === "free"}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="text-brand-orange"
                />
                <span className="text-sm">Free Tier Only</span>
              </label>
            </div>
          </div>

          {/* Stats Preview */}
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <h3 className="font-semibold mb-4">Audience Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Subscribers</span>
                <span className="font-mono">12,456</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Premium</span>
                <span className="font-mono">3,234</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Free Tier</span>
                <span className="font-mono">9,222</span>
              </div>
              <div className="border-t border-terminal-border pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Will Receive</span>
                  <span className="font-mono font-semibold text-brand-orange">
                    {targetAudience === "all"
                      ? "12,456"
                      : targetAudience === "premium"
                      ? "3,234"
                      : "9,222"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
