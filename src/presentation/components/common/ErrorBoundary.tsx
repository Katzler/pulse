/* eslint-disable react-refresh/only-export-components */
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from './Button';

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI to show on error */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom reset key - when this changes, the error boundary resets */
  resetKey?: string | number;
}

/**
 * State for ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error icon for fallback UI
 */
function ErrorIcon({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <svg
      className={`${className} text-red-400`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

/**
 * Chart error icon
 */
function ChartErrorIcon({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <svg
      className={`${className} text-gray-400 dark:text-gray-500`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

/**
 * Default fallback UI component
 */
function DefaultFallback({
  error,
  onRetry,
  showRetry,
}: {
  error: Error | null;
  onRetry: () => void;
  showRetry: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="alert"
    >
      <ErrorIcon />
      <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {showRetry && (
        <Button
          variant="primary"
          onClick={onRetry}
          className="mt-6"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Root-level fallback for critical errors
 */
function RootFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-surface-950 px-4"
      role="alert"
    >
      <ErrorIcon className="h-20 w-20" />
      <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Something went wrong
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-center max-w-md">
        We're sorry, but something unexpected happened. Please refresh the page to try again.
      </p>
      <div className="mt-8 flex gap-4">
        <Button variant="primary" onClick={onRetry}>
          Refresh page
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

/**
 * Page-level fallback for route errors
 */
function PageFallback({
  error,
  onRetry,
  pageName,
}: {
  error: Error | null;
  onRetry: () => void;
  pageName: string | undefined;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="alert"
    >
      <ErrorIcon />
      <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {pageName ? `Error loading ${pageName}` : 'Page error'}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
        {error?.message || 'This page encountered an error. Please try again or go back to the dashboard.'}
      </p>
      <div className="mt-6 flex gap-4">
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

/**
 * Chart-level fallback for visualization errors
 */
function ChartFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-surface-700"
      role="alert"
    >
      <ChartErrorIcon />
      <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        Chart could not be displayed
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        There was a problem rendering this chart
      </p>
      <Button
        variant="secondary"
        size="small"
        onClick={onRetry}
        className="mt-4"
      >
        Retry
      </Button>
    </div>
  );
}

/**
 * Error boundary component for catching and handling React errors gracefully.
 * Prevents the entire app from crashing when a component throws an error.
 *
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback and error logging
 * <ErrorBoundary
 *   fallback={<div>Custom error UI</div>}
 *   onError={(error) => logErrorToService(error)}
 *   showRetry
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKey changes
    if (
      this.state.hasError &&
      this.props.resetKey !== undefined &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { children, fallback, showRetry = true } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <DefaultFallback
          error={error}
          onRetry={this.handleRetry}
          showRetry={showRetry}
        />
      );
    }

    return children;
  }
}

/**
 * Root error boundary for the entire application.
 * Catches any unhandled error and shows a full-page recovery UI.
 *
 * @example
 * <RootErrorBoundary>
 *   <App />
 * </RootErrorBoundary>
 */
export class RootErrorBoundary extends Component<
  Omit<ErrorBoundaryProps, 'fallback' | 'showRetry'>,
  ErrorBoundaryState
> {
  constructor(props: Omit<ErrorBoundaryProps, 'fallback' | 'showRetry'>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log critical error
    console.error('RootErrorBoundary caught a critical error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { children } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return <RootFallback onRetry={this.handleRetry} />;
    }

    return children;
  }
}

/**
 * Props for PageErrorBoundary
 */
export interface PageErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallback' | 'showRetry'> {
  /** Name of the page for error message */
  pageName?: string;
}

/**
 * Page-level error boundary for route components.
 * Shows page-specific error UI with navigation options.
 *
 * @example
 * <PageErrorBoundary pageName="Customer List">
 *   <CustomerList />
 * </PageErrorBoundary>
 */
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(`PageErrorBoundary (${this.props.pageName || 'unknown'}) caught an error:`, error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: PageErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      this.props.resetKey !== undefined &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { children, pageName } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      return (
        <PageFallback
          error={error}
          onRetry={this.handleRetry}
          pageName={pageName}
        />
      );
    }

    return children;
  }
}

/**
 * Chart-level error boundary for visualization components.
 * Shows a compact error UI that maintains layout.
 *
 * @example
 * <ChartErrorBoundary>
 *   <RevenueChart data={data} />
 * </ChartErrorBoundary>
 */
export class ChartErrorBoundary extends Component<
  Omit<ErrorBoundaryProps, 'fallback' | 'showRetry'>,
  ErrorBoundaryState
> {
  constructor(props: Omit<ErrorBoundaryProps, 'fallback' | 'showRetry'>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('ChartErrorBoundary caught an error:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Omit<ErrorBoundaryProps, 'fallback' | 'showRetry'>): void {
    if (
      this.state.hasError &&
      this.props.resetKey !== undefined &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { children } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return <ChartFallback onRetry={this.handleRetry} />;
    }

    return children;
  }
}

/**
 * HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
