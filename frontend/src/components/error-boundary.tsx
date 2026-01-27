"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Use this to prevent the entire app from crashing when a component fails.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you could send this to an error tracking service
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-terminal-bg-elevated border border-terminal-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer mb-2">
                  Error details (dev only)
                </summary>
                <pre className="p-3 bg-terminal-bg rounded text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md text-sm font-medium hover:bg-brand-orange-dark transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 border border-terminal-border rounded-md text-sm font-medium hover:bg-terminal-bg transition-colors"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Simple error fallback component for use with Suspense
 */
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <div className="p-6 text-center">
      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="h-5 w-5 text-red-500" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Failed to load this section
      </p>
      {resetError && (
        <button
          onClick={resetError}
          className="text-sm text-brand-orange hover:text-brand-orange-light"
        >
          Try again
        </button>
      )}
    </div>
  );
}
