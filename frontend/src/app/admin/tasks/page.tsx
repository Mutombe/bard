"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { editorialService, type EditorialAssignment, type Article } from "@/services/api/editorial";
import { adminService, type AdminUser } from "@/services/api/admin";
import { toast } from "sonner";

// Backend uses lowercase values
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const assignmentTypes = [
  { value: "write", label: "Write" },
  { value: "edit", label: "Edit" },
  { value: "review", label: "Review" },
  { value: "proofread", label: "Proofread" },
  { value: "fact_check", label: "Fact Check" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-market-down",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  accepted: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-purple-500/20 text-purple-400",
  submitted: "bg-cyan-500/20 text-cyan-400",
  completed: "bg-market-up/20 text-market-up",
  cancelled: "bg-market-down/20 text-market-down",
};

const typeLabels: Record<string, string> = {
  write: "Write",
  edit: "Edit",
  review: "Review",
  proofread: "Proofread",
  fact_check: "Fact Check",
};

interface TaskFormData {
  article: string;
  assignee: string;
  assignment_type: string;
  priority: string;
  deadline: string;
  instructions: string;
}

const initialFormData: TaskFormData = {
  article: "",
  assignee: "",
  assignment_type: "edit",
  priority: "medium",
  deadline: "",
  instructions: "",
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<EditorialAssignment | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<EditorialAssignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchArticles = useCallback(async () => {
    try {
      const response = await editorialService.getArticles({ page_size: 100 });
      setArticles(response.results || []);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminService.getUsers({ page_size: 100 });
      setUsers(response.results || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchArticles();
    fetchUsers();
  }, [fetchAssignments, fetchArticles, fetchUsers]);

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

  const openCreateModal = () => {
    setModalMode("create");
    setEditingTask(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (task: EditorialAssignment) => {
    setModalMode("edit");
    setEditingTask(task);
    setFormData({
      article: String(task.article?.id || ""),
      assignee: String(task.assignee?.id || ""),
      assignment_type: task.assignment_type || "edit",
      priority: task.priority || "medium",
      deadline: task.deadline ? task.deadline.split("T")[0] : "",
      instructions: task.instructions || "",
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (task: EditorialAssignment) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.article) {
      toast.error("Please select an article");
      return;
    }
    if (!formData.assignee) {
      toast.error("Please select an assignee");
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === "create") {
        await editorialService.createAssignment({
          article: formData.article,
          assignee: formData.assignee,
          assignment_type: formData.assignment_type,
          priority: formData.priority,
          deadline: formData.deadline || undefined,
          instructions: formData.instructions || undefined,
        });
        toast.success("Task created successfully");
      } else if (editingTask) {
        await editorialService.updateAssignment(editingTask.id, {
          assignment_type: formData.assignment_type,
          priority: formData.priority,
          deadline: formData.deadline || undefined,
          instructions: formData.instructions || undefined,
        });
        toast.success("Task updated successfully");
      }
      setShowModal(false);
      fetchAssignments();
    } catch (error: any) {
      const message = error?.response?.data?.detail ||
                      error?.response?.data?.message ||
                      `Failed to ${modalMode} task`;
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      await editorialService.deleteAssignment(taskToDelete.id);
      toast.success("Task deleted successfully");
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      fetchAssignments();
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to delete task";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      assignment.article?.title?.toLowerCase().includes(query) ||
      assignment.assignee?.full_name?.toLowerCase().includes(query) ||
      assignment.assigned_by?.full_name?.toLowerCase().includes(query)
    );
  });

  const pendingCount = assignments.filter((a) =>
    ["pending", "accepted", "in_progress"].includes(a.status)
  ).length;

  const overdueCount = assignments.filter((a) => {
    if (!a.deadline) return false;
    return new Date(a.deadline) < new Date() && !["completed", "cancelled"].includes(a.status);
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
          onClick={openCreateModal}
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
                {assignments.filter((a) => a.status === "completed").length}
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
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter
                ? "Try adjusting your filters."
                : "No tasks have been assigned yet."}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        ) : (
          <div className="divide-y divide-terminal-border">
            {filteredAssignments.map((assignment) => {
              const isOverdue = assignment.deadline &&
                new Date(assignment.deadline) < new Date() &&
                !["completed", "cancelled"].includes(assignment.status);

              return (
                <div
                  key={assignment.id}
                  className="p-4 hover:bg-terminal-bg-elevated transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded uppercase",
                          priorityColors[assignment.priority] || "text-muted-foreground",
                          assignment.priority === "urgent" && "bg-market-down/20",
                          assignment.priority === "high" && "bg-orange-500/20"
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
                          {assignment.assignee?.full_name || "Unassigned"}
                        </span>
                        {assignment.deadline && (
                          <span className={cn(
                            "flex items-center gap-1",
                            isOverdue && "text-market-down"
                          )}>
                            <Clock className="h-3 w-3" />
                            {isOverdue && "Overdue: "}
                            {new Date(assignment.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs">
                          by {assignment.assigned_by?.full_name || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium capitalize",
                        statusColors[assignment.status] || "bg-gray-500/20 text-gray-400"
                      )}>
                        {assignment.status?.replace("_", " ")}
                      </span>

                      {assignment.status === "pending" && (
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

                      {["accepted", "in_progress", "submitted"].includes(assignment.status) && (
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

                      <button
                        onClick={() => openEditModal(assignment)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => openDeleteConfirm(assignment)}
                        className="p-1.5 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => !isSaving && setShowModal(false)} />
          <div className="relative bg-terminal-bg-secondary border border-terminal-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h3 className="text-lg font-semibold">
                {modalMode === "create" ? "Create New Task" : "Edit Task"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="p-2 hover:bg-terminal-bg rounded transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Article Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Article <span className="text-market-down">*</span>
                </label>
                <select
                  value={formData.article}
                  onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                  disabled={modalMode === "edit"}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange disabled:opacity-50"
                >
                  <option value="">Select an article...</option>
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Assign To <span className="text-market-down">*</span>
                </label>
                <select
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  disabled={modalMode === "edit"}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange disabled:opacity-50"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} {user.role && `(${user.role})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Task Type</label>
                <select
                  value={formData.assignment_type}
                  onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                >
                  {assignmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium mb-2">Instructions / Notes</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Add any instructions or notes for the assignee..."
                  rows={3}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-terminal-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {modalMode === "create" ? "Creating..." : "Saving..."}
                    </>
                  ) : (
                    modalMode === "create" ? "Create Task" : "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <div className="relative bg-terminal-bg-secondary border border-terminal-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Task?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this task for "{taskToDelete.article?.title}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-market-down text-white rounded-md hover:bg-market-down/80 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
