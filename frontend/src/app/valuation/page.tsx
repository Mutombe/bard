"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Search,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  eps: number;
  bookValue: number;
  dividend: number;
  growthRate: number;
}

const stocksDatabase: Record<string, Stock> = {
  NPN: { symbol: "NPN", name: "Naspers Ltd", price: 3245.67, eps: 113.88, bookValue: 2150.00, dividend: 26.00, growthRate: 12.5 },
  MTN: { symbol: "MTN", name: "MTN Group Ltd", price: 156.78, eps: 12.75, bookValue: 85.40, dividend: 6.58, growthRate: 8.2 },
  SBK: { symbol: "SBK", name: "Standard Bank", price: 189.45, eps: 18.57, bookValue: 125.30, dividend: 10.42, growthRate: 6.5 },
  FSR: { symbol: "FSR", name: "FirstRand Ltd", price: 72.34, eps: 6.29, bookValue: 42.80, dividend: 3.54, growthRate: 7.8 },
  AGL: { symbol: "AGL", name: "Anglo American", price: 567.34, eps: 63.75, bookValue: 380.00, dividend: 35.18, growthRate: 4.5 },
  SOL: { symbol: "SOL", name: "Sasol Ltd", price: 234.56, eps: 31.27, bookValue: 195.00, dividend: 11.26, growthRate: 5.2 },
};

