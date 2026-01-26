"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Company {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  dividend: number;
  volume: string;
}

const sectors = [
  { id: "all", label: "All Sectors" },
  { id: "banking", label: "Banking" },
  { id: "mining", label: "Mining" },
  { id: "technology", label: "Technology" },
  { id: "telecom", label: "Telecommunications" },
  { id: "retail", label: "Retail" },
  { id: "energy", label: "Energy" },
  { id: "industrial", label: "Industrial" },
];

const companies: Company[] = [
  { symbol: "NPN", name: "Naspers Ltd", exchange: "JSE", sector: "Technology", price: 3245.67, change: 89.34, changePercent: 2.83, marketCap: "R1.2T", peRatio: 18.5, dividend: 0.8, volume: "1.2M" },
  { symbol: "AGL", name: "Anglo American Plc", exchange: "JSE", sector: "Mining", price: 567.34, change: 45.67, changePercent: 8.75, marketCap: "R756B", peRatio: 12.3, dividend: 4.2, volume: "890K" },
  { symbol: "MTN", name: "MTN Group Ltd", exchange: "JSE", sector: "Telecommunications", price: 156.78, change: 9.45, changePercent: 6.41, marketCap: "R285B", peRatio: 14.2, dividend: 5.1, volume: "2.3M" },
  { symbol: "SBK", name: "Standard Bank Group", exchange: "JSE", sector: "Banking", price: 189.45, change: 8.67, changePercent: 4.80, marketCap: "R298B", peRatio: 9.8, dividend: 6.2, volume: "1.5M" },
  { symbol: "SOL", name: "Sasol Ltd", exchange: "JSE", sector: "Energy", price: 267.89, change: -5.67, changePercent: -2.07, marketCap: "R168B", peRatio: 8.5, dividend: 3.8, volume: "780K" },
  { symbol: "FSR", name: "FirstRand Ltd", exchange: "JSE", sector: "Banking", price: 67.89, change: 2.34, changePercent: 3.57, marketCap: "R380B", peRatio: 11.2, dividend: 5.8, volume: "3.2M" },
  { symbol: "BHP", name: "BHP Group Ltd", exchange: "JSE", sector: "Mining", price: 456.78, change: -12.34, changePercent: -2.63, marketCap: "R890B", peRatio: 10.5, dividend: 5.5, volume: "560K" },
  { symbol: "VOD", name: "Vodacom Group Ltd", exchange: "JSE", sector: "Telecommunications", price: 98.45, change: -1.23, changePercent: -1.23, marketCap: "R180B", peRatio: 13.8, dividend: 6.8, volume: "1.8M" },
  { symbol: "SHP", name: "Shoprite Holdings", exchange: "JSE", sector: "Retail", price: 234.56, change: 5.67, changePercent: 2.48, marketCap: "R132B", peRatio: 22.5, dividend: 2.1, volume: "920K" },
  { symbol: "ABG", name: "Absa Group Ltd", exchange: "JSE", sector: "Banking", price: 156.78, change: -3.45, changePercent: -2.15, marketCap: "R132B", peRatio: 8.9, dividend: 6.5, volume: "1.1M" },
  { symbol: "DANGCEM", name: "Dangote Cement Plc", exchange: "NGX", sector: "Industrial", price: 289.50, change: 4.50, changePercent: 1.58, marketCap: "₦4.9T", peRatio: 15.2, dividend: 3.2, volume: "3.4M" },
  { symbol: "MTNN", name: "MTN Nigeria", exchange: "NGX", sector: "Telecommunications", price: 245.60, change: -3.40, changePercent: -1.37, marketCap: "₦5.0T", peRatio: 16.8, dividend: 4.5, volume: "5.6M" },
];

type SortField = "symbol" | "price" | "changePercent" | "marketCap" | "peRatio";
type SortDirection = "asc" | "desc";

export default function CompaniesPage() {
  const [selectedSector, setSelectedSector] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("marketCap");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredCompanies = companies
    .filter((company) => {
      const matchesSector =
        selectedSector === "all" ||
        company.sector.toLowerCase() === selectedSector;
      const matchesSearch =
        searchQuery === "" ||
        company.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSector && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {sectors.map((sector) => (
            <button
              key={sector.id}
              onClick={() => setSelectedSector(sector.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedSector === sector.id
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {sector.label}
            </button>
          ))}
        </div>

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
              onClick={() => handleSort("price")}
              className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground"
            >
              Price
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleSort("changePercent")}
              className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground"
            >
              Change
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <div className="col-span-1 text-right hidden md:block">P/E</div>
            <div className="col-span-2 text-right hidden lg:block">Mkt Cap</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-terminal-border">
            {filteredCompanies.map((company) => {
              const isUp = company.change >= 0;

              return (
                <Link
                  key={company.symbol}
                  href={`/companies/${company.symbol.toLowerCase()}`}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
                >
                  <div className="col-span-3">
                    <div className="font-mono font-semibold">{company.symbol}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {company.name}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded">
                      {company.exchange}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-mono">
                    {company.price.toFixed(2)}
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
                      {company.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="col-span-1 text-right hidden md:block text-sm">
                    {company.peRatio.toFixed(1)}
                  </div>
                  <div className="col-span-2 text-right hidden lg:block text-sm">
                    {company.marketCap}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCompanies.length} of {companies.length} companies
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
