"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { geographyService, Region, Country } from "@/services/api/geography";
import { toast } from "sonner";

type ViewMode = "regions" | "countries";

export default function AdminRegionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("regions");
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditCountry, setShowEditCountry] = useState<Country | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regionsData, countriesData] = await Promise.all([
        geographyService.getRegions(),
        geographyService.getCountries(),
      ]);
      setRegions(regionsData);
      setCountries(countriesData);
    } catch (error) {
      console.error("Failed to fetch geography data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredRegions = regions.filter((region) =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (country.region_display || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle country featured
  const handleToggleCountryFeatured = async (country: Country) => {
    try {
      await geographyService.updateCountry(country.code, {
        is_featured: !country.is_featured,
      });
      toast.success(country.is_featured ? "Removed from featured" : "Added to featured");
      fetchData();
    } catch (error) {
      toast.error("Failed to update country");
    }
  };

  // Get stats
  const totalExchanges = regions.reduce((acc, r) => acc + (r.exchange_count || 0), 0);
  const totalPopulation = regions.reduce((acc, r) => acc + (r.total_population || 0), 0);

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
          <Building2 className="h-5 w-5 text-amber-400 mb-2" />
          <div className="text-2xl font-bold">{totalExchanges}</div>
          <div className="text-sm text-muted-foreground">Exchanges</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <Star className="h-5 w-5 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold">{countries.filter(c => c.is_featured).length}</div>
          <div className="text-sm text-muted-foreground">Featured Countries</div>
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

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Regions View */}
          {viewMode === "regions" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRegions.map((region) => (
                <div
                  key={region.code}
                  className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 hover:bg-terminal-bg-elevated rounded">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/regions/${region.code.toLowerCase()}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View Page
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold mb-2">{region.name}</h3>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {region.countries?.slice(0, 4).map((country) => (
                      <span
                        key={country.code}
                        className="px-2 py-0.5 text-xs bg-terminal-bg rounded border border-terminal-border"
                      >
                        {country.flag_emoji} {country.name}
                      </span>
                    ))}
                    {region.countries && region.countries.length > 4 && (
                      <span className="px-2 py-0.5 text-xs text-muted-foreground">
                        +{region.countries.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        {region.country_count} countries
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {region.exchange_count || 0} exchanges
                      </span>
                    </div>
                    <Link
                      href={`/regions/${region.code.toLowerCase()}`}
                      className="text-primary hover:text-primary/80"
                    >
                      View
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
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Currency</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Featured</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border">
                  {filteredCountries.map((country) => (
                    <tr key={country.id} className="hover:bg-terminal-bg-elevated transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-lg">
                            {country.flag_emoji || country.code}
                          </div>
                          <div>
                            <div className="font-medium">{country.name}</div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {country.region_display}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2 py-1 text-xs bg-terminal-bg rounded border border-terminal-border">
                          {country.region_display || country.region}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {country.currency_code} ({country.currency_symbol})
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleCountryFeatured(country)}>
                          {country.is_featured ? (
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
                              <Link href={`/countries/${country.code.toLowerCase()}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Page
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleToggleCountryFeatured(country)}
                            >
                              <Star className="h-4 w-4" />
                              {country.is_featured ? "Remove Featured" : "Set Featured"}
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
        </>
      )}
    </div>
  );
}
