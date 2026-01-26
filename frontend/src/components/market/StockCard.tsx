"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  StarOff,
  ExternalLink,
  BarChart3,
  Bell,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  optimisticAdd,
  optimisticRemove,
  addToWatchlist,
  removeFromWatchlist,
  selectIsInWatchlist,
  selectIsPending,
} from "@/store/slices/watchlistSlice";
import {
  cn,
  formatPrice,
  formatPercent,
  formatLargeNumber,
  getPriceColorClass,
  getPriceBgClass,
} from "@/lib/utils";
import type { Company } from "@/types";

// Shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface StockCardProps {
  company: Company;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  onViewDetails?: (company: Company) => void;
  onCreateAlert?: (company: Company) => void;
  className?: string;
}

export function StockCard({
  company,
  variant = "default",
  showActions = true,
  onViewDetails,
  onCreateAlert,
  className,
}: StockCardProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isInWatchlist = useAppSelector((state) =>
    selectIsInWatchlist(state, company.id)
  );
  const isPending = useAppSelector((state) =>
    selectIsPending(state, company.id)
  );

  const {
    symbol,
    name,
    short_name,
    exchange,
    current_price,
    price_change,
    price_change_percent,
    volume,
    market_cap,
    is_up,
  } = company;

  const displayName = short_name || name;
  const colorClass = getPriceColorClass(price_change);
  const bgClass = getPriceBgClass(price_change);
  const Icon = is_up ? TrendingUp : price_change < 0 ? TrendingDown : Minus;

  // Handle watchlist toggle with optimistic update
  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to use watchlist");
      return;
    }

    if (isPending) return;

    if (isInWatchlist) {
      // Optimistic remove
      dispatch(optimisticRemove(company.id));
      toast.success(`Removed ${symbol} from watchlist`);

      try {
        await dispatch(removeFromWatchlist(company.id)).unwrap();
      } catch (error) {
        // Revert on failure - refetch watchlist
        toast.error(`Failed to remove ${symbol} from watchlist`);
      }
    } else {
      // Optimistic add
      dispatch(optimisticAdd(company));
      toast.success(`Added ${symbol} to watchlist`);

      try {
        await dispatch(addToWatchlist(company)).unwrap();
      } catch (error) {
        toast.error(`Failed to add ${symbol} to watchlist`);
      }
    }
  };

  // Compact variant
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center justify-between p-3 rounded-md",
          "bg-terminal-bg-secondary border border-terminal-border",
          "hover:bg-terminal-bg-elevated transition-colors cursor-pointer",
          className
        )}
        onClick={() => onViewDetails?.(company)}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{symbol}</span>
              <Badge variant="outline" className="text-2xs">
                {exchange?.code || company.exchange_code}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{displayName}</span>
          </div>
        </div>

        <div className="text-right">
          <div className={cn("font-mono font-semibold tabular-nums", colorClass)}>
            {formatPrice(current_price)}
          </div>
          <div className={cn("flex items-center justify-end gap-1 text-sm", colorClass)}>
            <Icon className="h-3 w-3" />
            <span className="font-mono tabular-nums">
              {formatPercent(price_change_percent)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Detailed variant
  if (variant === "detailed") {
    return (
      <Card
        className={cn(
          "bg-terminal-bg-secondary border-terminal-border",
          "hover:border-terminal-border-light transition-colors",
          className
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-mono text-lg">{symbol}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {exchange?.code || company.exchange_code}
                </Badge>
              </div>
              <CardDescription className="text-sm mt-1">
                {displayName}
              </CardDescription>
            </div>

            {showActions && (
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleWatchlistToggle}
                        disabled={isPending}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={isInWatchlist ? "filled" : "empty"}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {isInWatchlist ? (
                              <Star className="h-4 w-4 fill-brand-orange text-brand-orange" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails?.(company)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCreateAlert?.(company)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Create Alert
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Company Website
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Price Section */}
          <div className={cn("p-3 rounded-md mb-4", bgClass)}>
            <div className="flex items-baseline justify-between">
              <span className={cn("text-2xl font-mono font-bold tabular-nums", colorClass)}>
                {formatPrice(current_price)}
              </span>
              <div className={cn("flex items-center gap-2", colorClass)}>
                <Icon className="h-5 w-5" />
                <span className="font-mono tabular-nums font-semibold">
                  {formatPercent(price_change_percent)}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {price_change > 0 ? "+" : ""}
              {formatPrice(price_change)} today
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Volume
              </div>
              <div className="font-mono tabular-nums font-medium">
                {formatLargeNumber(volume)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Market Cap
              </div>
              <div className="font-mono tabular-nums font-medium">
                {formatLargeNumber(market_cap)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Day High
              </div>
              <div className="font-mono tabular-nums font-medium">
                {formatPrice(company.day_high)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Day Low
              </div>
              <div className="font-mono tabular-nums font-medium">
                {formatPrice(company.day_low)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      className={cn(
        "bg-terminal-bg-secondary border-terminal-border",
        "hover:border-terminal-border-light transition-colors cursor-pointer",
        className
      )}
      onClick={() => onViewDetails?.(company)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-semibold text-lg">{symbol}</span>
              <Badge variant="outline" className="text-2xs">
                {exchange?.code || company.exchange_code}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {displayName}
            </span>
          </div>

          {showActions && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2 -mt-1"
              onClick={(e) => {
                e.stopPropagation();
                handleWatchlistToggle();
              }}
              disabled={isPending}
            >
              {isInWatchlist ? (
                <Star className="h-4 w-4 fill-brand-orange text-brand-orange" />
              ) : (
                <StarOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className={cn("text-xl font-mono font-bold tabular-nums", colorClass)}>
              {formatPrice(current_price)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Vol: {formatLargeNumber(volume)}
            </div>
          </div>

          <div className={cn("flex items-center gap-1 px-2 py-1 rounded", bgClass, colorClass)}>
            <Icon className="h-4 w-4" />
            <span className="font-mono tabular-nums font-medium">
              {formatPercent(price_change_percent)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid of stock cards
export function StockCardGrid({
  companies,
  variant = "default",
  showActions = true,
  onViewDetails,
  onCreateAlert,
  className,
}: {
  companies: Company[];
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  onViewDetails?: (company: Company) => void;
  onCreateAlert?: (company: Company) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        variant === "compact"
          ? "grid-cols-1"
          : variant === "detailed"
            ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {companies.map((company, index) => (
        <motion.div
          key={company.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <StockCard
            company={company}
            variant={variant}
            showActions={showActions}
            onViewDetails={onViewDetails}
            onCreateAlert={onCreateAlert}
          />
        </motion.div>
      ))}
    </div>
  );
}
