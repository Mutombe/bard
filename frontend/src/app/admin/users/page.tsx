"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Crown,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "editor" | "subscriber";
  subscriptionTier: "free" | "premium" | "enterprise";
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const mockUsers: UserAccount[] = [
  {
    id: "1",
    email: "admin@bardsantner.com",
    firstName: "Admin",
    lastName: "User",
    role: "super_admin",
    subscriptionTier: "enterprise",
    isActive: true,
    isVerified: true,
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: "2025-01-24T10:00:00Z",
  },
  {
    id: "2",
    email: "thabo@bardsantner.com",
    firstName: "Thabo",
    lastName: "Mokoena",
    role: "editor",
    subscriptionTier: "enterprise",
    isActive: true,
    isVerified: true,
    createdAt: "2024-03-15T00:00:00Z",
    lastLogin: "2025-01-24T08:00:00Z",
  },
  {
    id: "3",
    email: "amara@bardsantner.com",
    firstName: "Amara",
    lastName: "Obi",
    role: "editor",
    subscriptionTier: "enterprise",
    isActive: true,
    isVerified: true,
    createdAt: "2024-04-20T00:00:00Z",
    lastLogin: "2025-01-23T16:00:00Z",
  },
  {
    id: "4",
    email: "john.investor@example.com",
    firstName: "John",
    lastName: "Investor",
    role: "subscriber",
    subscriptionTier: "premium",
    isActive: true,
    isVerified: true,
    createdAt: "2024-06-10T00:00:00Z",
    lastLogin: "2025-01-24T07:00:00Z",
  },
  {
    id: "5",
    email: "sarah.trader@example.com",
    firstName: "Sarah",
    lastName: "Trader",
    role: "subscriber",
    subscriptionTier: "free",
    isActive: true,
    isVerified: false,
    createdAt: "2025-01-20T00:00:00Z",
    lastLogin: null,
  },
  {
    id: "6",
    email: "mike.analyst@example.com",
    firstName: "Mike",
    lastName: "Analyst",
    role: "subscriber",
    subscriptionTier: "premium",
    isActive: false,
    isVerified: true,
    createdAt: "2024-08-05T00:00:00Z",
    lastLogin: "2024-12-15T00:00:00Z",
  },
];

const roles = [
  { id: "all", label: "All Roles" },
  { id: "super_admin", label: "Super Admin" },
  { id: "editor", label: "Editor" },
  { id: "subscriber", label: "Subscriber" },
];

const tiers = [
  { id: "all", label: "All Tiers" },
  { id: "free", label: "Free" },
  { id: "premium", label: "Premium" },
  { id: "enterprise", label: "Enterprise" },
];

function getRoleColor(role: UserAccount["role"]) {
  switch (role) {
    case "super_admin":
      return "bg-purple-500/20 text-purple-400";
    case "editor":
      return "bg-blue-500/20 text-blue-400";
    case "subscriber":
      return "bg-terminal-bg-elevated text-muted-foreground";
  }
}

function getTierColor(tier: UserAccount["subscriptionTier"]) {
  switch (tier) {
    case "enterprise":
      return "text-brand-orange";
    case "premium":
      return "text-market-up";
    case "free":
      return "text-muted-foreground";
  }
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesTier =
      selectedTier === "all" || user.subscriptionTier === selectedTier;
    return matchesSearch && matchesRole && matchesTier;
  });

  const toggleSelectUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-brand-orange" />
            <span className="text-sm text-muted-foreground">Total Users</span>
          </div>
          <div className="text-2xl font-bold">45,892</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-brand-orange" />
            <span className="text-sm text-muted-foreground">Premium</span>
          </div>
          <div className="text-2xl font-bold">12,456</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-brand-orange" />
            <span className="text-sm text-muted-foreground">Admins</span>
          </div>
          <div className="text-2xl font-bold">8</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-brand-orange" />
            <span className="text-sm text-muted-foreground">New Today</span>
          </div>
          <div className="text-2xl font-bold">+124</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          >
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <span className="text-sm text-muted-foreground">
            {selectedUsers.length} selected
          </span>
          <button className="px-3 py-1 text-sm bg-market-up/20 text-market-up rounded hover:bg-market-up/30">
            Activate
          </button>
          <button className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30">
            Deactivate
          </button>
          <button className="px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30">
            Delete
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedUsers.length === filteredUsers.length}
              onChange={toggleSelectAll}
              className="rounded border-terminal-border"
            />
          </div>
          <div className="col-span-3">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Subscription</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Last Login</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-terminal-border">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
            >
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleSelectUser(user.id)}
                  className="rounded border-terminal-border"
                />
              </div>
              <div className="col-span-3">
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </div>
              </div>
              <div className="col-span-2">
                <span
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium capitalize",
                    getRoleColor(user.role)
                  )}
                >
                  {user.role.replace("_", " ")}
                </span>
              </div>
              <div className="col-span-2">
                <span className={cn("text-sm capitalize", getTierColor(user.subscriptionTier))}>
                  {user.subscriptionTier}
                </span>
              </div>
              <div className="col-span-1 flex justify-center">
                {user.isActive ? (
                  <CheckCircle className="h-5 w-5 text-market-up" />
                ) : (
                  <XCircle className="h-5 w-5 text-market-down" />
                )}
              </div>
              <div className="col-span-2 text-right text-sm text-muted-foreground">
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleDateString("en-ZA", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Never"}
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {mockUsers.length} users
        </p>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50">
            Previous
          </button>
          <button className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
