"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Crown,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton, LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { adminService, type AdminUser, type UserStats } from "@/services/api/admin";
import { toast } from "sonner";

const roles = [
  { id: "all", label: "All Roles" },
  { id: "super_admin", label: "Super Admin" },
  { id: "editor", label: "Editor" },
  { id: "analyst", label: "Analyst" },
  { id: "subscriber", label: "Subscriber" },
];

const tiers = [
  { id: "all", label: "All Tiers" },
  { id: "free", label: "Free" },
  { id: "basic", label: "Basic" },
  { id: "professional", label: "Professional" },
  { id: "enterprise", label: "Enterprise" },
];

function getRoleColor(role: string) {
  switch (role) {
    case "super_admin":
      return "bg-purple-500/20 text-purple-400";
    case "editor":
      return "bg-blue-500/20 text-blue-400";
    case "analyst":
      return "bg-green-500/20 text-green-400";
    default:
      return "bg-terminal-bg-elevated text-muted-foreground";
  }
}

function getTierColor(tier: string) {
  switch (tier) {
    case "enterprise":
      return "text-brand-orange";
    case "professional":
      return "text-purple-400";
    case "basic":
      return "text-market-up";
    default:
      return "text-muted-foreground";
  }
}

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    premium_users: 0,
    admin_count: 0,
    new_today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchUsers = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: Record<string, any> = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      if (selectedRole !== "all") {
        params.role = selectedRole;
      }
      if (selectedTier !== "all") {
        params.subscription_tier = selectedTier;
      }

      const [usersResponse, statsResponse] = await Promise.all([
        adminService.getUsers(params),
        adminService.getUserStats(),
      ]);

      setUsers(usersResponse.results || []);
      setPagination(prev => ({
        ...prev,
        total: usersResponse.count || 0,
      }));
      setStats(statsResponse);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.pageSize, searchQuery, selectedRole, selectedTier]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [selectedRole, selectedTier]);

  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedUsers.length === 0) return;

    const confirmed = action === "delete"
      ? window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)
      : true;

    if (!confirmed) return;

    setActionLoading(true);

    // Optimistic update
    const previousUsers = [...users];
    if (action === "delete") {
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
    } else if (action === "activate") {
      setUsers(prev =>
        prev.map(u =>
          selectedUsers.includes(u.id) ? { ...u, is_active: true } : u
        )
      );
    } else if (action === "deactivate") {
      setUsers(prev =>
        prev.map(u =>
          selectedUsers.includes(u.id) ? { ...u, is_active: false } : u
        )
      );
    }

    try {
      await adminService.bulkUserAction(action, selectedUsers);
      toast.success(`Successfully ${action}d ${selectedUsers.length} user(s)`);
      setSelectedUsers([]);
      fetchUsers(true);
    } catch (err) {
      console.error(`Failed to ${action} users:`, err);
      toast.error(`Failed to ${action} users. Please try again.`);
      setUsers(previousUsers);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    const previousUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== id));

    try {
      await adminService.deleteUser(id);
      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error("Failed to delete user");
      setUsers(previousUsers);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          </button>
          <Link
            href="/admin/users/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-brand-orange" />
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.total_users > 0 ? stats.total_users.toLocaleString() : pagination.total.toLocaleString() || "0"}
            </div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-brand-orange" />
              <span className="text-sm text-muted-foreground">Premium</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.premium_users > 0 ? stats.premium_users.toLocaleString() : "-"}
            </div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-brand-orange" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.admin_count > 0 ? stats.admin_count : "-"}
            </div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-brand-orange" />
              <span className="text-sm text-muted-foreground">New Today</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.new_today > 0 ? `+${stats.new_today}` : "-"}
            </div>
          </div>
        </div>
      )}

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
          <button
            onClick={() => handleBulkAction("activate")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm bg-market-up/20 text-market-up rounded hover:bg-market-up/30 disabled:opacity-50"
          >
            Activate
          </button>
          <button
            onClick={() => handleBulkAction("deactivate")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 disabled:opacity-50"
          >
            Deactivate
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30 disabled:opacity-50"
          >
            Delete
          </button>
          {actionLoading && <LoadingSpinner size="sm" />}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-market-down/10 border border-market-down/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-market-down" />
          <p className="text-market-down">{error}</p>
          <button
            onClick={() => fetchUsers()}
            className="ml-auto px-3 py-1 text-sm bg-market-down/20 text-market-down rounded hover:bg-market-down/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <div className="col-span-1">
              <Skeleton className="h-5 w-5 rounded" />
            </div>
            <div className="col-span-3">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Subscription</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Last Login</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <LoadingSkeleton type="user-row" count={10} />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
          <div className="text-muted-foreground mb-4">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-sm">
              {searchQuery || selectedRole !== "all" || selectedTier !== "all"
                ? "Try adjusting your filters or search query."
                : "No users have registered yet."}
            </p>
          </div>
        </div>
      ) : (
        /* Users Table */
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden relative">
          {refreshing && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-orange/20">
              <div className="h-full bg-brand-orange animate-pulse" style={{ width: "100%" }} />
            </div>
          )}
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
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
            {users.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center",
                  selectedUsers.includes(user.id) && "bg-brand-orange/5"
                )}
              >
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleSelectUser(user.id)}
                    className="rounded border-terminal-border"
                  />
                </div>
                <div className="col-span-3 min-w-0">
                  <div className="font-medium truncate">
                    {user.full_name || `${user.first_name} ${user.last_name}`}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 flex-shrink-0" />
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
                    {user.role?.replace("_", " ") || "subscriber"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn("text-sm capitalize", getTierColor(user.subscription_tier))}>
                    {user.subscription_tier || "free"}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center">
                  {user.is_active ? (
                    <CheckCircle className="h-5 w-5 text-market-up" />
                  ) : (
                    <XCircle className="h-5 w-5 text-market-down" />
                  )}
                </div>
                <div className="col-span-2 text-right text-sm text-muted-foreground">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString("en-ZA", {
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
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground px-2">
              Page {pagination.page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
