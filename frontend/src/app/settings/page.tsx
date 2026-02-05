"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  Bell,
  Shield,
  Eye,
  Moon,
  Globe,
  Mail,
  Key,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";
import { useAuthModal } from "@/contexts/AuthModalContext";

export default function SettingsPage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Eye },
  ];

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12">
          <div className="max-w-md mx-auto text-center">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to manage your account settings.
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
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
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
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                  <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">First Name</label>
                        <input
                          type="text"
                          defaultValue={user?.first_name}
                          className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name</label>
                        <input
                          type="text"
                          defaultValue={user?.last_name}
                          className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark">
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                  <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <button className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="bg-terminal-bg-secondary rounded-lg border border-market-down/30 p-6">
                  <h2 className="text-lg font-semibold mb-2 text-market-down">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back.
                  </p>
                  <button className="px-4 py-2 border border-market-down text-market-down rounded-md hover:bg-market-down/10 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { id: "email_news", label: "Breaking News", description: "Get notified about major market events" },
                    { id: "email_digest", label: "Daily Digest", description: "Receive daily market summary" },
                    { id: "email_alerts", label: "Price Alerts", description: "Notifications when stocks hit your targets" },
                    { id: "email_newsletter", label: "Newsletter", description: "Weekly newsletter with top stories" },
                    { id: "email_watchlist", label: "Watchlist Updates", description: "Updates on your watched stocks" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-terminal-bg-elevated rounded-md">
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-terminal-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h2 className="text-lg font-semibold mb-6">Privacy Settings</h2>
                <div className="space-y-4">
                  {[
                    { id: "profile_public", label: "Public Profile", description: "Allow others to see your profile" },
                    { id: "show_activity", label: "Show Activity", description: "Display your reading activity" },
                    { id: "personalized_ads", label: "Personalized Ads", description: "Allow personalized advertising" },
                    { id: "analytics", label: "Analytics", description: "Help improve our service with anonymous data" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-terminal-bg-elevated rounded-md">
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.id !== "personalized_ads"} className="sr-only peer" />
                        <div className="w-11 h-6 bg-terminal-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h2 className="text-lg font-semibold mb-6">Appearance Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Dark", "Light", "System"].map((theme) => (
                        <button
                          key={theme}
                          className={cn(
                            "p-4 rounded-md border text-center transition-colors",
                            theme === "Dark"
                              ? "border-brand-orange bg-brand-orange/10"
                              : "border-terminal-border hover:border-brand-orange/50"
                          )}
                        >
                          <Moon className="h-6 w-6 mx-auto mb-2" />
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Language</label>
                    <select className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange">
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="pt">Portuguese</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Timezone</label>
                    <select className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange">
                      <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                      <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                      <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                      <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
