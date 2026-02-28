"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";
import { useAuthModal } from "@/contexts/AuthModalContext";

interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  targetPrice: number;
  condition: "above" | "below";
  isActive: boolean;
  triggeredAt?: string;
}

const mockAlerts: PriceAlert[] = [
  { id: "1", symbol: "NPN", name: "Naspers Ltd", currentPrice: 3245.67, targetPrice: 3500.00, condition: "above", isActive: true },
  { id: "2", symbol: "MTN", name: "MTN Group Ltd", currentPrice: 156.78, targetPrice: 150.00, condition: "below", isActive: true },
  { id: "3", symbol: "AGL", name: "Anglo American Plc", currentPrice: 567.34, targetPrice: 600.00, condition: "above", isActive: true },
  { id: "4", symbol: "SBK", name: "Standard Bank Group", currentPrice: 189.45, targetPrice: 180.00, condition: "below", isActive: false, triggeredAt: "2025-01-23T10:30:00Z" },
];

export default function AlertsPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();
  const [alerts, setAlerts] = useState(mockAlerts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: "",
    targetPrice: "",
    condition: "above" as "above" | "below",
  });

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
      )
    );
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
          <div className="max-w-md mx-auto text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Price Alerts</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to set up price alerts and get notified when stocks hit your target.
            </p>
            <button
              onClick={openLogin}
              className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors inline-block"
            >
              Sign In
            </button>
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
              <Bell className="h-6 w-6 text-brand-orange" />
              Price Alerts
            </h1>
            <p className="text-muted-foreground">
              Get notified when stocks reach your target prices.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Alert
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <div className="text-sm text-muted-foreground">Total Alerts</div>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-market-up">
              {alerts.filter((a) => a.isActive).length}
            </div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <div className="text-sm text-muted-foreground">Triggered</div>
            <div className="text-2xl font-bold text-brand-orange">
              {alerts.filter((a) => a.triggeredAt).length}
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
              <div className="col-span-4">Stock</div>
              <div className="col-span-2 text-right">Current</div>
              <div className="col-span-2 text-right">Target</div>
              <div className="col-span-2 text-center">Condition</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-terminal-border">
              {alerts.map((alert) => {
                const progress =
                  alert.condition === "above"
                    ? ((alert.currentPrice / alert.targetPrice) * 100).toFixed(1)
                    : ((alert.targetPrice / alert.currentPrice) * 100).toFixed(1);

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "grid grid-cols-12 gap-4 p-4 items-center",
                      !alert.isActive && "opacity-50"
                    )}
                  >
                    <div className="col-span-4">
                      <Link
                        href={`/companies/${alert.symbol.toLowerCase()}`}
                        className="hover:text-brand-orange transition-colors"
                      >
                        <div className="font-mono font-semibold">{alert.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {alert.name}
                        </div>
                      </Link>
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {alert.currentPrice.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-mono font-semibold">
                      {alert.targetPrice.toFixed(2)}
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                          alert.condition === "above"
                            ? "bg-market-up/20 text-market-up"
                            : "bg-market-down/20 text-market-down"
                        )}
                      >
                        {alert.condition === "above" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {alert.condition === "above" ? "Above" : "Below"}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className={cn(
                          "p-2 rounded transition-colors",
                          alert.isActive
                            ? "text-market-up hover:bg-market-up/20"
                            : "text-muted-foreground hover:bg-terminal-bg-elevated"
                        )}
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg-elevated rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No alerts set</h3>
            <p className="text-muted-foreground mb-6">
              Create your first price alert to get notified when stocks hit your target.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Alert
            </button>
          </div>
        )}

        {/* Create Alert Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/70"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative bg-terminal-bg-secondary border border-terminal-border rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Create Price Alert</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    value={newAlert.symbol}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., NPN"
                    className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Price
                  </label>
                  <input
                    type="number"
                    value={newAlert.targetPrice}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, targetPrice: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Alert When Price Goes
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewAlert({ ...newAlert, condition: "above" })}
                      className={cn(
                        "flex-1 py-2 rounded-md transition-colors flex items-center justify-center gap-2",
                        newAlert.condition === "above"
                          ? "bg-market-up text-white"
                          : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Above
                    </button>
                    <button
                      onClick={() => setNewAlert({ ...newAlert, condition: "below" })}
                      className={cn(
                        "flex-1 py-2 rounded-md transition-colors flex items-center justify-center gap-2",
                        newAlert.condition === "below"
                          ? "bg-market-down text-white"
                          : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <TrendingDown className="h-4 w-4" />
                      Below
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add alert logic here
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
