"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Heart,
  Reply,
  MoreHorizontal,
  Edit2,
  Trash2,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/loading";
import { useAppSelector } from "@/store";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { newsService, type Comment } from "@/services/api/news";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";

// LocalStorage key for draft comments
const DRAFT_COMMENT_KEY = "bardiq_draft_comment";

interface DraftComment {
  articleId: string;
  content: string;
  timestamp: number;
}

function saveDraftComment(articleId: string, content: string) {
  if (typeof window === "undefined") return;
  const draft: DraftComment = {
    articleId,
    content,
    timestamp: Date.now(),
  };
  localStorage.setItem(DRAFT_COMMENT_KEY, JSON.stringify(draft));
}

function getDraftComment(articleId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(DRAFT_COMMENT_KEY);
    if (!stored) return null;
    const draft: DraftComment = JSON.parse(stored);
    // Only return if it's for this article and less than 24 hours old
    if (draft.articleId === articleId && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
      return draft.content;
    }
    return null;
  } catch {
    return null;
  }
}

function clearDraftComment() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_COMMENT_KEY);
}

interface CommentSectionProps {
  articleId: string;
  className?: string;
}

export function CommentSection({ articleId, className }: CommentSectionProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Fetch comments
  const { data, error, isLoading } = useSWR(
    articleId ? `comments-${articleId}` : null,
    () => newsService.getComments(articleId),
    { revalidateOnFocus: false }
  );

  const comments = data?.results || [];
  const totalComments = data?.count || 0;

  // Load draft comment on mount and after authentication
  useEffect(() => {
    setHasMounted(true);
    const draft = getDraftComment(articleId);
    if (draft) {
      setNewComment(draft);
    }
  }, [articleId]);

  // When user authenticates and there's a draft, try to submit it
  useEffect(() => {
    if (isAuthenticated && hasMounted) {
      const draft = getDraftComment(articleId);
      if (draft && draft.trim()) {
        // User just logged in and has a draft - keep it in the textarea
        setNewComment(draft);
      }
    }
  }, [isAuthenticated, articleId, hasMounted]);

  // Handle new comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    // If not authenticated, save draft and show auth modal
    if (!isAuthenticated) {
      saveDraftComment(articleId, newComment);
      openLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      await newsService.createComment({
        article: articleId,
        content: newComment.trim(),
      });
      setNewComment("");
      clearDraftComment();
      mutate(`comments-${articleId}`);
      toast.success("Comment posted successfully");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={cn("mt-12 pt-8 border-t border-border", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          Comments {totalComments > 0 && `(${totalComments})`}
        </h2>
      </div>

      {/* New Comment Form - Always show textarea */}
      <form onSubmit={handleSubmitComment} className="mb-8">
        <div className="flex gap-3">
          <UserAvatar
            src={user?.profile?.avatar}
            name={isAuthenticated ? user?.full_name : undefined}
            identifier={user?.id}
            size="md"
          />
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthenticated ? "Share your thoughts..." : "Write a comment... (you'll need to sign in to post)"}
              className="min-h-[100px] resize-none"
              maxLength={2000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/2000
              </span>
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isAuthenticated ? "Post Comment" : "Sign in to Post"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <CommentsSkeleton />
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Unable to load comments</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                articleId={articleId}
                currentUserId={user?.id}
                isAuthenticated={isAuthenticated}
                openLogin={openLogin}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  articleId: string;
  currentUserId?: string;
  isAuthenticated: boolean;
  isReply?: boolean;
  openLogin: () => void;
}

function CommentItem({
  comment,
  articleId,
  currentUserId,
  isAuthenticated,
  isReply = false,
  openLogin,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likes_count);
  const [localIsLiked, setLocalIsLiked] = useState(comment.is_liked);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    // Optimistic update
    setLocalIsLiked(!localIsLiked);
    setLocalLikeCount(localIsLiked ? localLikeCount - 1 : localLikeCount + 1);

    try {
      const result = await newsService.likeComment(comment.id);
      setLocalLikeCount(result.likes_count);
      setLocalIsLiked(result.liked);
    } catch (err) {
      // Revert on error
      setLocalIsLiked(comment.is_liked);
      setLocalLikeCount(comment.likes_count);
      toast.error("Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await newsService.updateComment(comment.id, editContent.trim());
      setIsEditing(false);
      mutate(`comments-${articleId}`);
      toast.success("Comment updated");
    } catch (err) {
      toast.error("Failed to update comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await newsService.deleteComment(comment.id);
      mutate(`comments-${articleId}`);
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      await newsService.createComment({
        article: articleId,
        content: replyContent.trim(),
        parent: comment.id,
      });
      setReplyContent("");
      setIsReplying(false);
      mutate(`comments-${articleId}`);
      toast.success("Reply posted");
    } catch (err) {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setIsReplying(!isReplying);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(isReply && "ml-12 pl-4 border-l-2 border-border")}
    >
      <div className="flex gap-3">
        <UserAvatar
          src={comment.author.avatar}
          name={comment.author.full_name}
          identifier={comment.author.id?.toString()}
          size={isReply ? "sm" : "md"}
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.full_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={2000}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editContent.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  localIsLiked
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart
                  className={cn("h-4 w-4", localIsLiked && "fill-current")}
                />
                {localLikeCount > 0 && <span>{localLikeCount}</span>}
              </button>

              {!isReply && (
                <button
                  onClick={handleReplyClick}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="h-4 w-4" />
                  Reply
                </button>
              )}

              {(comment.can_edit || comment.can_delete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {comment.can_edit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {comment.can_delete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply Form */}
          <AnimatePresence>
            {isReplying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.full_name}...`}
                  className="min-h-[80px] resize-none"
                  maxLength={2000}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  articleId={articleId}
                  currentUserId={currentUserId}
                  isAuthenticated={isAuthenticated}
                  openLogin={openLogin}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
