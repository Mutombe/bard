"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Globe,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  Eye,
  Star,
  Building2,
  MapPin,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock regions data
const mockRegions = [
  { id: "1", name: "Southern Africa", slug: "southern-africa", countries: ["South Africa", "Botswana", "Zimbabwe", "Namibia", "Mozambique"], articleCount: 456, companyCount: 234, featured: true },
  { id: "2", name: "East Africa", slug: "east-africa", countries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia"], articleCount: 312, companyCount: 156, featured: true },
  { id: "3", name: "West Africa", slug: "west-africa", countries: ["Nigeria", "Ghana", "Senegal", "Ivory Coast", "Cameroon"], articleCount: 389, companyCount: 198, featured: true },
  { id: "4", name: "North Africa", slug: "north-africa", countries: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya"], articleCount: 234, companyCount: 112, featured: true },
  { id: "5", name: "Central Africa", slug: "central-africa", countries: ["DRC", "Angola", "Gabon", "Congo", "CAR"], articleCount: 145, companyCount: 67, featured: false },
];

// Mock countries data
const mockCountries = [
  { id: "1", name: "South Africa", code: "ZA", region: "Southern Africa", articleCount: 234, companyCount: 142, featured: true },
  { id: "2", name: "Nigeria", code: "NG", region: "West Africa", articleCount: 198, companyCount: 98, featured: true },
  { id: "3", name: "Kenya", code: "KE", region: "East Africa", articleCount: 156, companyCount: 76, featured: true },
  { id: "4", name: "Egypt", code: "EG", region: "North Africa", articleCount: 145, companyCount: 67, featured: true },
  { id: "5", name: "Ghana", code: "GH", region: "West Africa", articleCount: 89, companyCount: 45, featured: false },
  { id: "6", name: "Morocco", code: "MA", region: "North Africa", articleCount: 78, companyCount: 38, featured: false },
  { id: "7", name: "Tanzania", code: "TZ", region: "East Africa", articleCount: 67, companyCount: 32, featured: false },
  { id: "8", name: "Ethiopia", code: "ET", region: "East Africa", articleCount: 56, companyCount: 28, featured: false },
];

type ViewMode = "regions" | "countries";

export default function AdminRegionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("regions");
  const [regions] = useState(mockRegions);
  const [countries] = useState(mockCountries);

  const filteredRegions = regions.filter((region) =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalArticles = regions.reduce((acc, r) => acc + r.articleCount, 0);
  const totalCompanies = regions.reduce((acc, r) => acc + r.companyCount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Regions & Countries</h1>
          <p className="text-muted-foreground">
            Manage geographic coverage and regional classifications
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {viewMode === "regions" ? "New Region" : "New Country"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Globe className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{regions.length}</div>
          <div className="text-sm text-muted-foreground">Regions</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Flag className="h-5 w-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{countries.length}</div>
          <div className="text-sm text-muted-foreground">Countries</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <FileText className="h-5 w-5 text-amber-400 mb-2" />
          <div className="text-2xl font-bold">{totalArticles.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Articles</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Building2 className="h-5 w-5 text-green-400 mb-2" />
          <div className="text-2xl font-bold">{totalCompanies.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Companies</div>
        </div>
      </div>

      {/* View Toggle & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex bg-terminal-bg-secondary rounded-lg border border-terminal-border p-1">
          <button
            onClick={() => setViewMode("regions")}
            className={cn(
              "px-4 py-2 rounded-md text-sm transition-colors",
              viewMode === "regions"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Regions
          </button>
          <button
            onClick={() => setViewMode("countries")}
            className={cn(
              "px-4 py-2 rounded-md text-sm transition-colors",
              viewMode === "countries"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Countries
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={viewMode === "regions" ? "Search regions..." : "Search countries..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Regions View */}
      {viewMode === "regions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRegions.map((region) => (
            <div
              key={region.id}
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {region.featured && (
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-terminal-bg-elevated rounded">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/regions/${region.slug}`} className="flex items-center gap-2">
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
                      {region.featured ? "Remove Featured" : "Set Featured"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 text-red-400">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold mb-2">{region.name}</h3>

              <div className="flex flex-wrap gap-1 mb-3">
                {region.countries.slice(0, 4).map((country) => (
                  <span
                    key={country}
                    className="px-2 py-0.5 text-xs bg-terminal-bg rounded border border-terminal-border"
                  >
                    {country}
                  </span>
                ))}
                {region.countries.length > 4 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                    +{region.countries.length - 4} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {region.articleCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {region.companyCount}
                  </span>
                </div>
                <Link
                  href={`/regions/${region.slug}`}
                  className="text-primary hover:text-primary/80"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Countries View */}
      {viewMode === "countries" && (
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-terminal-border">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Country</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Region</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Companies</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Articles</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Featured</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {filteredCountries.map((country) => (
                <tr key={country.id} className="hover:bg-terminal-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {country.code}
                      </div>
                      <div>
                        <div className="font-medium">{country.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{country.region}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 text-xs bg-terminal-bg rounded border border-terminal-border">
                      {country.region}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {country.companyCount}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {country.articleCount}
                  </td>
                  <td className="px-4 py-3">
                    {country.featured ? (
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
                          <Link href={`/countries/${country.code.toLowerCase()}`} className="flex items-center gap-2">
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
                          {country.featured ? "Remove Featured" : "Set Featured"}
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

          {filteredCountries.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No countries found</p>
            </div>
          )}
        </div>
      )}

      {viewMode === "regions" && filteredRegions.length === 0 && (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No regions found</p>
        </div>
      )}
    </div>
  );
}
