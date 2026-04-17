"use client";

import { useState, useEffect } from "react";
import {
  PenNib,
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  FloppyDisk,
  CircleNotch,
  Envelope,
  LinkedinLogo,
  XLogo,
  FileText,
} from "@phosphor-icons/react";
import { editorialService, type Writer } from "@/services/api/editorial";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMPTY_WRITER: Partial<Writer> = {
  full_name: "",
  email: "",
  bio: "",
  title: "",
  organization: "",
  avatar_url: "",
  twitter: "",
  linkedin: "",
};

export default function WritersPage() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Writer | null>(null);
  const [form, setForm] = useState<Partial<Writer>>(EMPTY_WRITER);
  const [saving, setSaving] = useState(false);

  const fetchWriters = async () => {
    try {
      const data = await editorialService.getWriters(search ? { search } : undefined);
      setWriters(data);
    } catch {
      toast.error("Failed to load writers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWriters();
  }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_WRITER);
    setShowForm(true);
  };

  const openEdit = (w: Writer) => {
    setEditing(w);
    setForm({
      full_name: w.full_name,
      email: w.email || "",
      bio: w.bio || "",
      title: w.title || "",
      organization: w.organization || "",
      avatar_url: w.avatar_url || w.avatar_display || "",
      twitter: w.twitter || "",
      linkedin: w.linkedin || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.full_name?.trim()) {
      toast.error("Writer name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await editorialService.updateWriter(editing.slug, form);
        toast.success("Writer updated");
      } else {
        await editorialService.createWriter(form);
        toast.success("Writer added");
      }
      setShowForm(false);
      setEditing(null);
      fetchWriters();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save writer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w: Writer) => {
    if (!confirm(`Delete writer "${w.full_name}"? Their articles will keep the byline but won't link to a profile.`)) return;
    try {
      await editorialService.deleteWriter(w.slug);
      toast.success("Writer deleted");
      fetchWriters();
    } catch {
      toast.error("Failed to delete writer");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Writers</h1>
          <p className="text-muted-foreground">Manage contributor profiles. Attach a writer to articles for proper byline credit.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-burgundy text-white rounded-md hover:bg-brand-burgundy-dark transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Writer
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search writers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Writers Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading writers...</div>
      ) : writers.length === 0 ? (
        <div className="text-center py-12">
          <PenNib className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-3">No writers yet</p>
          <button onClick={openNew} className="text-brand-burgundy hover:underline text-sm">
            Add your first writer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {writers.map((w) => (
            <div
              key={w.id}
              className="bg-terminal-bg-secondary border border-terminal-border p-5 flex flex-col"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-terminal-bg-elevated border border-terminal-border overflow-hidden flex-shrink-0">
                  {w.avatar_display ? (
                    <img src={w.avatar_display} alt={w.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {w.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{w.full_name}</h3>
                  {w.title && <p className="text-xs text-muted-foreground truncate">{w.title}</p>}
                  {w.organization && <p className="text-xs text-muted-foreground truncate">{w.organization}</p>}
                </div>
              </div>
              {w.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{w.bio}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {w.article_count || 0} articles
                </span>
                {w.email && (
                  <span className="flex items-center gap-1">
                    <Envelope className="h-3 w-3" />
                    {w.email}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-terminal-border">
                {w.twitter && (
                  <span className="text-xs text-muted-foreground">@{w.twitter}</span>
                )}
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => openEdit(w)}
                    className="p-2 hover:bg-terminal-bg-elevated rounded text-muted-foreground hover:text-foreground"
                    title="Edit"
                  >
                    <PencilSimple className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w)}
                    className="p-2 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-400"
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Writer Form Slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-terminal-bg border-l border-terminal-border overflow-y-auto">
            <div className="sticky top-0 bg-terminal-bg border-b border-terminal-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold">{editing ? "Edit Writer" : "Add Writer"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-terminal-bg-secondary rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name || ""}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Farai Mabeza"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title / Role</label>
                <input
                  type="text"
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Senior Correspondent"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Organization</label>
                <input
                  type="text"
                  value={form.organization || ""}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. BGFI"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                  placeholder="farai@bgfi.global"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Bio</label>
                <textarea
                  value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="Short bio..."
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={form.avatar_url || ""}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                  placeholder="https://..."
                />
                {form.avatar_url && (
                  <img src={form.avatar_url} alt="Preview" className="w-16 h-16 object-cover mt-2 border border-terminal-border" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">X / Twitter</label>
                  <input
                    type="text"
                    value={form.twitter || ""}
                    onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={form.linkedin || ""}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-primary"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-burgundy text-white rounded-md hover:bg-brand-burgundy-dark transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
                  {editing ? "Update Writer" : "Add Writer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
