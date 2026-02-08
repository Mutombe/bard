"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Tag,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  Eye,
  Star,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { researchService, Topic } from "@/services/api/research";
import { toast } from "sonner";

interface TopicFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_featured: boolean;
  is_active: boolean;
  order: number;
}

const defaultFormData: TopicFormData = {
  name: "",
  slug: "",
  description: "",
  icon: "Tag",
  color: "#3B82F6",
  is_featured: false,
  is_active: true,
  order: 0,
};

// Available Lucide icons for topics
const iconOptions = [
  "Tag", "TrendingUp", "Landmark", "Coins", "Banknote", "LineChart",
  "Globe", "Leaf", "Zap", "Shield", "Users", "Briefcase"
];

export default function AdminTopicsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState<TopicFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch topics
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const data = await researchService.getTopics();
      setTopics(data);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
      toast.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (topic.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalArticles = topics.reduce((acc, t) => acc + (t.article_count || 0), 0);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingTopic) {
        await researchService.updateTopic(editingTopic.slug, formData);
        toast.success("Topic updated successfully");
      } else {
        await researchService.createTopic(formData);
        toast.success("Topic created successfully");
      }
      setShowModal(false);
      setEditingTopic(null);
      setFormData(defaultFormData);
      fetchTopics();
    } catch (error: any) {
      console.error("Failed to save topic:", error);
      toast.error(error.response?.data?.detail || "Failed to save topic");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      slug: topic.slug,
      description: topic.description || "",
      icon: topic.icon || "Tag",
      color: topic.color || "#3B82F6",
      is_featured: topic.is_featured || false,
      is_active: true,
      order: 0,
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (slug: string) => {
    try {
      await researchService.deleteTopic(slug);
      toast.success("Topic deleted successfully");
      setDeleteConfirm(null);
      fetchTopics();
    } catch (error: any) {
      console.error("Failed to delete topic:", error);
      toast.error(error.response?.data?.detail || "Failed to delete topic");
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (topic: Topic) => {
    try {
      await researchService.updateTopic(topic.slug, {
        is_featured: !topic.is_featured,
      });
      toast.success(topic.is_featured ? "Removed from featured" : "Added to featured");
      fetchTopics();
    } catch (error) {
      toast.error("Failed to update topic");
    }
  };

  // Open new topic modal
  const openNewModal = () => {
    setEditingTopic(null);
    setFormData(defaultFormData);
    setShowModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Topics</h1>
          <p className="text-muted-foreground">
            Manage content topics and tags
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Topic
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Tag className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{topics.length}</div>
          <div className="text-sm text-muted-foreground">Total Topics</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Star className="h-5 w-5 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold">{topics.filter(t => t.is_featured).length}</div>
          <div className="text-sm text-muted-foreground">Featured</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <FileText className="h-5 w-5 text-amber-400 mb-2" />
          <div className="text-2xl font-bold">{totalArticles.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Articles</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold">
            {topics.length > 0 ? Math.round(totalArticles / topics.length) : 0}
          </div>
          <div className="text-sm text-muted-foreground">Avg Articles/Topic</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${topic.color}20` }}
                  >
                    <Tag className="h-5 w-5" style={{ color: topic.color }} />
                  </div>
                  {topic.is_featured && (
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-terminal-bg-elevated rounded">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/topics/${topic.slug}`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={() => handleEdit(topic)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={() => handleToggleFeatured(topic)}
                    >
                      <Star className="h-4 w-4" />
                      {topic.is_featured ? "Remove Featured" : "Set Featured"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-red-400"
                      onClick={() => setDeleteConfirm(topic.slug)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold mb-1">{topic.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {topic.description || "No description"}
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {topic.article_count || 0} articles
                </span>
                <Link
                  href={`/topics/${topic.slug}`}
                  className="text-primary hover:text-primary/80"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTopics.length === 0 && (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No topics found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h2 className="text-lg font-semibold">
                {editingTopic ? "Edit Topic" : "New Topic"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-terminal-bg-elevated rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: editingTopic ? formData.slug : generateSlug(e.target.value),
                    });
                  }}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  required
                  disabled={!!editingTopic}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 bg-terminal-bg border border-terminal-border rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-terminal-border"
                  />
                  <span className="text-sm">Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-terminal-border"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-terminal-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTopic ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">Delete Topic</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this topic? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
