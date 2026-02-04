"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Mic,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Play,
  Pause,
  Clock,
  Calendar,
  Headphones,
  Radio,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock podcast shows
const mockShows = [
  { id: "1", name: "African Markets Today", slug: "african-markets-today", episodeCount: 245, totalListens: 125000, status: "active" },
  { id: "2", name: "The Research Briefing", slug: "research-briefing", episodeCount: 89, totalListens: 45000, status: "active" },
  { id: "3", name: "Executive Conversations", slug: "executive-conversations", episodeCount: 34, totalListens: 28000, status: "active" },
];

// Mock episodes data
const mockEpisodes = [
  {
    id: "1",
    title: "JSE Rally Continues Amid Global Uncertainty",
    show: "African Markets Today",
    showSlug: "african-markets-today",
    status: "published",
    publishedAt: "2025-01-28",
    duration: "32:45",
    listens: 1234,
    hosts: ["Thabo Mokoena", "Sarah Okonkwo"],
  },
  {
    id: "2",
    title: "Nigerian Banks Q4 Results Preview",
    show: "African Markets Today",
    showSlug: "african-markets-today",
    status: "published",
    publishedAt: "2025-01-27",
    duration: "28:12",
    listens: 987,
    hosts: ["Thabo Mokoena"],
  },
  {
    id: "3",
    title: "Central Bank Digital Currencies in Africa",
    show: "The Research Briefing",
    showSlug: "research-briefing",
    status: "published",
    publishedAt: "2025-01-25",
    duration: "45:30",
    listens: 756,
    hosts: ["Dr. Fatima Hassan"],
  },
  {
    id: "4",
    title: "Mining Sector Outlook with Anglo American CEO",
    show: "Executive Conversations",
    showSlug: "executive-conversations",
    status: "draft",
    publishedAt: null,
    duration: "52:18",
    listens: 0,
    hosts: ["Amara Obi"],
  },
  {
    id: "5",
    title: "AfCFTA Trade Implications",
    show: "The Research Briefing",
    showSlug: "research-briefing",
    status: "scheduled",
    publishedAt: "2025-01-30",
    duration: "38:45",
    listens: 0,
    hosts: ["Dr. Fatima Hassan", "Samuel Okonkwo"],
  },
];

const statuses = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-500/20 text-green-400";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "scheduled":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

type ViewMode = "episodes" | "shows";

export default function AdminPodcastsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedShow, setSelectedShow] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("episodes");
  const [episodes] = useState(mockEpisodes);
  const [shows] = useState(mockShows);

  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch = episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.show.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || episode.status === selectedStatus;
    const matchesShow = selectedShow === "all" || episode.showSlug === selectedShow;
    return matchesSearch && matchesStatus && matchesShow;
  });

  const stats = {
    totalEpisodes: episodes.length,
    published: episodes.filter((e) => e.status === "published").length,
    totalListens: episodes.reduce((acc, e) => acc + e.listens, 0),
    totalShows: shows.length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Podcasts</h1>
          <p className="text-muted-foreground">
            Manage podcast shows and episodes
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {viewMode === "episodes" ? "New Episode" : "New Show"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Radio className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{stats.totalShows}</div>
          <div className="text-sm text-muted-foreground">Shows</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Mic className="h-5 w-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{stats.totalEpisodes}</div>
          <div className="text-sm text-muted-foreground">Episodes</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Headphones className="h-5 w-5 text-green-400 mb-2" />
          <div className="text-2xl font-bold">{stats.totalListens.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Listens</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Clock className="h-5 w-5 text-amber-400 mb-2" />
          <div className="text-2xl font-bold">{stats.published}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex bg-terminal-bg-secondary rounded-lg border border-terminal-border p-1">
          <button
            onClick={() => setViewMode("episodes")}
            className={cn(
              "px-4 py-2 rounded-md text-sm transition-colors",
              viewMode === "episodes"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Episodes
          </button>
          <button
            onClick={() => setViewMode("shows")}
            className={cn(
              "px-4 py-2 rounded-md text-sm transition-colors",
              viewMode === "shows"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Shows
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {viewMode === "episodes" && (
          <>
            <select
              value={selectedShow}
              onChange={(e) => setSelectedShow(e.target.value)}
              className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="all">All Shows</option>
              {shows.map((show) => (
                <option key={show.slug} value={show.slug}>{show.name}</option>
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
          </>
        )}
      </div>

      {/* Episodes View */}
      {viewMode === "episodes" && (
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-terminal-border">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Episode</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Show</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">Duration</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Listens</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {filteredEpisodes.map((episode) => (
                <tr key={episode.id} className="hover:bg-terminal-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                        <Play className="h-4 w-4 text-primary ml-0.5" />
                      </button>
                      <div>
                        <div className="font-medium">{episode.title}</div>
                        {episode.publishedAt && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(episode.publishedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 text-xs bg-terminal-bg rounded border border-terminal-border">
                      {episode.show}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {episode.duration}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 text-xs rounded capitalize",
                      getStatusColor(episode.status)
                    )}>
                      {episode.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Headphones className="h-3 w-3" />
                      {episode.listens.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-terminal-bg-elevated rounded-md">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/podcasts/${episode.showSlug}/${episode.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/podcasts/${episode.id}`} className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Preview Audio
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

          {filteredEpisodes.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No episodes found</p>
            </div>
          )}
        </div>
      )}

      {/* Shows View */}
      {viewMode === "shows" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shows.map((show) => (
            <div
              key={show.id}
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Radio className="h-6 w-6 text-primary" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-terminal-bg-elevated rounded">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/podcasts/${show.slug}`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Show
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/podcasts/new?show=${show.slug}`} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Episode
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 text-red-400">
                      <Trash2 className="h-4 w-4" />
                      Delete Show
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold mb-1">{show.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">/podcasts/{show.slug}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mic className="h-3 w-3" />
                    {show.episodeCount} episodes
                  </span>
                </div>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Headphones className="h-3 w-3" />
                  {show.totalListens.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-terminal-border">
                <span className={cn(
                  "px-2 py-1 text-xs rounded capitalize",
                  show.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                )}>
                  {show.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
