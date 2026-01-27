"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import { useCompanies, useExchanges, useSectors } from "@/hooks";

const exchangeFilters = [
  { id: "all", label: "All Exchanges" },
  { id: "JSE", label: "JSE" },
  { id: "NSE", label: "NGX" },
  { id: "EGX", label: "EGX" },
  { id: "BRVM", label: "BRVM" },
  { id: "BSE", label: "BSE" },
  { id: "ZSE", label: "ZSE" },
];

type SortField = "symbol" | "current_price" | "price_change_percent" | "market_cap" | "volume";
type SortDirection = "asc" | "desc";

function CompanyRowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border animate-pulse">
      <div className="col-span-3">
        <Skeleton className="h-5 w-16 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="col-span-2 flex justify-center">
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="col-span-2 flex justify-end">
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="col-span-2 flex justify-end">
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="col-span-1 flex justify-end">
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="col-span-2 flex justify-end">
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("market_cap");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  // Fetch companies from API
  const { data: companiesData, isLoading, error } = useCompanies({
    exchange: selectedExchange !== "all" ? selectedExchange : undefined,
    search: searchQuery || undefined,
    ordering: `${sortDirection === "desc" ? "-" : ""}${sortField}`,
    page,
    page_size: 20,
  });

  const companies = companiesData?.results || [];
  const totalCount = companiesData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1); // Reset to first page on sort change
  };

  const handleExchangeChange = (exchange: string) => {
    setSelectedExchange(exchange);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const formatMarketCap = (marketCap: number | null) => {
    if (!marketCap) return "-";
    if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `${(marketCap / 1e6).toFixed(2)}M`;
    return marketCap.toLocaleString();
  };

  const formatVolume = (volume: number | null) => {
    if (!volume) return "-";
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toLocaleString();
  };

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-brand-orange" />
              Companies
            </h1>
            <p className="text-muted-foreground">
              Browse and analyze companies listed on African exchanges
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Exchange Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {exchangeFilters.map((exchange) => (
            <button
              key={exchange.id}
              onClick={() => handleExchangeChange(exchange.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedExchange === exchange.id
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {exchange.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">Failed to load companies. Please try again.</p>
          </div>
        )}

        {/* Companies Table */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <button
              onClick={() => handleSort("symbol")}
              className="col-span-3 flex items-center gap-1 hover:text-foreground"
            >
              Company
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <div className="col-span-2 text-center">Exchange</div>
            <button
              onClick={() => handleSort("current_price")}
              className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground"
            >
              Price
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleSort("price_change_percent")}
              className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground"
            >
              Change
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleSort("volume")}
              className="col-span-1 text-right hidden md:flex items-center justify-end gap-1 hover:text-foreground"
            >
              Volume
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleSort("market_cap")}
              className="col-span-2 text-right hidden lg:flex items-center justify-end gap-1 hover:text-foreground"
            >
              Mkt Cap
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-terminal-border">
            {isLoading ? (
              // Loading skeletons
              [...Array(10)].map((_, i) => <CompanyRowSkeleton key={i} />)
            ) : companies.length > 0 ? (
              companies.map((company: any) => {
                const price = Number(company.current_price) || 0;
                const change = Number(company.price_change) || 0;
                const changePercent = Number(company.price_change_percent) || 0;
                const isUp = change >= 0;

                return (
                  <Link
                    key={company.id || company.symbol}
                    href={`/companies/${company.symbol?.toLowerCase()}`}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
                  >
                    <div className="col-span-3">
                      <div className="font-mono font-semibold">{company.symbol}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {company.name || company.short_name}
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded">
                        {company.exchange_code || company.exchange?.code || "-"}
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {price.toFixed(2)}
                    </div>
                    <div
                      className={cn(
                        "col-span-2 text-right flex items-center justify-end gap-1",
                        isUp ? "text-market-up" : "text-market-down"
                      )}
                    >
                      {isUp ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-mono">
                        {isUp ? "+" : ""}
                        {changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="col-span-1 text-right hidden md:block text-sm font-mono">
                      {formatVolume(company.volume)}
                    </div>
                    <div className="col-span-2 text-right hidden lg:block text-sm">
                      {formatMarketCap(company.market_cap)}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-medium mb-2">No companies found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "No companies available for this exchange"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {companies.length} of {totalCount} companies
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || isLoading}
                className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
