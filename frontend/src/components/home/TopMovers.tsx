"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTopMovers } from "@/store/slices/marketSlice";
import { cn, formatPrice, formatPercent, formatLargeNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StockCard, StockCardGrid } from "@/components/market/StockCard";

type Tab = "gainers" | "losers" | "active";

export function TopMovers() {
  const dispatch = useAppDispatch();
  const { gainers, losers, mostActive, moversLoading } = useAppSelector(
    (state) => state.market
  );
  const [activeTab, setActiveTab] = useState<Tab>("gainers");

  useEffect(() => {
    dispatch(fetchTopMovers());
  }, [dispatch]);

  const tabs = [
    { id: "gainers" as Tab, label: "Top Gainers", icon: TrendingUp, color: "text-market-up" },
    { id: "losers" as Tab, label: "Top Losers", icon: TrendingDown, color: "text-market-down" },
    { id: "active" as Tab, label: "Most Active", icon: Activity, color: "text-brand-orange" },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case "gainers":
        return gainers;
      case "losers":
        return losers;
      case "active":
        return mostActive;
    }
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Top Movers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Today's biggest market moves
          </p>
        </div>
        <Link href="/markets">
          <Button variant="ghost" size="sm" className="gap-2">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-terminal-bg-elevated text-foreground border border-terminal-border"
                : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg/50"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id && tab.color)} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {moversLoading && getActiveData().length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="card-terminal p-4 animate-pulse"
                >
                  <div className="flex justify-between mb-3">
                    <div className="h-5 w-16 bg-terminal-border rounded" />
                    <div className="h-5 w-12 bg-terminal-border rounded" />
                  </div>
                  <div className="h-4 w-24 bg-terminal-border rounded mb-3" />
                  <div className="h-8 w-20 bg-terminal-border rounded" />
                </div>
              ))}
            </div>
          ) : (
            <StockCardGrid
              companies={getActiveData().slice(0, 6)}
              variant="default"
              onViewDetails={(company) => {
                window.location.href = `/companies/${company.id}`;
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
