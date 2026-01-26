"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Database,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataSource {
  id: string;
  name: string;
  type: "api" | "scraper";
  status: "active" | "error" | "paused";
  lastSync: string;
  nextSync: string;
  recordCount: number;
  errorCount: number;
}

interface MarketIndex {
  symbol: string;
  name: string;
  exchange: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

const dataSources: DataSource[] = [
  {
    id: "1",
    name: "JSE Market Data",
    type: "scraper",
    status: "active",
    lastSync: "2025-01-24T14:30:00Z",
    nextSync: "2025-01-24T14:45:00Z",
    recordCount: 456,
    errorCount: 0,
  },
  {
    id: "2",
    name: "NGX Market Data",
    type: "scraper",
    status: "active",
    lastSync: "2025-01-24T14:25:00Z",
    nextSync: "2025-01-24T14:40:00Z",
    recordCount: 312,
    errorCount: 2,
  },
  {
    id: "3",
    name: "Polygon.io API",
    type: "api",
    status: "active",
    lastSync: "2025-01-24T14:32:00Z",
    nextSync: "2025-01-24T14:35:00Z",
    recordCount: 1250,
    errorCount: 0,
  },
  {
    id: "4",
    name: "NewsAPI.org",
    type: "api",
    status: "active",
    lastSync: "2025-01-24T14:00:00Z",
    nextSync: "2025-01-24T15:00:00Z",
    recordCount: 89,
    errorCount: 0,
  },
  {
    id: "5",
    name: "EGX Market Data",
    type: "scraper",
    status: "error",
    lastSync: "2025-01-24T12:00:00Z",
    nextSync: "2025-01-24T15:00:00Z",
    recordCount: 0,
    errorCount: 5,
  },
];

const marketIndices: MarketIndex[] = [
  { symbol: "J200", name: "JSE Top 40", exchange: "JSE", value: 68234.56, change: 456.78, changePercent: 0.67, lastUpdated: "2025-01-24T14:30:00Z" },
  { symbol: "ALSI", name: "JSE All Share", exchange: "JSE", value: 78456.23, change: 523.45, changePercent: 0.67, lastUpdated: "2025-01-24T14:30:00Z" },
  { symbol: "NGX-ASI", name: "NGX All Share", exchange: "NGX", value: 98456.78, change: -234.56, changePercent: -0.24, lastUpdated: "2025-01-24T14:25:00Z" },
  { symbol: "EGX30", name: "EGX 30", exchange: "EGX", value: 28456.78, change: 178.45, changePercent: 0.63, lastUpdated: "2025-01-24T12:00:00Z" },
];

function getStatusColor(status: DataSource["status"]) {
  switch (status) {
    case "active":
      return "bg-market-up/20 text-market-up";
    case "error":
      return "bg-market-down/20 text-market-down";
    case "paused":
      return "bg-yellow-500/20 text-yellow-400";
  }
}

export default function MarketsAdminPage() {
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const handleRefresh = async (sourceId: string) => {
    setRefreshing(sourceId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRefreshing(null);
  };

  const toggleSource = (sourceId: string) => {
    // Toggle source status
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Market Data</h1>
          <p className="text-muted-foreground">
            Manage data sources, scrapers, and market information.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleRefresh("all")}
            disabled={refreshing === "all"}
            className="flex items-center gap-2 px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing === "all" && "animate-spin")} />
            Refresh All
          </button>
          <Link
            href="/admin/markets/sources/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            <Database className="h-4 w-4" />
            Add Source
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-brand-orange" />
            <span className="text-sm text-muted-foreground">Data Sources</span>
          </div>
          <div className="text-2xl font-bold">{dataSources.length}</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-market-up" />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
          <div className="text-2xl font-bold">
            {dataSources.filter((s) => s.status === "active").length}
          </div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-market-down" />
            <span className="text-sm text-muted-foreground">Errors</span>
          </div>
          <div className="text-2xl font-bold text-market-down">
            {dataSources.filter((s) => s.status === "error").length}
          </div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-brand-orange" />
            <span className="text-sm text-muted-foreground">Total Records</span>
          </div>
          <div className="text-2xl font-bold">
            {dataSources.reduce((sum, s) => sum + s.recordCount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Sources */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold">Data Sources</h2>
          </div>
          <div className="divide-y divide-terminal-border">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className="p-4 hover:bg-terminal-bg-elevated transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {source.name}
                      <span className="px-2 py-0.5 text-xs bg-terminal-bg-elevated rounded">
                        {source.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      Last sync: {new Date(source.lastSync).toLocaleTimeString()}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium capitalize",
                      getStatusColor(source.status)
                    )}
                  >
                    {source.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{source.recordCount.toLocaleString()} records</span>
                    {source.errorCount > 0 && (
                      <span className="text-market-down">
                        {source.errorCount} errors
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRefresh(source.id)}
                      disabled={refreshing === source.id}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          refreshing === source.id && "animate-spin"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => toggleSource(source.id)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                    >
                      {source.status === "paused" ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </button>
                    <Link
                      href={`/admin/markets/sources/${source.id}`}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Indices */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold">Market Indices</h2>
          </div>
          <div className="divide-y divide-terminal-border">
            {marketIndices.map((index) => {
              const isUp = index.change >= 0;
              return (
                <div
                  key={index.symbol}
                  className="p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-semibold">{index.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {index.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">
                        {index.value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div
                        className={cn(
                          "text-sm flex items-center justify-end gap-1",
                          isUp ? "text-market-up" : "text-market-down"
                        )}
                      >
                        {isUp ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {isUp ? "+" : ""}
                        {index.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{index.exchange}</span>
                    <span>
                      Updated: {new Date(index.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scheduler */}
      <div className="mt-6 bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
        <h2 className="font-semibold mb-4">Data Sync Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-terminal-bg-elevated rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Market Data</div>
            <div className="font-medium">Every 15 minutes</div>
            <div className="text-xs text-muted-foreground mt-1">
              During market hours
            </div>
          </div>
          <div className="p-4 bg-terminal-bg-elevated rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">News Feed</div>
            <div className="font-medium">Every hour</div>
            <div className="text-xs text-muted-foreground mt-1">24/7</div>
          </div>
          <div className="p-4 bg-terminal-bg-elevated rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Company Data</div>
            <div className="font-medium">Daily at 00:00</div>
            <div className="text-xs text-muted-foreground mt-1">
              Full sync overnight
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
