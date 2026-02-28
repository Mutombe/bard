"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";
import { useAuthModal } from "@/contexts/AuthModalContext";

interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  gain: number;
  gainPercent: number;
  allocation: number;
}

const mockHoldings: Holding[] = [
  { symbol: "NPN", name: "Naspers Ltd", shares: 50, avgCost: 3100.00, currentPrice: 3245.67, value: 162283.50, gain: 7283.50, gainPercent: 4.70, allocation: 35.2 },
  { symbol: "MTN", name: "MTN Group Ltd", shares: 500, avgCost: 145.00, currentPrice: 156.78, value: 78390.00, gain: 5890.00, gainPercent: 8.12, allocation: 17.0 },
  { symbol: "AGL", name: "Anglo American Plc", shares: 100, avgCost: 520.00, currentPrice: 567.34, value: 56734.00, gain: 4734.00, gainPercent: 9.10, allocation: 12.3 },
  { symbol: "SBK", name: "Standard Bank Group", shares: 200, avgCost: 175.00, currentPrice: 189.45, value: 37890.00, gain: 2890.00, gainPercent: 8.26, allocation: 8.2 },
  { symbol: "FSR", name: "FirstRand Ltd", shares: 400, avgCost: 62.00, currentPrice: 67.89, value: 27156.00, gain: 2356.00, gainPercent: 9.50, allocation: 5.9 },
  { symbol: "SOL", name: "Sasol Ltd", shares: 150, avgCost: 280.00, currentPrice: 267.89, value: 40183.50, gain: -1816.50, gainPercent: -4.32, allocation: 8.7 },
  { symbol: "DANGCEM", name: "Dangote Cement Plc", shares: 200, avgCost: 275.00, currentPrice: 289.50, value: 57900.00, gain: 2900.00, gainPercent: 5.27, allocation: 12.6 },
];

export default function PortfolioPage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { openLogin, openRegister } = useAuthModal();
  const [holdings] = useState(mockHoldings);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalGain = holdings.reduce((sum, h) => sum + h.gain, 0);
  const totalGainPercent = (totalGain / (totalValue - totalGain)) * 100;

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
          <div className="max-w-md mx-auto text-center">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Portfolio Tracker</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to track your investments and monitor your portfolio performance.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={openLogin}
                className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={openRegister}
                className="px-6 py-3 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-brand-orange" />
              Portfolio
            </h1>
            <p className="text-muted-foreground">
              Track your investments and monitor performance.
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors">
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Value</div>
            <div className="text-3xl font-bold font-mono">
              R{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Gain/Loss</div>
            <div className={cn(
              "text-3xl font-bold font-mono flex items-center gap-2",
              totalGain >= 0 ? "text-market-up" : "text-market-down"
            )}>
              {totalGain >= 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
              R{Math.abs(totalGain).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-1">Return</div>
            <div className={cn(
              "text-3xl font-bold font-mono",
              totalGainPercent >= 0 ? "text-market-up" : "text-market-down"
            )}>
              {totalGainPercent >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}%
            </div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-1">Holdings</div>
            <div className="text-3xl font-bold font-mono">{holdings.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holdings Table */}
          <div className="lg:col-span-2">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
              <div className="p-4 border-b border-terminal-border">
                <h2 className="font-semibold">Holdings</h2>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Stock</div>
                <div className="col-span-2 text-right">Shares</div>
                <div className="col-span-2 text-right">Current</div>
                <div className="col-span-2 text-right">Value</div>
                <div className="col-span-2 text-right">Gain/Loss</div>
                <div className="col-span-1 text-right">%</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-terminal-border">
                {holdings.map((holding) => {
                  const isUp = holding.gain >= 0;

                  return (
                    <Link
                      key={holding.symbol}
                      href={`/companies/${holding.symbol.toLowerCase()}`}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
                    >
                      <div className="col-span-3">
                        <div className="font-mono font-semibold">{holding.symbol}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {holding.name}
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono">
                        {holding.shares}
                      </div>
                      <div className="col-span-2 text-right font-mono">
                        {holding.currentPrice.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-mono">
                        R{holding.value.toLocaleString()}
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
                          {isUp ? "+" : ""}{holding.gainPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="col-span-1 text-right text-sm text-muted-foreground">
                        {holding.allocation.toFixed(1)}%
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Allocation Chart */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-brand-orange" />
                Allocation
              </h3>
              <div className="space-y-3">
                {holdings
                  .sort((a, b) => b.allocation - a.allocation)
                  .map((holding) => (
                    <div key={holding.symbol}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{holding.symbol}</span>
                        <span className="text-muted-foreground">{holding.allocation.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-terminal-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange rounded-full"
                          style={{ width: `${holding.allocation}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Performance by Sector */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-orange" />
                By Sector
              </h3>
              <div className="space-y-3">
                {[
                  { sector: "Technology", allocation: 35.2, gain: 4.70 },
                  { sector: "Telecommunications", allocation: 17.0, gain: 8.12 },
                  { sector: "Mining", allocation: 12.3, gain: 9.10 },
                  { sector: "Industrial", allocation: 12.6, gain: 5.27 },
                  { sector: "Banking", allocation: 14.1, gain: 8.88 },
                  { sector: "Energy", allocation: 8.7, gain: -4.32 },
                ].map((sector) => (
                  <div key={sector.sector} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">{sector.sector}</div>
                      <div className="text-xs text-muted-foreground">{sector.allocation.toFixed(1)}%</div>
                    </div>
                    <div className={cn(
                      "text-sm font-mono",
                      sector.gain >= 0 ? "text-market-up" : "text-market-down"
                    )}>
                      {sector.gain >= 0 ? "+" : ""}{sector.gain.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/portfolio/transactions"
                  className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors text-sm"
                >
                  <span>Transaction History</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/portfolio/performance"
                  className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors text-sm"
                >
                  <span>Performance Report</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/portfolio/dividends"
                  className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors text-sm"
                >
                  <span>Dividend Income</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
