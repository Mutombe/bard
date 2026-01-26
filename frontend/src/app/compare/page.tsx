"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividend: number;
  beta: number;
  week52High: number;
  week52Low: number;
  avgVolume: number;
  revenue: number;
  netIncome: number;
  roe: number;
  debtEquity: number;
}

const stocksDatabase: Record<string, Stock> = {
  NPN: { symbol: "NPN", name: "Naspers Ltd", exchange: "JSE", price: 3245.67, change: 45.23, changePercent: 1.41, marketCap: 1250000, pe: 28.5, eps: 113.88, dividend: 0.8, beta: 1.2, week52High: 3580.00, week52Low: 2450.00, avgVolume: 2450000, revenue: 185000, netIncome: 45000, roe: 18.5, debtEquity: 0.35 },
  MTN: { symbol: "MTN", name: "MTN Group Ltd", exchange: "JSE", price: 156.78, change: -2.34, changePercent: -1.47, marketCap: 285000, pe: 12.3, eps: 12.75, dividend: 4.2, beta: 0.9, week52High: 185.00, week52Low: 120.00, avgVolume: 8900000, revenue: 210000, netIncome: 28000, roe: 22.4, debtEquity: 0.82 },
  SBK: { symbol: "SBK", name: "Standard Bank", exchange: "JSE", price: 189.45, change: 3.12, changePercent: 1.68, marketCap: 298000, pe: 10.2, eps: 18.57, dividend: 5.5, beta: 1.1, week52High: 210.00, week52Low: 145.00, avgVolume: 5600000, revenue: 125000, netIncome: 32000, roe: 16.8, debtEquity: 2.15 },
  FSR: { symbol: "FSR", name: "FirstRand Ltd", exchange: "JSE", price: 72.34, change: 1.23, changePercent: 1.73, marketCap: 405000, pe: 11.5, eps: 6.29, dividend: 4.9, beta: 1.0, week52High: 82.00, week52Low: 58.00, avgVolume: 7800000, revenue: 98000, netIncome: 38000, roe: 21.2, debtEquity: 1.95 },
  AGL: { symbol: "AGL", name: "Anglo American", exchange: "JSE", price: 567.34, change: -12.45, changePercent: -2.15, marketCap: 756000, pe: 8.9, eps: 63.75, dividend: 6.2, beta: 1.4, week52High: 720.00, week52Low: 420.00, avgVolume: 3200000, revenue: 435000, netIncome: 85000, roe: 14.5, debtEquity: 0.45 },
  SOL: { symbol: "SOL", name: "Sasol Ltd", exchange: "JSE", price: 234.56, change: 5.67, changePercent: 2.48, marketCap: 147000, pe: 7.5, eps: 31.27, dividend: 4.8, beta: 1.6, week52High: 320.00, week52Low: 180.00, avgVolume: 4100000, revenue: 290000, netIncome: 24000, roe: 12.3, debtEquity: 0.68 },
};

const popularComparisons = [
  { stocks: ["SBK", "FSR"], label: "Banking Giants" },
  { stocks: ["NPN", "MTN"], label: "Tech vs Telecom" },
  { stocks: ["AGL", "SOL"], label: "Mining vs Energy" },
];

