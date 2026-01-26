"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchIndices } from "@/store/slices/marketSlice";
import { cn, formatPrice, formatPercent } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MarketOverview() {
  const dispatch = useAppDispatch();
  const { indices, indicesLoading, lastUpdated } = useAppSelector(
    (state) => state.market
  );

  useEffect(() => {
    dispatch(fetchIndices());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchIndices());
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Market Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            African market indices performance
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={indicesLoading}
          className="gap-2"
        >
          <RefreshCw
            className={cn("h-4 w-4", indicesLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Indices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicesLoading && indices.length === 0 ? (
          // Loading skeletons
          [...Array(4)].map((_, i) => (
            <Card key={i} className="bg-terminal-bg-secondary border-terminal-border">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 w-20 bg-terminal-border rounded mb-2" />
                  <div className="h-8 w-28 bg-terminal-border rounded mb-2" />
                  <div className="h-4 w-16 bg-terminal-border rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          indices.map((index, i) => {
            const isUp = index.change > 0;
            const isDown = index.change < 0;
            const colorClass = isUp
              ? "text-market-up"
              : isDown
                ? "text-market-down"
                : "text-muted-foreground";
            const bgClass = isUp
              ? "bg-market-up-bg"
              : isDown
                ? "bg-market-down-bg"
                : "bg-terminal-bg-elevated";
            const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

            return (
              <motion.div
                key={index.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-terminal-bg-secondary border-terminal-border hover:border-terminal-border-light transition-colors">
                  <CardContent className="p-4">
                    {/* Index Name */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {index.exchange_code}
                      </span>
                      <div
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded text-xs",
                          bgClass,
                          colorClass
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {formatPercent(index.change_percent)}
                      </div>
                    </div>

                    {/* Index Code */}
                    <h3 className="font-semibold text-lg mb-1">{index.name}</h3>

                    {/* Value */}
                    <div className={cn("text-2xl font-mono font-bold tabular-nums", colorClass)}>
                      {formatPrice(index.current_value)}
                    </div>

                    {/* Change */}
                    <div className="text-sm text-muted-foreground mt-1">
                      {index.change > 0 ? "+" : ""}
                      {formatPrice(index.change)}
                    </div>

                    {/* YTD */}
                    <div className="mt-3 pt-3 border-t border-terminal-border">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">YTD</span>
                        <span
                          className={cn(
                            index.ytd_change > 0
                              ? "text-market-up"
                              : index.ytd_change < 0
                                ? "text-market-down"
                                : "text-muted-foreground"
                          )}
                        >
                          {formatPercent(index.ytd_change)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
