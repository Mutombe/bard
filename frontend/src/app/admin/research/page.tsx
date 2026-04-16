"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  MagnifyingGlass,
  FileText,
  Eye,
  PencilSimple,
  Trash,
  DownloadSimple,
  Calendar,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { researchService, type ResearchReport } from "@/services/api/research";
import { toast } from "sonner";

const REPORT_TYPE_LABELS: Record<string, string> = {
  quarterly: "Finance Africa Quarterly",
  analysis: "Finance Africa Insights",
  outlook: "AfriFin Analytics",
  annual: "Annual Report",
  country: "Country Report",
  special: "Special Report",
  whitepaper: "Whitepaper",
};

const statuses = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "published", label: "Published" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-500/20 text-green-700 dark:text-green-400";
    case "draft":
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    case "review":
      return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

export default function AdminResearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 25;

  const fetchReports = () => {
    setLoading(true);
    researchService
      .getReports({ page, page_size: PAGE_SIZE, ordering: "-created_at" })
      .then((r) => {
        setReports(r.results || []);
        setTotalCount(r.count || 0);
      })
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  };

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedType, selectedStatus]);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(slug);
    try {
      await researchService.deleteReport(slug);
      toast.success("Report deleted");
      setReports((prev) => prev.filter((r) => r.slug !== slug));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (report: ResearchReport) => {
    const url = report.pdf_url || report.pdf_file;
    if (!url) {
      toast.error("No PDF attached to this report");
      return;
    }
    window.open(url, "_blank");
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || report.report_type === selectedType;
    const matchesStatus = selectedStatus === "all" || report.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: reports.length,
    published: reports.filter((r) => r.status === "published").length,
    drafts: reports.filter((r) => r.status === "draft").length,
    inReview: reports.filter((r) => r.status === "review").length,
    totalViews: reports.reduce((sum, r) => sum + (r.view_count || 0), 0),
    totalLikes: reports.reduce((sum, r) => sum + ((r as any).likes_count || 0), 0),
    totalSaves: reports.reduce((sum, r) => sum + ((r as any).saves_count || 0), 0),
    totalDownloads: reports.reduce((sum, r) => sum + (r.download_count || 0), 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Research Reports</h1>
          <p className="text-muted-foreground">Manage research publications and reports</p>
        </div>
        <Link
          href="/admin/research/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-coral text-white rounded-md hover:bg-brand-coral-dark transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Reports</div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.drafts}</div>
          <div className="text-sm text-muted-foreground">Drafts</div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inReview}</div>
          <div className="text-sm text-muted-foreground">In Review</div>
        </div>
      </div>

      {/* Engagement stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold tabular-nums">{stats.totalViews.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Views</div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold text-brand-coral tabular-nums">{stats.totalLikes.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Likes</div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold text-brand-plum tabular-nums">{stats.totalSaves.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Saves</div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border p-4">
          <div className="text-2xl font-bold tabular-nums">{stats.totalDownloads.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Downloads</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">All Publications</option>
          {Object.entries(REPORT_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border text-sm focus:outline-none focus:border-primary"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Publication</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">PDF</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Views</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">Likes</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">Saves</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Downloads</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">Loading reports…</td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No research reports found</p>
                  <Link href="/admin/research/new" className="inline-block mt-3 text-brand-coral hover:underline text-sm">
                    Upload your first report →
                  </Link>
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-terminal-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {report.title}
                      {report.is_new && (
                        <span className="ml-2 px-1.5 py-0.5 bg-brand-coral text-white text-[9px] font-bold uppercase tracking-wider">
                          NEW
                        </span>
                      )}
                      {report.is_featured && (
                        <span className="ml-2 px-1.5 py-0.5 bg-brand-plum text-white text-[9px] font-bold uppercase tracking-wider">
                          Featured
                        </span>
                      )}
                    </div>
                    {report.published_at && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 text-xs bg-terminal-bg border border-terminal-border">
                      {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 text-xs capitalize", getStatusColor(report.status))}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm">
                    {report.pdf_url || report.pdf_file ? (
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground tabular-nums">
                    {(report.view_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground tabular-nums">
                    {((report as any).likes_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground tabular-nums">
                    {((report as any).saves_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground tabular-nums">
                    {(report.download_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-terminal-bg-elevated">
                        <DotsThreeVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/publications/${report.report_type}/${report.slug}`}
                            target="_blank"
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/research/${report.slug}/edit`}
                            className="flex items-center gap-2"
                          >
                            <PencilSimple className="h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {(report.pdf_url || report.pdf_file) && (
                          <DropdownMenuItem
                            onClick={() => handleDownload(report)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <DownloadSimple className="h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(report.slug, report.title)}
                          disabled={deleting === report.slug}
                          className="flex items-center gap-2 text-red-500 cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                          {deleting === report.slug ? "Deleting…" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} reports
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm border border-terminal-border hover:bg-terminal-bg-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground tabular-nums px-2">
              Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * PAGE_SIZE >= totalCount}
              className="px-3 py-2 text-sm border border-terminal-border hover:bg-terminal-bg-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
