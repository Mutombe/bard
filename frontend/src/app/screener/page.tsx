"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Filter,
  Search,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Download,
  Star,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  dividend: number;
  volume: number;
}

const mockStocks: Stock[] = [
  { symbol: "NPN", name: "Naspers Ltd", exchange: "JSE", sector: "Technology", price: 3245.67, change: 45.23, changePercent: 1.41, marketCap: 1250000, pe: 28.5, dividend: 0.8, volume: 2450000 },
  { symbol: "MTN", name: "MTN Group Ltd", exchange: "JSE", sector: "Telecom", price: 156.78, change: -2.34, changePercent: -1.47, marketCap: 285000, pe: 12.3, dividend: 4.2, volume: 8900000 },
  { symbol: "DANGCEM", name: "Dangote Cement", exchange: "NGX", sector: "Materials", price: 275.50, change: 8.75, changePercent: 3.28, marketCap: 4690000, pe: 15.8, dividend: 3.1, volume: 1250000 },
  { symbol: "SBUX", name: "Standard Bank", exchange: "JSE", sector: "Financials", price: 189.45, change: 3.12, changePercent: 1.68, marketCap: 298000, pe: 10.2, dividend: 5.5, volume: 5600000 },
  { symbol: "AGL", name: "Anglo American", exchange: "JSE", sector: "Mining", price: 567.34, change: -12.45, changePercent: -2.15, marketCap: 756000, pe: 8.9, dividend: 6.2, volume: 3200000 },
  { symbol: "SOL", name: "Sasol Ltd", exchange: "JSE", sector: "Energy", price: 234.56, change: 5.67, changePercent: 2.48, marketCap: 147000, pe: 7.5, dividend: 4.8, volume: 4100000 },
  { symbol: "GTCO", name: "Guaranty Trust", exchange: "NGX", sector: "Financials", price: 42.30, change: 1.25, changePercent: 3.05, marketCap: 1240000, pe: 5.2, dividend: 8.1, volume: 15600000 },
  { symbol: "COMI", name: "Commercial Intl Bank", exchange: "EGX", sector: "Financials", price: 75.40, change: -0.85, changePercent: -1.11, marketCap: 89000, pe: 6.8, dividend: 3.5, volume: 2800000 },
  { symbol: "SCOM", name: "Safaricom", exchange: "NSE", sector: "Telecom", price: 28.50, change: 0.75, changePercent: 2.70, marketCap: 1140000, pe: 14.2, dividend: 5.8, volume: 18500000 },
  { symbol: "FSR", name: "FirstRand Ltd", exchange: "JSE", sector: "Financials", price: 72.34, change: 1.23, changePercent: 1.73, marketCap: 405000, pe: 11.5, dividend: 4.9, volume: 7800000 },
];

const exchanges = ["All Exchanges", "JSE", "NGX", "EGX", "NSE", "ZSE"];
const sectors = ["All Sectors", "Technology", "Financials", "Mining", "Energy", "Telecom", "Materials", "Healthcare", "Consumer"];

