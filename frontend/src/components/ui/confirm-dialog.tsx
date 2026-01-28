"use client";

import * as React from "react";
import { AlertTriangle, Trash2, Info, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { cn } from "@/lib/utils";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

const variantConfig: Record<
  ConfirmVariant,
  { icon: React.ElementType; iconClass: string; buttonClass: string }
> = {
  danger: {
    icon: Trash2,
    iconClass: "text-market-down bg-market-down/10",
    buttonClass: "bg-market-down hover:bg-market-down/90 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-yellow-500 bg-yellow-500/10",
    buttonClass: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500 bg-blue-500/10",
    buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="pb-2">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full",
                config.iconClass
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2",
              config.buttonClass
            )}
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
interface UseConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean;
    loading: boolean;
    options: UseConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    loading: false,
    options: { title: "", description: "" },
    resolve: null,
  });

  const confirm = React.useCallback(
    (options: UseConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          loading: false,
          options,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  const ConfirmDialogComponent = React.useMemo(
    () => (
      <ConfirmDialog
        open={state.open}
        onOpenChange={handleOpenChange}
        title={state.options.title}
        description={state.options.description}
        confirmLabel={state.options.confirmLabel}
        cancelLabel={state.options.cancelLabel}
        variant={state.options.variant}
        loading={state.loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [state, handleOpenChange, handleConfirm, handleCancel]
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
