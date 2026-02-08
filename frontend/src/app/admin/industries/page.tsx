"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Factory,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  Eye,
  Star,
  Building2,
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
import { researchService, Industry } from "@/services/api/research";
import { toast } from "sonner";

interface IndustryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_featured: boolean;
  is_active: boolean;
  order: number;
}

const defaultFormData: IndustryFormData = {
  name: "",
  slug: "",
  description: "",
  icon: "Factory",
  color: "#FF6B00",
  is_featured: false,
  is_active: true,
  order: 0,
};

// Available Lucide icons for industries
const iconOptions = [
  "Factory", "Building2", "Landmark", "Pickaxe", "Cpu", "Wheat",
  "Globe", "Heart", "ShoppingBag", "Radio", "Home", "Zap"
];

export default function AdminIndustriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState<IndustryFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch industries
  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const data = await researchService.getIndustries();
      setIndustries(data);
    } catch (error) {
      console.error("Failed to fetch industries:", error);
      toast.error("Failed to load industries");
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter((industry) =>
    industry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalArticles = industries.reduce((acc, i) => acc + (i.article_count || 0), 0);

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
      if (editingIndustry) {
        await researchService.updateIndustry(editingIndustry.slug, formData);
        toast.success("Industry updated successfully");
      } else {
        await researchService.createIndustry(formData);
        toast.success("Industry created successfully");
      }
      setShowModal(false);
      setEditingIndustry(null);
      setFormData(defaultFormData);
      fetchIndustries();
    } catch (error: any) {
      console.error("Failed to save industry:", error);
      toast.error(error.response?.data?.detail || "Failed to save industry");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (industry: Industry) => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      slug: industry.slug,
      description: industry.description || "",
      icon: industry.icon || "Factory",
      color: industry.color || "#FF6B00",
      is_featured: industry.is_featured || false,
      is_active: true,
      order: 0,
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (slug: string) => {
    try {
      await researchService.deleteIndustry(slug);
      toast.success("Industry deleted successfully");
      setDeleteConfirm(null);
      fetchIndustries();
    } catch (error: any) {
      console.error("Failed to delete industry:", error);
      toast.error(error.response?.data?.detail || "Failed to delete industry");
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (industry: Industry) => {
    try {
      await researchService.updateIndustry(industry.slug, {
        is_featured: !industry.is_featured,
      });
      toast.success(industry.is_featured ? "Removed from featured" : "Added to featured");
      fetchIndustries();
    } catch (error) {
      toast.error("Failed to update industry");
    }
  };

  // Open new industry modal
  const openNewModal = () => {
    setEditingIndustry(null);
    setFormData(defaultFormData);
    setShowModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Industries</h1>
          <p className="text-muted-foreground">
            Manage industry sectors and classifications
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Industry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Factory className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{industries.length}</div>
          <div className="text-sm text-muted-foreground">Industries</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <FileText className="h-5 w-5 text-amber-400 mb-2" />
          <div className="text-2xl font-bold">{totalArticles.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Articles</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Star className="h-5 w-5 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold">{industries.filter(i => i.is_featured).length}</div>
          <div className="text-sm text-muted-foreground">Featured</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Building2 className="h-5 w-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{industries.filter(i => i.is_active !== false).length}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search industries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Industries Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-terminal-border">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Industry</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Articles</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Featured</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {filteredIndustries.map((industry) => (
                <tr key={industry.id} className="hover:bg-terminal-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${industry.color}20` }}
                      >
                        <Factory className="h-5 w-5" style={{ color: industry.color }} />
                      </div>
                      <div>
                        <div className="font-medium">{industry.name}</div>
                        <div className="text-xs text-muted-foreground">/industries/{industry.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {industry.article_count || 0}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleFeatured(industry)}>
                      {industry.is_featured ? (
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-terminal-bg-elevated rounded-md">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/industries/${industry.slug}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View Page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => handleEdit(industry)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => handleToggleFeatured(industry)}
                        >
                          <Star className="h-4 w-4" />
                          {industry.is_featured ? "Remove Featured" : "Set Featured"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-400"
                          onClick={() => setDeleteConfirm(industry.slug)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredIndustries.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No industries found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h2 className="text-lg font-semibold">
                {editingIndustry ? "Edit Industry" : "New Industry"}
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
                      slug: editingIndustry ? formData.slug : generateSlug(e.target.value),
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
                  disabled={!!editingIndustry}
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
                  {editingIndustry ? "Update" : "Create"}
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
            <h2 className="text-lg font-semibold mb-2">Delete Industry</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this industry? This action cannot be undone.
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