export default function ScreenerPage() {
  const [stocks, setStocks] = useState(mockStocks);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExchange, setSelectedExchange] = useState("All Exchanges");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [sortField, setSortField] = useState<keyof Stock>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter ranges
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [peMin, setPeMin] = useState("");
  const [peMax, setPeMax] = useState("");
  const [dividendMin, setDividendMin] = useState("");

  const handleSort = (field: keyof Stock) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedExchange("All Exchanges");
    setSelectedSector("All Sectors");
    setPriceMin("");
    setPriceMax("");
    setPeMin("");
    setPeMax("");
    setDividendMin("");
  };

  const filteredStocks = stocks
    .filter((stock) => {
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesExchange =
        selectedExchange === "All Exchanges" || stock.exchange === selectedExchange;
      const matchesSector =
        selectedSector === "All Sectors" || stock.sector === selectedSector;
      const matchesPriceMin = !priceMin || stock.price >= parseFloat(priceMin);
      const matchesPriceMax = !priceMax || stock.price <= parseFloat(priceMax);
      const matchesPeMin = !peMin || stock.pe >= parseFloat(peMin);
      const matchesPeMax = !peMax || stock.pe <= parseFloat(peMax);
      const matchesDividend = !dividendMin || stock.dividend >= parseFloat(dividendMin);

      return matchesSearch && matchesExchange && matchesSector &&
             matchesPriceMin && matchesPriceMax && matchesPeMin && matchesPeMax && matchesDividend;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const formatMarketCap = (cap: number) => {
    if (cap >= 1000000) return `${(cap / 1000000).toFixed(1)}T`;
    if (cap >= 1000) return `${(cap / 1000).toFixed(1)}B`;
    return `${cap}M`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Filter className="h-6 w-6 text-brand-orange" />
              Stock Screener
            </h1>
            <p className="text-muted-foreground">
              Filter and discover stocks across African markets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Symbol or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Exchange */}
              <div>
                <label className="block text-sm font-medium mb-2">Exchange</label>
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                >
                  {exchanges.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium mb-2">Sector</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                >
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* P/E Range */}
              <div>
                <label className="block text-sm font-medium mb-2">P/E Ratio</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={peMin}
                    onChange={(e) => setPeMin(e.target.value)}
                    className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={peMax}
                    onChange={(e) => setPeMax(e.target.value)}
                    className="flex-1 px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Dividend Yield */}
              <div>
                <label className="block text-sm font-medium mb-2">Min Dividend Yield %</label>
                <input
                  type="number"
                  placeholder="0"
                  value={dividendMin}
                  onChange={(e) => setDividendMin(e.target.value)}
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Results Count */}
              <div className="pt-4 border-t border-terminal-border">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{filteredStocks.length}</span> stocks
                </p>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="flex-1 overflow-hidden">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
                    <th className="text-left p-4">Symbol</th>
                    <th className="text-left p-4 hidden md:table-cell">Exchange</th>
                    <th className="text-left p-4 hidden lg:table-cell">Sector</th>
                    <th className="text-right p-4 cursor-pointer hover:text-foreground" onClick={() => handleSort("price")}>
                      <span className="flex items-center justify-end gap-1">
                        Price <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="text-right p-4 cursor-pointer hover:text-foreground" onClick={() => handleSort("changePercent")}>
                      <span className="flex items-center justify-end gap-1">
                        Change <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="text-right p-4 cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => handleSort("marketCap")}>
                      <span className="flex items-center justify-end gap-1">
                        Mkt Cap <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="text-right p-4 cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => handleSort("pe")}>
                      <span className="flex items-center justify-end gap-1">
                        P/E <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="text-right p-4 cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => handleSort("dividend")}>
                      <span className="flex items-center justify-end gap-1">
                        Div % <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="text-right p-4 hidden xl:table-cell">Volume</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border">
                  {filteredStocks.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-terminal-bg-elevated transition-colors">
                      <td className="p-4">
                        <Link href={`/companies/${stock.symbol.toLowerCase()}`} className="hover:text-brand-orange">
                          <div className="font-mono font-semibold">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground">{stock.name}</div>
                        </Link>
                      </td>
                      <td className="p-4 text-sm hidden md:table-cell">
                        <span className="px-2 py-1 bg-terminal-bg-elevated rounded text-xs">{stock.exchange}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{stock.sector}</td>
                      <td className="p-4 text-right font-mono">{stock.price.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={cn(
                          "flex items-center justify-end gap-1 font-mono",
                          stock.change >= 0 ? "text-market-up" : "text-market-down"
                        )}>
                          {stock.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-sm hidden md:table-cell">
                        {formatMarketCap(stock.marketCap)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm hidden lg:table-cell">
                        {stock.pe.toFixed(1)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm hidden lg:table-cell">
                        {stock.dividend.toFixed(1)}%
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-muted-foreground hidden xl:table-cell">
                        {formatVolume(stock.volume)}
                      </td>
                      <td className="p-4">
                        <button className="p-2 text-muted-foreground hover:text-brand-orange transition-colors">
                          <Star className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredStocks.length === 0 && (
                <div className="p-12 text-center">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No stocks found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
