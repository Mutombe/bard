"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Mail,
  Send,
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Newsletter {
  id: string;
  subject: string;
  type: "daily" | "weekly" | "special";
  status: "draft" | "scheduled" | "sent";
  recipients: number;
  openRate?: number;
  clickRate?: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

const mockNewsletters: Newsletter[] = [
  {
    id: "1",
    subject: "Daily Market Brief - January 24, 2025",
    type: "daily",
    status: "sent",
    recipients: 45234,
    openRate: 42.5,
    clickRate: 8.3,
    sentAt: "2025-01-24T06:00:00Z",
    createdAt: "2025-01-23T18:00:00Z",
  },
  {
    id: "2",
    subject: "Weekly Digest: JSE Hits Record High",
    type: "weekly",
    status: "sent",
    recipients: 68456,
    openRate: 38.2,
    clickRate: 12.1,
    sentAt: "2025-01-20T09:00:00Z",
    createdAt: "2025-01-19T14:00:00Z",
  },
  {
    id: "3",
    subject: "Daily Market Brief - January 25, 2025",
    type: "daily",
    status: "scheduled",
    recipients: 45500,
    scheduledAt: "2025-01-25T06:00:00Z",
    createdAt: "2025-01-24T16:00:00Z",
  },
  {
    id: "4",
    subject: "Special Report: Mining Sector Outlook",
    type: "special",
    status: "draft",
    recipients: 0,
    createdAt: "2025-01-24T10:00:00Z",
  },
];

const stats = [
  { label: "Total Subscribers", value: "68,456", icon: Users, change: "+5.2%" },
  { label: "Avg Open Rate", value: "40.3%", icon: Eye, change: "+2.1%" },
  { label: "Newsletters Sent", value: "1,247", icon: Send, change: "+12" },
  { label: "Click Rate", value: "10.2%", icon: BarChart3, change: "+0.8%" },
];

function getStatusColor(status: Newsletter["status"]) {
  switch (status) {
    case "sent":
      return "bg-market-up/20 text-market-up";
    case "scheduled":
      return "bg-blue-500/20 text-blue-400";
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
  }
}

function getTypeLabel(type: Newsletter["type"]) {
  switch (type) {
    case "daily":
      return "Daily Brief";
    case "weekly":
      return "Weekly Digest";
    case "special":
      return "Special Report";
  }
}

export default function NewslettersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const filteredNewsletters = mockNewsletters.filter((newsletter) => {
    const matchesSearch = newsletter.subject
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" || newsletter.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Newsletters</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage email newsletters.
          </p>
        </div>
        <Link
          href="/admin/newsletters/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Newsletter
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-5 w-5 text-brand-orange" />
              <span className="text-xs text-market-up">{stat.change}</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search newsletters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          <option value="all">All Types</option>
          <option value="daily">Daily Brief</option>
          <option value="weekly">Weekly Digest</option>
          <option value="special">Special Reports</option>
        </select>
      </div>

      {/* Newsletters Table */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
          <div className="col-span-5">Subject</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Recipients</div>
          <div className="col-span-1 text-right">Open %</div>
          <div className="col-span-1 text-right">Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-terminal-border">
          {filteredNewsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
            >
              <div className="col-span-5">
                <Link
                  href={`/admin/newsletters/${newsletter.id}`}
                  className="font-medium hover:text-brand-orange transition-colors line-clamp-1"
                >
                  {newsletter.subject}
                </Link>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded">
                  {getTypeLabel(newsletter.type)}
                </span>
              </div>
              <div className="col-span-1 flex justify-center">
                <span
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize",
                    getStatusColor(newsletter.status)
                  )}
                >
                  {newsletter.status === "sent" && <CheckCircle className="h-3 w-3" />}
                  {newsletter.status === "scheduled" && <Clock className="h-3 w-3" />}
                  {newsletter.status}
                </span>
              </div>
              <div className="col-span-1 text-right text-sm">
                {newsletter.recipients > 0
                  ? newsletter.recipients.toLocaleString()
                  : "-"}
              </div>
              <div className="col-span-1 text-right text-sm">
                {newsletter.openRate ? `${newsletter.openRate}%` : "-"}
              </div>
              <div className="col-span-1 text-right text-sm text-muted-foreground">
                {new Date(
                  newsletter.sentAt || newsletter.scheduledAt || newsletter.createdAt
                ).toLocaleDateString("en-ZA", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <Link
                  href={`/admin/newsletters/${newsletter.id}`}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                {newsletter.status === "draft" && (
                  <button className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriber Management Link */}
      <div className="mt-6 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Subscriber Management</h3>
            <p className="text-sm text-muted-foreground">
              View, export, and manage newsletter subscribers.
            </p>
          </div>
          <Link
            href="/admin/newsletters/subscribers"
            className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors text-sm"
          >
            Manage Subscribers
          </Link>
        </div>
      </div>
    </div>
  );
}
