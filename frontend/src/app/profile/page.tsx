"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Camera,
  Shield,
  Bell,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";
import { useAuthModal } from "@/contexts/AuthModalContext";

export default function ProfilePage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();
  const [isEditing, setIsEditing] = useState(false);

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12">
          <div className="max-w-md mx-auto text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to view and manage your profile.
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
          <h1 className="text-2xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avatar & Basic Info */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-brand-orange/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-brand-orange">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-brand-orange rounded-full text-white hover:bg-brand-orange-dark">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{user?.full_name}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium capitalize",
                      user?.subscription_tier === "enterprise"
                        ? "bg-brand-orange/20 text-brand-orange"
                        : user?.subscription_tier === "professional"
                        ? "bg-market-up/20 text-market-up"
                        : "bg-terminal-bg-elevated text-muted-foreground"
                    )}>
                      {user?.subscription_tier} Plan
                    </span>
                    {user?.email_verified && (
                      <span className="flex items-center gap-1 text-xs text-market-up">
                        <Shield className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors text-sm"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={user?.first_name || ""}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={user?.last_name || ""}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Add phone number"
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange disabled:opacity-60"
                  />
                </div>
              </div>
              {isEditing && (
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark">
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Account Stats */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Account Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-terminal-bg-elevated rounded-lg text-center">
                  <div className="text-2xl font-bold text-brand-orange">—</div>
                  <div className="text-sm text-muted-foreground">Articles Read</div>
                </div>
                <div className="p-4 bg-terminal-bg-elevated rounded-lg text-center">
                  <div className="text-2xl font-bold text-brand-orange">—</div>
                  <div className="text-sm text-muted-foreground">Saved Articles</div>
                </div>
                <div className="p-4 bg-terminal-bg-elevated rounded-lg text-center">
                  <div className="text-2xl font-bold text-brand-orange">{user?.profile?.watchlist?.length ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Watchlist Items</div>
                </div>
                <div className="p-4 bg-terminal-bg-elevated rounded-lg text-center">
                  <div className="text-2xl font-bold text-brand-orange">—</div>
                  <div className="text-sm text-muted-foreground">Price Alerts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
              <div className="p-4 border-b border-terminal-border">
                <h3 className="font-semibold">Quick Links</h3>
              </div>
              <div className="divide-y divide-terminal-border">
                <Link
                  href="/settings"
                  className="flex items-center justify-between p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center justify-between p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span>Notification Preferences</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/subscribe"
                  className="flex items-center justify-between p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span>Subscription & Billing</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4">Your Subscription</h3>
              <div className="p-4 bg-brand-orange/10 border border-brand-orange/30 rounded-lg">
                <div className="text-lg font-bold text-brand-orange capitalize mb-1">
                  {user?.subscription_tier} Plan
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {user?.subscription_tier === "enterprise"
                    ? "Full access to all features"
                    : user?.subscription_tier === "professional"
                    ? "Access to professional content"
                    : "Upgrade for more features"}
                </p>
                {user?.subscription_tier !== "enterprise" && (
                  <Link
                    href="/subscribe"
                    className="block text-center py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm"
                  >
                    Upgrade Plan
                  </Link>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <div>
                  <div className="text-xs">Member since</div>
                  <div className="text-foreground">
                    {user?.date_joined
                      ? new Date(user.date_joined).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
