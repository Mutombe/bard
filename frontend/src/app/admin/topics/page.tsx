"use client";

import { useState } from "react";
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
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock topics data
const mockTopics = [
  { id: "1", name: "Central Banks & Monetary Policy", slug: "central-banks", articleCount: 156, featured: true, description: "Coverage of SARB, CBN, CBK, and other African central banks" },
  { id: "2", name: "Fintech & Digital Finance", slug: "fintech", articleCount: 243, featured: true, description: "Mobile money, digital banking, and fintech innovation" },
  { id: "3", name: "Trade Policy & AfCFTA", slug: "trade-policy", articleCount: 89, featured: true, description: "African Continental Free Trade Area and trade agreements" },
  { id: "4", name: "Commodities & Resources", slug: "commodities", articleCount: 178, featured: false, description: "Gold, oil, platinum, agricultural commodities" },
  { id: "5", name: "Sustainable Finance & ESG", slug: "sustainability", articleCount: 67, featured: true, description: "Green bonds, climate finance, ESG investing" },
  { id: "6", name: "Private Equity & Venture Capital", slug: "private-equity", articleCount: 92, featured: false, description: "PE deals, VC funding, startup investments" },
  { id: "7", name: "Foreign Direct Investment", slug: "fdi", articleCount: 54, featured: false, description: "FDI flows, investment treaties, country analysis" },
  { id: "8", name: "Cryptocurrency & Blockchain", slug: "crypto", articleCount: 45, featured: false, description: "Digital assets, DeFi, blockchain adoption" },
];

export default function AdminTopicsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [topics] = useState(mockTopics);
  const [showNewModal, setShowNewModal] = useState(false);

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Topic
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold">{topics.length}</div>
          <div className="text-sm text-muted-foreground">Total Topics</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold text-primary">{topics.filter(t => t.featured).length}</div>
          <div className="text-sm text-muted-foreground">Featured</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold">{topics.reduce((acc, t) => acc + t.articleCount, 0).toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Articles</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="text-2xl font-bold">{Math.round(topics.reduce((acc, t) => acc + t.articleCount, 0) / topics.length)}</div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-5 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                {topic.featured && (
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
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {topic.featured ? "Remove Featured" : "Set Featured"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 text-red-400">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="font-semibold mb-1">{topic.name}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{topic.description}</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <FileText className="h-4 w-4 inline mr-1" />
                {topic.articleCount} articles
              </span>
              <Link
                href={`/topics/${topic.slug}`}
                className="text-primary hover:text-primary/80"
              >
                View →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No topics found</p>
        </div>
      )}
    </div>
  );
}
