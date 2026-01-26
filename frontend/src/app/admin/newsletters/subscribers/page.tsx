"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  Upload,
  Mail,
  Users,
  UserPlus,
  Filter,
  MoreVertical,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: "free" | "basic" | "premium";
  status: "active" | "unsubscribed" | "bounced";
  subscribedAt: string;
  lastEmailSent: string;
  openRate: number;
}

const mockSubscribers: Subscriber[] = [
  {
    id: "1",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    tier: "premium",
    status: "active",
    subscribedAt: "2024-01-15",
    lastEmailSent: "2024-01-25",
    openRate: 78,
  },
  {
    id: "2",
    email: "jane.smith@company.co",
    firstName: "Jane",
    lastName: "Smith",
    tier: "free",
    status: "active",
    subscribedAt: "2024-01-10",
    lastEmailSent: "2024-01-25",
    openRate: 45,
  },
  {
    id: "3",
    email: "bob.wilson@gmail.com",
    firstName: "Bob",
    lastName: "Wilson",
    tier: "basic",
    status: "unsubscribed",
    subscribedAt: "2023-12-01",
    lastEmailSent: "2024-01-20",
    openRate: 12,
  },
  {
    id: "4",
    email: "alice.johnson@business.org",
    firstName: "Alice",
    lastName: "Johnson",
    tier: "premium",
    status: "active",
    subscribedAt: "2024-01-20",
    lastEmailSent: "2024-01-25",
    openRate: 92,
  },
  {
    id: "5",
    email: "invalid@bounced.com",
    firstName: "Invalid",
    lastName: "Email",
    tier: "free",
    status: "bounced",
    subscribedAt: "2024-01-05",
    lastEmailSent: "2024-01-15",
    openRate: 0,
  },
];

export default function SubscribersPage() {
  const [subscribers] = useState<Subscriber[]>(mockSubscribers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === "all" || sub.tier === filterTier;
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscribers.map((s) => s.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/newsletters"
            className="p-2 hover:bg-terminal-bg-secondary rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your newsletter subscriber list
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Subscriber
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total Subscribers</span>
          </div>
          <div className="text-2xl font-bold">12,456</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 text-market-up mb-1">
            <Check className="h-4 w-4" />
            <span className="text-sm">Active</span>
          </div>
          <div className="text-2xl font-bold">11,234</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 text-yellow-500 mb-1">
            <X className="h-4 w-4" />
            <span className="text-sm">Unsubscribed</span>
          </div>
          <div className="text-2xl font-bold">1,122</div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-2 text-market-down mb-1">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Bounced</span>
          </div>
          <div className="text-2xl font-bold">100</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-brand-orange/10 border border-brand-orange/30 rounded-lg">
          <span className="text-sm">
            {selectedIds.length} subscriber(s) selected
          </span>
          <button className="px-3 py-1 bg-terminal-bg-elevated border border-terminal-border rounded text-sm hover:bg-terminal-bg">
            Send Email
          </button>
          <button className="px-3 py-1 bg-market-down/20 text-market-down border border-market-down/30 rounded text-sm hover:bg-market-down/30">
            <Trash2 className="h-4 w-4 inline mr-1" />
            Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-terminal-bg border-b border-terminal-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredSubscribers.length}
                  onChange={toggleSelectAll}
                  className="rounded border-terminal-border"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Subscriber
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Subscribed
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Open Rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border">
            {filteredSubscribers.map((subscriber) => (
              <tr key={subscriber.id} className="hover:bg-terminal-bg-elevated">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(subscriber.id)}
                    onChange={() => toggleSelect(subscriber.id)}
                    className="rounded border-terminal-border"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">
                      {subscriber.firstName} {subscriber.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {subscriber.email}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-1 text-xs rounded capitalize",
                      subscriber.tier === "premium"
                        ? "bg-brand-orange/20 text-brand-orange"
                        : subscriber.tier === "basic"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-terminal-bg-elevated text-muted-foreground"
                    )}
                  >
                    {subscriber.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-1 text-xs rounded capitalize",
                      subscriber.status === "active"
                        ? "bg-market-up/20 text-market-up"
                        : subscriber.status === "unsubscribed"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-market-down/20 text-market-down"
                    )}
                  >
                    {subscriber.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(subscriber.subscribedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-terminal-bg-elevated rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          subscriber.openRate >= 70
                            ? "bg-market-up"
                            : subscriber.openRate >= 40
                            ? "bg-yellow-500"
                            : "bg-market-down"
                        )}
                        style={{ width: `${subscriber.openRate}%` }}
                      />
                    </div>
                    <span className="text-sm">{subscriber.openRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 hover:bg-terminal-bg-elevated rounded">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