export default function ComparePage() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(["SBK", "FSR"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const addStock = (symbol: string) => {
    if (selectedStocks.length < 4 && !selectedStocks.includes(symbol)) {
      setSelectedStocks([...selectedStocks, symbol]);
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const removeStock = (symbol: string) => {
    setSelectedStocks(selectedStocks.filter((s) => s !== symbol));
  };

  const availableStocks = Object.keys(stocksDatabase).filter(
    (symbol) =>
      !selectedStocks.includes(symbol) &&
      (symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stocksDatabase[symbol].name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}T`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}B`;
    return `${num}M`;
  };

  const compareStocks = selectedStocks.map((symbol) => stocksDatabase[symbol]);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-orange" />
            Compare Stocks
          </h1>
          <p className="text-muted-foreground">
            Side-by-side comparison of key metrics across African stocks.
          </p>
        </div>

        {/* Popular Comparisons */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Popular Comparisons</h3>
          <div className="flex flex-wrap gap-2">
            {popularComparisons.map((comp) => (
              <button
                key={comp.label}
                onClick={() => setSelectedStocks(comp.stocks)}
                className="px-3 py-1.5 text-sm bg-terminal-bg-secondary border border-terminal-border rounded-md hover:border-brand-orange transition-colors"
              >
                {comp.stocks.join(" vs ")} - {comp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Stocks */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {selectedStocks.map((symbol) => (
            <div
              key={symbol}
              className="flex items-center gap-2 px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md"
            >
              <Link href={`/companies/${symbol.toLowerCase()}`} className="font-mono font-semibold hover:text-brand-orange">
                {symbol}
              </Link>
              <button
                onClick={() => removeStock(symbol)}
                className="text-muted-foreground hover:text-market-down"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {selectedStocks.length < 4 && (
            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-terminal-border rounded-md text-muted-foreground hover:text-foreground hover:border-brand-orange transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Stock
              </button>
              {showSearch && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-terminal-bg-secondary border border-terminal-border rounded-md shadow-lg z-10">
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search stocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {availableStocks.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => addStock(symbol)}
                        className="w-full px-4 py-2 text-left hover:bg-terminal-bg-elevated"
                      >
                        <span className="font-mono font-semibold">{symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {stocksDatabase[symbol].name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {compareStocks.length > 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-terminal-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-48">Metric</th>
                  {compareStocks.map((stock) => (
                    <th key={stock.symbol} className="text-center p-4 min-w-[160px]">
                      <Link href={`/companies/${stock.symbol.toLowerCase()}`} className="hover:text-brand-orange">
                        <div className="font-mono font-bold text-lg">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border">
                {/* Price */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Price</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      R{stock.price.toFixed(2)}
                    </td>
                  ))}
                </tr>
                {/* Change */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Change</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center">
                      <span className={cn(
                        "flex items-center justify-center gap-1 font-mono",
                        stock.change >= 0 ? "text-market-up" : "text-market-down"
                      )}>
                        {stock.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Market Cap */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Market Cap</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      R{formatNumber(stock.marketCap)}
                    </td>
                  ))}
                </tr>
                {/* P/E Ratio */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">P/E Ratio</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      {stock.pe.toFixed(1)}x
                    </td>
                  ))}
                </tr>
                {/* EPS */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">EPS</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      R{stock.eps.toFixed(2)}
                    </td>
                  ))}
                </tr>
                {/* Dividend Yield */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Dividend Yield</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      {stock.dividend.toFixed(1)}%
                    </td>
                  ))}
                </tr>
                {/* Beta */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Beta</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      {stock.beta.toFixed(2)}
                    </td>
                  ))}
                </tr>
                {/* 52W High */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">52W High</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      R{stock.week52High.toFixed(2)}
                    </td>
                  ))}
                </tr>
                {/* 52W Low */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">52W Low</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      R{stock.week52Low.toFixed(2)}
                    </td>
                  ))}
                </tr>
                {/* ROE */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">ROE</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      {stock.roe.toFixed(1)}%
                    </td>
                  ))}
                </tr>
                {/* Debt/Equity */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Debt/Equity</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      {stock.debtEquity.toFixed(2)}x
                    </td>
                  ))}
                </tr>
                {/* Revenue */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Revenue (TTM)</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      R{formatNumber(stock.revenue)}
                    </td>
                  ))}
                </tr>
                {/* Net Income */}
                <tr className="hover:bg-terminal-bg-elevated">
                  <td className="p-4 text-sm text-muted-foreground">Net Income (TTM)</td>
                  {compareStocks.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-mono">
                      R{formatNumber(stock.netIncome)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {compareStocks.length === 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Add stocks to compare</h3>
            <p className="text-muted-foreground">
              Select up to 4 stocks to compare their key metrics side by side.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
