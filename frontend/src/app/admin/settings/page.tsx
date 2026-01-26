"use client";

import { useState } from "react";
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  Mail,
  Key,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "api", label: "API Keys", icon: Key },
    { id: "email", label: "Email Settings", icon: Mail },
    { id: "database", label: "Database", icon: Database },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-md transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-brand-orange text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-6">
              <h2 className="text-lg font-semibold">General Settings</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  defaultValue="Bardiq Journal Journal"
                  className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Site Description
                </label>
                <textarea
                  defaultValue="African Financial Intelligence Platform"
                  rows={3}
                  className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Timezone
                </label>
                <select className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange">
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Currency
                </label>
                <select className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange">
                  <option value="ZAR">South African Rand (ZAR)</option>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EGP">Egyptian Pound (EGP)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-terminal-bg-elevated rounded-md">
                <div>
                  <div className="font-medium">Maintenance Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Temporarily disable the site for maintenance
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-terminal-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Notification Settings</h2>

              <div className="space-y-4">
                {[
                  { label: "New user registrations", description: "Notify when new users sign up" },
                  { label: "Article published", description: "Notify when articles go live" },
                  { label: "Newsletter sent", description: "Confirm newsletter delivery" },
                  { label: "Data sync errors", description: "Alert on scraper failures" },
                  { label: "Low disk space", description: "Warn when storage is low" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-terminal-bg-elevated rounded-md">
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-terminal-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Security Settings</h2>

              <div className="flex items-center justify-between p-4 bg-terminal-bg-elevated rounded-md">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-terminal-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={60}
                  className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Password Policy
                </label>
                <select className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange">
                  <option value="strong">Strong (12+ chars, mixed case, numbers, symbols)</option>
                  <option value="medium">Medium (8+ chars, mixed case, numbers)</option>
                  <option value="basic">Basic (8+ chars)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Allowed IP Ranges (Admin Access)
                </label>
                <textarea
                  defaultValue="0.0.0.0/0"
                  rows={3}
                  placeholder="One IP range per line"
                  className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange resize-none font-mono text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-6">
              <h2 className="text-lg font-semibold">API Configuration</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Polygon.io API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    defaultValue="l8TQKKpACZBUho4kUWgAdOp_jZfuhWgz"
                    className="w-full px-4 py-2 pr-10 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  NewsAPI.org API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    defaultValue="501dd05c42a34918a11dd241f9e1856d"
                    className="w-full px-4 py-2 pr-10 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange font-mono"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Rate Limits
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Requests per minute
                    </label>
                    <input
                      type="number"
                      defaultValue={60}
                      className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Requests per day
                    </label>
                    <input
                      type="number"
                      defaultValue={10000}
                      className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Email Settings</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  defaultValue="smtp.sendgrid.net"
                  className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    defaultValue={587}
                    className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Encryption
                  </label>
                  <select className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange">
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  defaultValue="noreply@Bardiq Journal.com"
                  className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  defaultValue="Bardiq Journal Journal"
                  className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                />
              </div>

              <button className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
                Send Test Email
              </button>
            </div>
          )}

          {activeTab === "database" && (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Database Settings</h2>

              <div className="p-4 bg-terminal-bg-elevated rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Database Type</div>
                    <div className="font-medium">PostgreSQL 15</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Connection Status</div>
                    <div className="font-medium text-market-up">Connected</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Records</div>
                    <div className="font-medium">1,245,678</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Database Size</div>
                    <div className="font-medium">4.2 GB</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
                  Backup Database
                </button>
                <button className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
                  Clear Cache
                </button>
                <button className="px-4 py-2 border border-market-down/30 text-market-down rounded-md hover:bg-market-down/10 transition-colors">
                  Reset Database
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
