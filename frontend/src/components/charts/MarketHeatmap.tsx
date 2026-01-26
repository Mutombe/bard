"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Grid3X3,
  List,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeatmapStock {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface MarketHeatmapProps {
  stocks: HeatmapStock[];
  className?: string;
}

type ViewMode = "heatmap" | "list";
type SortBy = "marketCap" | "changePercent" | "volume" | "name";
type FilterBy = "all" | "gainers" | "losers";

export function MarketHeatmap({ stocks, className }: MarketHeatmapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [sortBy, setSortBy] = useState<SortBy>("marketCap");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [selectedStock, setSelectedStock] = useState<HeatmapStock | null>(null);

  const filteredAndSortedStocks = useMemo(() => {
    let result = [...stocks];

    // Filter
    if (filterBy === "gainers") {
      result = result.filter((s) => s.changePercent > 0);
    } else if (filterBy === "losers") {
      result = result.filter((s) => s.changePercent < 0);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "marketCap":
          return b.marketCap - a.marketCap;
        case "changePercent":
          return b.changePercent - a.changePercent;
        case "volume":
          return b.volume - a.volume;
        case "name":
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });

    return result;
  }, [stocks, sortBy, filterBy]);

  // Group by sector for heatmap
  const sectorGroups = useMemo(() => {
    const groups = new Map<string, HeatmapStock[]>();
    filteredAndSortedStocks.forEach((stock) => {
      const existing = groups.get(stock.sector) || [];
      existing.push(stock);
      groups.set(stock.sector, existing);
    });
    return Array.from(groups.entries()).sort((a, b) => {
      const aMarketCap = a[1].reduce((sum, s) => sum + s.marketCap, 0);
      const bMarketCap = b[1].reduce((sum, s) => sum + s.marketCap, 0);
      return bMarketCap - aMarketCap;
    });
  }, [filteredAndSortedStocks]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Market Heatmap</h3>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-1" />
                {filterBy === "all" ? "All" : filterBy === "gainers" ? "Gainers" : "Losers"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterBy("all")}>
                All Stocks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("gainers")}>
                <TrendingUp className="h-4 w-4 mr-2 text-up" />
                Gainers Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("losers")}>
                <TrendingDown className="h-4 w-4 mr-2 text-down" />
                Losers Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Sort: {sortBy === "marketCap" ? "Cap" : sortBy === "changePercent" ? "Change" : sortBy === "volume" ? "Vol" : "Name"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("marketCap")}>
                Market Cap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("changePercent")}>
                % Change
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("volume")}>
                Volume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode */}
          <div className="flex items-center gap-1 p-1 bg-terminal-elevated rounded-md">
            <Button
              variant={viewMode === "heatmap" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("heatmap")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "heatmap" ? (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {sectorGroups.map(([sector, sectorStocks]) => (
              <div key={sector}>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {sector}
                </div>
                <div className="flex flex-wrap gap-1">
                  {sectorStocks.map((stock) => (
                    <HeatmapTile
                      key={stock.symbol}
                      stock={stock}
                      maxMarketCap={Math.max(...sectorStocks.map((s) => s.marketCap))}
                      isSelected={selectedStock?.symbol === stock.symbol}
                      onClick={() => setSelectedStock(
                        selectedStock?.symbol === stock.symbol ? null : stock
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="card-terminal divide-y divide-border">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 p-3 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Symbol</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Change</div>
                <div className="col-span-2 text-right">Volume</div>
                <div className="col-span-3 text-right">Market Cap</div>
              </div>

              {/* Rows */}
              {filteredAndSortedStocks.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-12 gap-4 p-3 hover:bg-terminal-elevated transition-colors cursor-pointer"
                  onClick={() => setSelectedStock(
                    selectedStock?.symbol === stock.symbol ? null : stock
                  )}
                >
                  <div className="col-span-3">
                    <div className="font-mono font-medium">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {stock.name}
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-mono tabular-nums">
                    ${stock.price.toFixed(2)}
                  </div>
                  <div className={cn(
                    "col-span-2 text-right font-mono tabular-nums",
                    stock.changePercent >= 0 ? "text-up" : "text-down"
                  )}>
                    {stock.changePercent >= 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right font-mono tabular-nums text-muted-foreground">
                    {formatVolume(stock.volume)}
                  </div>
                  <div className="col-span-3 text-right font-mono tabular-nums text-muted-foreground">
                    {formatMarketCap(stock.marketCap)}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Stock Detail */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card-terminal p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono">{selectedStock.symbol}</span>
                    <span className="text-sm text-muted-foreground">{selectedStock.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedStock.sector}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono tabular-nums">
                    ${selectedStock.price.toFixed(2)}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 justify-end text-sm font-mono",
                    selectedStock.changePercent >= 0 ? "text-up" : "text-down"
                  )}>
                    {selectedStock.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {selectedStock.changePercent >= 0 ? "+" : ""}
                    {selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                  <div className="font-mono tabular-nums">{formatMarketCap(selectedStock.marketCap)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="font-mono tabular-nums">{formatVolume(selectedStock.volume)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sector</div>
                  <div className="font-mono">{selectedStock.sector}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600" />
          <span>&lt; -3%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/70" />
          <span>-3% to -1%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted" />
          <span>-1% to +1%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/70" />
          <span>+1% to +3%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span>&gt; +3%</span>
        </div>
      </div>
    </div>
  );
}

interface HeatmapTileProps {
  stock: HeatmapStock;
  maxMarketCap: number;
  isSelected: boolean;
  onClick: () => void;
}

function HeatmapTile({ stock, maxMarketCap, isSelected, onClick }: HeatmapTileProps) {
  // Calculate size based on market cap (min 60px, max 150px)
  const sizeRatio = stock.marketCap / maxMarketCap;
  const size = Math.max(60, Math.min(150, 60 + sizeRatio * 90));

  // Calculate color based on change percent
  const getBackgroundColor = (change: number) => {
    if (change < -3) return "bg-red-600";
    if (change < -1) return "bg-red-500/70";
    if (change < 1) return "bg-muted";
    if (change < 3) return "bg-green-500/70";
    return "bg-green-600";
  };

  return (
    <motion.button
      className={cn(
        "relative flex flex-col items-center justify-center rounded transition-all",
        getBackgroundColor(stock.changePercent),
        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      )}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <span className="font-mono font-bold text-xs text-white drop-shadow-sm">
        {stock.symbol}
      </span>
      <span className="font-mono text-[10px] text-white/80">
        {stock.changePercent >= 0 ? "+" : ""}
        {stock.changePercent.toFixed(1)}%
      </span>
    </motion.button>
  );
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}
