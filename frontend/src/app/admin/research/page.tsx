"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  ChevronDown,
  Calendar,
  User,
  Filter,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock research reports data
const mockReports = [
  {
    id: "1",
    title: "African Banking Sector Outlook 2025",
    category: "Banking & Finance",
    status: "published",
    author: "Dr. Fatima Hassan",
    publishedAt: "2025-01-15",
    downloads: 1234,
    views: 5678,
  },
  {
    id: "2",
    title: "Mobile Money Revolution in Africa",
    category: "Fintech",
    status: "published",
    author: "Amara Obi",
    publishedAt: "2024-12-20",
    downloads: 987,
    views: 4321,
  },
  {
    id: "3",
    title: "Mining & Resources Annual Review",
    category: "Mining",
    status: "draft",
    author: "Samuel Okonkwo",
    publishedAt: null,
    downloads: 0,
    views: 0,
  },
  {
    id: "4",
    title: "ESG Investment Trends in Africa",
    category: "Sustainable Finance",
    status: "review",
    author: "Dr. Fatima Hassan",
    publishedAt: null,
    downloads: 0,
    views: 156,
  },
  {
    id: "5",
    title: "AfCFTA Economic Impact Analysis",
    category: "Trade Policy",
    status: "published",
    author: "Thabo Mokoena",
    publishedAt: "2024-11-10",
    downloads: 2156,
    views: 8934,
  },
];

const categories = [
  "All Categories",
  "Banking & Finance",
  "Fintech",
  "Mining",
  "Trade Policy",
  "Sustainable Finance",
  "Economics",
];

const statuses = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "published", label: "Published" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-500/20 text-green-400";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "review":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

export default function AdminResearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [reports] = useState(mockReports);

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || report.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || report.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: reports.length,
    published: reports.filter((r) => r.status === "published").length,
    drafts: reports.filter((r) => r.status === "draft").length,
    inReview: reports.filter((r) => r.status === "review").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Research Reports</h1>
          <p className="text-muted-foreground">
            Manage research publications and reports
          </p>
        </div>
        <Link
          href="/admin/research/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Reports</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold text-green-400">{stats.published}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.drafts}</div>
          <div className="text-sm text-muted-foreground">Drafts</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.inReview}</div>
          <div className="text-sm text-muted-foreground">In Review</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">Author</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Views</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Downloads</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border">
            {filteredReports.map((report) => (
              <tr key={report.id} className="hover:bg-terminal-bg-elevated transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{report.title}</div>
                  {report.publishedAt && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.publishedAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="px-2 py-1 text-xs bg-terminal-bg rounded border border-terminal-border">
                    {report.category}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                  {report.author}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 text-xs rounded capitalize",
                    getStatusColor(report.status)
                  )}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                  {report.views.toLocaleString()}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                  {report.downloads.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 hover:bg-terminal-bg-elevated rounded-md">
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/research/${report.id}`} className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/research/${report.id}`} className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-red-400">
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

        {filteredReports.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No research reports found</p>
          </div>
        )}
      </div>
    </div>
  );
}
