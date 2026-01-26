"use client";

import Link from "next/link";
import { Target, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const commodities = [
  { symbol: "GOLD", name: "Gold", price: 2034.56, unit: "USD/oz", change: 12.34, changePercent: 0.61 },
  { symbol: "SILVER", name: "Silver", price: 23.45, unit: "USD/oz", change: -0.23, changePercent: -0.97 },
  { symbol: "PLATINUM", name: "Platinum", price: 912.34, unit: "USD/oz", change: 5.67, changePercent: 0.63 },
  { symbol: "PALLADIUM", name: "Palladium", price: 987.65, unit: "USD/oz", change: -8.90, changePercent: -0.89 },
  { symbol: "BRENT", name: "Brent Crude Oil", price: 82.45, unit: "USD/bbl", change: 1.23, changePercent: 1.51 },
  { symbol: "WTI", name: "WTI Crude Oil", price: 78.34, unit: "USD/bbl", change: 0.98, changePercent: 1.27 },
  { symbol: "NATGAS", name: "Natural Gas", price: 2.456, unit: "USD/MMBtu", change: -0.089, changePercent: -3.50 },
  { symbol: "COPPER", name: "Copper", price: 8456.78, unit: "USD/t", change: 45.67, changePercent: 0.54 },
  { symbol: "IRON", name: "Iron Ore", price: 128.90, unit: "USD/t", change: -2.34, changePercent: -1.78 },
  { symbol: "COAL", name: "Coal", price: 134.56, unit: "USD/t", change: 1.23, changePercent: 0.92 },
  { symbol: "CORN", name: "Corn", price: 456.78, unit: "USc/bu", change: 3.45, changePercent: 0.76 },
  { symbol: "WHEAT", name: "Wheat", price: 567.89, unit: "USc/bu", change: -5.67, changePercent: -0.99 },
];

export default function CommoditiesPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-brand-orange" />
              Commodities
            </h1>
            <p className="text-muted-foreground">Precious metals, energy, and agricultural commodities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {commodities.map((commodity) => {
            const isUp = commodity.change >= 0;
            return (
              <div
                key={commodity.symbol}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 hover:border-brand-orange/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold text-brand-orange">{commodity.symbol}</span>
                  {isUp ? (
                    <TrendingUp className="h-4 w-4 text-market-up" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-market-down" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-3">{commodity.name}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-mono">{commodity.price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{commodity.unit}</span>
                </div>
                <div className={cn(
                  "text-sm font-mono",
                  isUp ? "text-market-up" : "text-market-down"
                )}>
                  {isUp ? "+" : ""}{commodity.change.toFixed(2)} ({isUp ? "+" : ""}{commodity.changePercent.toFixed(2)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
