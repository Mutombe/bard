"use client";

import Link from "next/link";
import { DollarSign, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const forexPairs = [
  { pair: "USD/ZAR", name: "US Dollar / South African Rand", rate: 18.7234, change: 0.0523, changePercent: 0.28 },
  { pair: "EUR/ZAR", name: "Euro / South African Rand", rate: 20.3456, change: -0.0834, changePercent: -0.41 },
  { pair: "GBP/ZAR", name: "British Pound / South African Rand", rate: 23.8912, change: 0.1234, changePercent: 0.52 },
  { pair: "USD/NGN", name: "US Dollar / Nigerian Naira", rate: 1456.78, change: 12.34, changePercent: 0.85 },
  { pair: "USD/EGP", name: "US Dollar / Egyptian Pound", rate: 30.8765, change: -0.2345, changePercent: -0.75 },
  { pair: "USD/KES", name: "US Dollar / Kenyan Shilling", rate: 153.45, change: 0.67, changePercent: 0.44 },
  { pair: "EUR/USD", name: "Euro / US Dollar", rate: 1.0867, change: -0.0023, changePercent: -0.21 },
  { pair: "GBP/USD", name: "British Pound / US Dollar", rate: 1.2756, change: 0.0045, changePercent: 0.35 },
];

export default function ForexPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-brand-orange" />
              Forex Markets
            </h1>
            <p className="text-muted-foreground">Currency exchange rates and pairs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {forexPairs.map((fx) => {
            const isUp = fx.change >= 0;
            return (
              <div
                key={fx.pair}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 hover:border-brand-orange/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold">{fx.pair}</span>
                  {isUp ? (
                    <TrendingUp className="h-4 w-4 text-market-up" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-market-down" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-3">{fx.name}</div>
                <div className="text-2xl font-mono mb-1">{fx.rate.toFixed(4)}</div>
                <div className={cn(
                  "text-sm font-mono",
                  isUp ? "text-market-up" : "text-market-down"
                )}>
                  {isUp ? "+" : ""}{fx.change.toFixed(4)} ({isUp ? "+" : ""}{fx.changePercent.toFixed(2)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