export default function ValuationPage() {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(stocksDatabase.NPN);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // User inputs for DCF
  const [discountRate, setDiscountRate] = useState("10");
  const [terminalGrowth, setTerminalGrowth] = useState("3");
  const [growthYears, setGrowthYears] = useState("5");

  // User inputs for comparable
  const [targetPE, setTargetPE] = useState("15");
  const [targetPB, setTargetPB] = useState("2.5");

  const selectStock = (symbol: string) => {
    setSelectedStock(stocksDatabase[symbol]);
    setShowSearch(false);
    setSearchQuery("");
  };

  const availableStocks = Object.keys(stocksDatabase).filter(
    (symbol) =>
      symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stocksDatabase[symbol].name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate DCF value
  const calculateDCF = () => {
    if (!selectedStock) return 0;
    const r = parseFloat(discountRate) / 100;
    const g = selectedStock.growthRate / 100;
    const tg = parseFloat(terminalGrowth) / 100;
    const years = parseInt(growthYears);

    let pvCashFlows = 0;
    let cashFlow = selectedStock.eps;

    for (let i = 1; i <= years; i++) {
      cashFlow = cashFlow * (1 + g);
      pvCashFlows += cashFlow / Math.pow(1 + r, i);
    }

    // Terminal value
    const terminalCashFlow = cashFlow * (1 + tg);
    const terminalValue = terminalCashFlow / (r - tg);
    const pvTerminal = terminalValue / Math.pow(1 + r, years);

    return pvCashFlows + pvTerminal;
  };

  // Calculate PE-based fair value
  const calculatePEValue = () => {
    if (!selectedStock) return 0;
    return selectedStock.eps * parseFloat(targetPE);
  };

  // Calculate PB-based fair value
  const calculatePBValue = () => {
    if (!selectedStock) return 0;
    return selectedStock.bookValue * parseFloat(targetPB);
  };

  // Calculate DDM value
  const calculateDDM = () => {
    if (!selectedStock || selectedStock.dividend === 0) return 0;
    const r = parseFloat(discountRate) / 100;
    const g = parseFloat(terminalGrowth) / 100;
    return selectedStock.dividend * (1 + g) / (r - g);
  };

  const dcfValue = calculateDCF();
  const peValue = calculatePEValue();
  const pbValue = calculatePBValue();
  const ddmValue = calculateDDM();
  const avgFairValue = (dcfValue + peValue + pbValue + (ddmValue > 0 ? ddmValue : peValue)) / (ddmValue > 0 ? 4 : 3);

  const getUpsideDownside = (fairValue: number) => {
    if (!selectedStock) return 0;
    return ((fairValue - selectedStock.price) / selectedStock.price) * 100;
  };

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-brand-orange" />
            Stock Valuation Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate fair value using multiple valuation methodologies.
          </p>
        </div>

        {/* Stock Selector */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Select Stock</h2>
            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center gap-2 px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md hover:border-brand-orange transition-colors"
              >
                <Search className="h-4 w-4" />
                {selectedStock ? selectedStock.symbol : "Select"}
              </button>
              {showSearch && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-terminal-bg-secondary border border-terminal-border rounded-md shadow-lg z-10">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search stocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {availableStocks.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => selectStock(symbol)}
                        className={cn(
                          "w-full px-4 py-2 text-left hover:bg-terminal-bg-elevated",
                          selectedStock?.symbol === symbol && "bg-brand-orange/20"
                        )}
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
          </div>

          {selectedStock && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-terminal-bg-elevated rounded-md">
                <div className="text-xs text-muted-foreground">Current Price</div>
                <div className="text-lg font-mono font-semibold">R{selectedStock.price.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-terminal-bg-elevated rounded-md">
                <div className="text-xs text-muted-foreground">EPS</div>
                <div className="text-lg font-mono font-semibold">R{selectedStock.eps.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-terminal-bg-elevated rounded-md">
                <div className="text-xs text-muted-foreground">Book Value</div>
                <div className="text-lg font-mono font-semibold">R{selectedStock.bookValue.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-terminal-bg-elevated rounded-md">
                <div className="text-xs text-muted-foreground">Dividend</div>
                <div className="text-lg font-mono font-semibold">R{selectedStock.dividend.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Parameters */}
          <div className="space-y-6">
            {/* DCF Inputs */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                DCF Parameters
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Discount Rate (%)</label>
                  <input
                    type="number"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Terminal Growth Rate (%)</label>
                  <input
                    type="number"
                    value={terminalGrowth}
                    onChange={(e) => setTerminalGrowth(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Growth Period (Years)</label>
                  <input
                    type="number"
                    value={growthYears}
                    onChange={(e) => setGrowthYears(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Comparable Inputs */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                Comparable Parameters
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Target P/E Multiple</label>
                  <input
                    type="number"
                    value={targetPE}
                    onChange={(e) => setTargetPE(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Target P/B Multiple</label>
                  <input
                    type="number"
                    value={targetPB}
                    onChange={(e) => setTargetPB(e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Fair Value Summary */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Valuation Summary</h3>

              {selectedStock && (
                <>
                  <div className="p-4 bg-brand-orange/10 border border-brand-orange/30 rounded-lg mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Average Fair Value</div>
                    <div className="text-3xl font-mono font-bold text-brand-orange">
                      R{avgFairValue.toFixed(2)}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 mt-2",
                      getUpsideDownside(avgFairValue) >= 0 ? "text-market-up" : "text-market-down"
                    )}>
                      {getUpsideDownside(avgFairValue) >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {getUpsideDownside(avgFairValue) >= 0 ? "+" : ""}
                        {getUpsideDownside(avgFairValue).toFixed(1)}% vs current price
                      </span>
                    </div>
                  </div>

                  {/* Individual Valuations */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-terminal-bg-elevated rounded-md">
                      <div>
                        <div className="font-medium">DCF Model</div>
                        <div className="text-xs text-muted-foreground">Discounted Cash Flow</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">R{dcfValue.toFixed(2)}</div>
                        <div className={cn(
                          "text-xs",
                          getUpsideDownside(dcfValue) >= 0 ? "text-market-up" : "text-market-down"
                        )}>
                          {getUpsideDownside(dcfValue) >= 0 ? "+" : ""}{getUpsideDownside(dcfValue).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-terminal-bg-elevated rounded-md">
                      <div>
                        <div className="font-medium">P/E Based</div>
                        <div className="text-xs text-muted-foreground">Price to Earnings</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">R{peValue.toFixed(2)}</div>
                        <div className={cn(
                          "text-xs",
                          getUpsideDownside(peValue) >= 0 ? "text-market-up" : "text-market-down"
                        )}>
                          {getUpsideDownside(peValue) >= 0 ? "+" : ""}{getUpsideDownside(peValue).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-terminal-bg-elevated rounded-md">
                      <div>
                        <div className="font-medium">P/B Based</div>
                        <div className="text-xs text-muted-foreground">Price to Book</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">R{pbValue.toFixed(2)}</div>
                        <div className={cn(
                          "text-xs",
                          getUpsideDownside(pbValue) >= 0 ? "text-market-up" : "text-market-down"
                        )}>
                          {getUpsideDownside(pbValue) >= 0 ? "+" : ""}{getUpsideDownside(pbValue).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {ddmValue > 0 && (
                      <div className="flex items-center justify-between p-3 bg-terminal-bg-elevated rounded-md">
                        <div>
                          <div className="font-medium">DDM</div>
                          <div className="text-xs text-muted-foreground">Dividend Discount Model</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold">R{ddmValue.toFixed(2)}</div>
                          <div className={cn(
                            "text-xs",
                            getUpsideDownside(ddmValue) >= 0 ? "text-market-up" : "text-market-down"
                          )}>
                            {getUpsideDownside(ddmValue) >= 0 ? "+" : ""}{getUpsideDownside(ddmValue).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Disclaimer:</strong> This calculator provides estimates based on simplified models
                and user inputs. Results should not be considered investment advice. Always conduct
                thorough research and consult with a financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
