"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Database,
  Globe,
  Key,
  Clock,
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sourceTypes = [
  { value: "api", label: "REST API", description: "Pull data from external API endpoints" },
  { value: "websocket", label: "WebSocket", description: "Real-time streaming data" },
  { value: "scraper", label: "Web Scraper", description: "Scrape data from websites" },
  { value: "file", label: "File Import", description: "Import from CSV/Excel files" },
];

const exchanges = [
  { code: "JSE", name: "Johannesburg Stock Exchange" },
  { code: "NGX", name: "Nigerian Exchange Group" },
  { code: "EGX", name: "Egyptian Exchange" },
  { code: "NSE", name: "Nairobi Securities Exchange" },
  { code: "ZSE", name: "Zimbabwe Stock Exchange" },
  { code: "BSE", name: "Botswana Stock Exchange" },
];

export default function NewDataSourcePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState("api");
  const [exchange, setExchange] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [refreshInterval, setRefreshInterval] = useState("5");
  const [isActive, setIsActive] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTestResult(Math.random() > 0.3 ? "success" : "error");
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    router.push("/admin/markets");
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/markets"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Data Source</h1>
            <p className="text-sm text-muted-foreground">
              Configure a new market data source
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !baseUrl}
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <div className="h-4 w-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Test Connection
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Source"}
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={cn(
            "mb-6 p-4 rounded-lg flex items-center gap-3",
            testResult === "success"
              ? "bg-market-up/10 border border-market-up/30 text-market-up"
              : "bg-market-down/10 border border-market-down/30 text-market-down"
          )}
        >
          {testResult === "success" ? (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Connection successful! Data source is accessible.</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5" />
              <span>Connection failed. Please check your configuration.</span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Source Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., JSE Live Data Feed"
                className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Exchange</label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
              >
                <option value="">Select exchange...</option>
                {exchanges.map((ex) => (
                  <option key={ex.code} value={ex.code}>
                    {ex.name} ({ex.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Source Type */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4">Source Type</h3>
          <div className="space-y-3">
            {sourceTypes.map((type) => (
              <label
                key={type.value}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                  sourceType === type.value
                    ? "border-brand-orange bg-brand-orange/10"
                    : "border-terminal-border hover:border-terminal-border/80"
                )}
              >
                <input
                  type="radio"
                  name="sourceType"
                  value={type.value}
                  checked={sourceType === type.value}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Connection Settings */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Connection Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {sourceType === "websocket" ? "WebSocket URL" : "Base URL"}
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  sourceType === "websocket"
                    ? "wss://api.example.com/stream"
                    : "https://api.example.com/v1"
                }
                className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>

            {sourceType !== "file" && (
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key..."
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Schedule Settings */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Refresh Interval (minutes)
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
              >
                <option value="1">Every 1 minute</option>
                <option value="5">Every 5 minutes</option>
                <option value="10">Every 10 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-terminal-border"
              />
              <label htmlFor="isActive" className="text-sm">
                Enable this data source
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Data will be fetched automatically based on the schedule when the source is enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
