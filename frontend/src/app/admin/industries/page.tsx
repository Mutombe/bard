"use client";

import { useState } from "react";
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
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock industries data
const mockIndustries = [
  { id: "1", name: "Banking & Financial Services", slug: "banking", articleCount: 342, companyCount: 142, featured: true, icon: "Landmark" },
  { id: "2", name: "Mining & Resources", slug: "mining", articleCount: 256, companyCount: 98, featured: true, icon: "Pickaxe" },
  { id: "3", name: "Technology & Fintech", slug: "technology", articleCount: 198, companyCount: 76, featured: true, icon: "Cpu" },
  { id: "4", name: "Agriculture & Agribusiness", slug: "agriculture", articleCount: 124, companyCount: 54, featured: false, icon: "Wheat" },
  { id: "5", name: "Infrastructure & Energy", slug: "infrastructure", articleCount: 167, companyCount: 67, featured: true, icon: "Building2" },
  { id: "6", name: "Telecommunications", slug: "telecommunications", articleCount: 145, companyCount: 38, featured: false, icon: "Radio" },
  { id: "7", name: "Real Estate & Construction", slug: "real-estate", articleCount: 89, companyCount: 45, featured: false, icon: "Home" },
  { id: "8", name: "Consumer Goods & Retail", slug: "consumer-goods", articleCount: 112, companyCount: 89, featured: false, icon: "ShoppingBag" },
  { id: "9", name: "Healthcare & Pharmaceuticals", slug: "healthcare", articleCount: 67, companyCount: 32, featured: false, icon: "Heart" },
  { id: "10", name: "Manufacturing", slug: "manufacturing", articleCount: 78, companyCount: 56, featured: false, icon: "Factory" },
];

export default function AdminIndustriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [industries] = useState(mockIndustries);

  const filteredIndustries = industries.filter((industry) =>
    industry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalArticles = industries.reduce((acc, i) => acc + i.articleCount, 0);
  const totalCompanies = industries.reduce((acc, i) => acc + i.companyCount, 0);

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
          <Building2 className="h-5 w-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{totalCompanies.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Companies</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <FileText className="h-5 w-5 text-amber-400 mb-2" />
          <div className="text-2xl font-bold">{totalArticles.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Articles</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Star className="h-5 w-5 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold">{industries.filter(i => i.featured).length}</div>
          <div className="text-sm text-muted-foreground">Featured</div>
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
        <table className="w-full">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Industry</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Companies</th>
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
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Factory className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{industry.name}</div>
                      <div className="text-xs text-muted-foreground">/industries/{industry.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {industry.companyCount}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {industry.articleCount}
                </td>
                <td className="px-4 py-3">
                  {industry.featured ? (
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ) : (
                    <Star className="h-4 w-4 text-muted-foreground" />
                  )}
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
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        {industry.featured ? "Remove Featured" : "Set Featured"}
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

        {filteredIndustries.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No industries found</p>
          </div>
        )}
      </div>
    </div>
  );
}
