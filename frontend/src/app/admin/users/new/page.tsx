"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CircleUserRound,
  Mail,
  Lock,
  Shield,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { value: "subscriber", label: "Subscriber", description: "Regular user with read access" },
  { value: "analyst", label: "Analyst", description: "Can create research content" },
  { value: "editor", label: "Editor", description: "Can create and edit articles" },
  { value: "super_admin", label: "Super Admin", description: "Full system access" },
];

const subscriptionTiers = [
  { value: "free", label: "Free", description: "Basic access" },
  { value: "basic", label: "Basic", description: "Standard features" },
  { value: "professional", label: "Professional", description: "Premium content access" },
  { value: "enterprise", label: "Enterprise", description: "Full platform access" },
];

export default function NewUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("subscriber");
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [isActive, setIsActive] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");

    if (!email || !firstName || !lastName) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          password,
          role,
          subscription_tier: subscriptionTier,
          is_active: isActive,
          email_verified: emailVerified,
        }),
      });

      if (response.ok) {
        router.push("/admin/users");
      } else {
        const data = await response.json();
        setError(data.detail || "Failed to create user");
      }
    } catch (err) {
      setError("Failed to create user. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New User</h1>
            <p className="text-sm text-muted-foreground">
              Create a new user account
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Creating..." : "Create User"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-market-down/10 border border-market-down/30 rounded-lg text-market-down text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CircleUserRound className="h-4 w-4" />
            Basic Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name <span className="text-market-down">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-market-down">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email <span className="text-market-down">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 pr-10 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Leave blank to send a password reset email instead
            </p>
          </div>
        </div>

        {/* Role & Permissions */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role & Permissions
          </h3>
          <div className="space-y-3">
            {roles.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                  role === r.value
                    ? "border-brand-orange bg-brand-orange/10"
                    : "border-terminal-border hover:border-terminal-border/80"
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription Tier
          </h3>
          <div className="space-y-3">
            {subscriptionTiers.map((tier) => (
              <label
                key={tier.value}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                  subscriptionTier === tier.value
                    ? "border-brand-orange bg-brand-orange/10"
                    : "border-terminal-border hover:border-terminal-border/80"
                )}
              >
                <input
                  type="radio"
                  name="subscriptionTier"
                  value={tier.value}
                  checked={subscriptionTier === tier.value}
                  onChange={(e) => setSubscriptionTier(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">{tier.label}</div>
                  <div className="text-xs text-muted-foreground">{tier.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Account Status</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-terminal-border"
              />
              <span className="text-sm">Account Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={emailVerified}
                onChange={(e) => setEmailVerified(e.target.checked)}
                className="rounded border-terminal-border"
              />
              <span className="text-sm">Email Verified</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                className="rounded border-terminal-border"
              />
              <span className="text-sm">Send Welcome Email</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
