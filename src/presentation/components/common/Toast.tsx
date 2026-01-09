import { useCallback, useEffect, useRef, useState } from 'react';

import type { Toast as ToastType, ToastType as ToastVariant } from '@presentation/stores';

/**
 * Props for Toast component
 */
export interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

/**
 * Get icon for toast type
 */
function ToastIcon({ type }: { type: ToastVariant }) {
  const iconClasses = 'h-5 w-5 flex-shrink-0';

  switch (type) {
    case 'success':
      return (
        <svg
          className={`${iconClasses} text-green-400`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'error':
      return (
        <svg
          className={`${iconClasses} text-red-400`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg
          className={`${iconClasses} text-yellow-400`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'info':
      return (
        <svg
          className={`${iconClasses} text-blue-400`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

/**
 * Get background color classes for toast type
 */
function getToastStyles(type: ToastVariant): string {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800';
  }
}

/**
 * Default toast duration in milliseconds
 */
const DEFAULT_DURATION = 5000;

/**
 * Animation duration in milliseconds
 */
const ANIMATION_DURATION = 300;

/**
 * Individual toast notification component.
 * Features:
 * - Auto-dismiss after configurable duration
 * - Pause timer on hover
 * - Dismiss with Escape key
 * - Slide-in/out animations
 * - Accessible with ARIA attributes
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, type, title, message, duration = DEFAULT_DURATION, dismissible = true } = toast;
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef<number>(0);
  const toastRef = useRef<HTMLDivElement>(null);

  // Handle dismiss with exit animation
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before removing
    setTimeout(() => {
      onDismiss(id);
    }, ANIMATION_DURATION);
  }, [id, onDismiss]);

  // Pause the auto-dismiss timer
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  }, []);

  // Start or resume the auto-dismiss timer
  const startTimer = useCallback(() => {
    if (duration <= 0) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, remainingTimeRef.current);
  }, [duration, handleDismiss]);

  // Trigger enter animation on mount
  useEffect(() => {
    // Small delay to ensure CSS transition triggers
    const animationTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(animationTimeout);
  }, []);

  // Start timer on mount and handle pause state changes
  useEffect(() => {
    if (duration > 0 && !isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, isPaused, startTimer]);

  // Handle mouse enter for pause
  const handleMouseEnter = useCallback(() => {
    if (duration > 0) {
      setIsPaused(true);
      pauseTimer();
    }
  }, [duration, pauseTimer]);

  // Handle mouse leave to resume
  const handleMouseLeave = useCallback(() => {
    if (duration > 0) {
      setIsPaused(false);
    }
  }, [duration]);

  // Handle keyboard dismiss
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        handleDismiss();
      }
    },
    [dismissible, handleDismiss]
  );

  // Focus management for keyboard interaction
  useEffect(() => {
    const toastElement = toastRef.current;
    if (toastElement) {
      // Make focusable for keyboard dismiss
      toastElement.setAttribute('tabindex', '-1');
    }
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const animationClasses = prefersReducedMotion
    ? ''
    : isExiting
      ? 'animate-toast-exit'
      : isVisible
        ? 'animate-toast-enter'
        : 'opacity-0 translate-x-full';

  return (
    <div
      ref={toastRef}
      className={`
        pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg
        transition-all duration-300 ease-out
        ${getToastStyles(type)}
        ${animationClasses}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start">
        <ToastIcon type={type} />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            className="ml-4 inline-flex rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
