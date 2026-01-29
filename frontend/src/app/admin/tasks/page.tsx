"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService, type EditorialAssignment } from "@/services/api/editorial";
import { toast } from "sonner";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

const priorityColors: Record<string, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-yellow-400",
  HIGH: "text-orange-400",
  URGENT: "text-market-down",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  ACCEPTED: "bg-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-purple-500/20 text-purple-400",
  SUBMITTED: "bg-cyan-500/20 text-cyan-400",
  COMPLETED: "bg-market-up/20 text-market-up",
  REJECTED: "bg-market-down/20 text-market-down",
};

const typeLabels: Record<string, string> = {
  WRITE: "Write",
  EDIT: "Edit",
  REVIEW: "Review",
  PROOFREAD: "Proofread",
  FACT_CHECK: "Fact Check",
};

function TaskSkeleton() {
  return (
    <div className="divide-y divide-terminal-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-5 bg-terminal-bg rounded w-3/4 mb-2" />
              <div className="h-4 bg-terminal-bg rounded w-1/2 mb-2" />
              <div className="flex gap-4">
                <div className="h-3 bg-terminal-bg rounded w-24" />
                <div className="h-3 bg-terminal-bg rounded w-20" />
              </div>
            </div>
            <div className="h-6 bg-terminal-bg rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const [assignments, setAssignments] = useState<EditorialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await editorialService.getAllAssignments({
        status: statusFilter || undefined,
      });
      setAssignments(data);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleAccept = async (assignmentId: number) => {
    setActionLoading(assignmentId);
    try {
      await editorialService.acceptAssignment(assignmentId);
      toast.success("Task accepted");
      fetchAssignments();
    } catch (error) {
      toast.error("Failed to accept task");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (assignmentId: number) => {
    setActionLoading(assignmentId);
    try {
      await editorialService.completeAssignment(assignmentId);
      toast.success("Task completed");
      fetchAssignments();
    } catch (error) {
      toast.error("Failed to complete task");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      assignment.article?.title?.toLowerCase().includes(query) ||
      assignment.assigned_to?.full_name?.toLowerCase().includes(query) ||
      assignment.assigned_by?.full_name?.toLowerCase().includes(query)
    );
  });

  const pendingCount = assignments.filter((a) =>
    ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(a.status)
  ).length;

  const overdueCount = assignments.filter((a) => {
    if (!a.due_date) return false;
    return new Date(a.due_date) < new Date() && !["COMPLETED", "REJECTED"].includes(a.status);
  }).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Tasks & Assignments</h1>
          <p className="text-muted-foreground">
            Manage editorial tasks and track progress.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending Tasks</div>
            </div>
          </div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-market-down/20 text-market-down flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overdueCount}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>
        </div>
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-market-up/20 text-market-up flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {assignments.filter((a) => a.status === "COMPLETED").length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
        <div className="p-4 border-b border-terminal-border">
          <h2 className="font-semibold">All Tasks ({filteredAssignments.length})</h2>
        </div>

        {isLoading ? (
          <TaskSkeleton />
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter
                ? "Try adjusting your filters."
                : "No tasks have been assigned yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-terminal-border">
            {filteredAssignments.map((assignment) => {
              const isOverdue = assignment.due_date &&
                new Date(assignment.due_date) < new Date() &&
                !["COMPLETED", "REJECTED"].includes(assignment.status);

              return (
                <div
                  key={assignment.id}
                  className="p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded",
                          priorityColors[assignment.priority] || "text-muted-foreground",
                          assignment.priority === "URGENT" && "bg-market-down/20",
                          assignment.priority === "HIGH" && "bg-orange-500/20"
                        )}>
                          {assignment.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {typeLabels[assignment.assignment_type] || assignment.assignment_type}
                        </span>
                      </div>

                      <Link
                        href={`/admin/articles/${assignment.article?.id || assignment.article}`}
                        className="font-medium hover:text-brand-orange transition-colors line-clamp-1"
                      >
                        {assignment.article?.title || "Article"}
                      </Link>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {assignment.assigned_to?.full_name || "Unassigned"}
                        </span>
                        {assignment.due_date && (
                          <span className={cn(
                            "flex items-center gap-1",
                            isOverdue && "text-market-down"
                          )}>
                            <Clock className="h-3 w-3" />
                            {isOverdue && "Overdue: "}
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs">
                          by {assignment.assigned_by?.full_name || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        statusColors[assignment.status] || "bg-gray-500/20 text-gray-400"
                      )}>
                        {assignment.status?.replace("_", " ")}
                      </span>

                      {assignment.status === "PENDING" && (
                        <button
                          onClick={() => handleAccept(assignment.id)}
                          disabled={actionLoading === assignment.id}
                          className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === assignment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Accept"
                          )}
                        </button>
                      )}

                      {["ACCEPTED", "IN_PROGRESS", "SUBMITTED"].includes(assignment.status) && (
                        <button
                          onClick={() => handleComplete(assignment.id)}
                          disabled={actionLoading === assignment.id}
                          className="px-3 py-1 text-xs bg-market-up/20 text-market-up rounded hover:bg-market-up/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === assignment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Complete"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
