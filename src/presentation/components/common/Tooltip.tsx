import { type ReactNode, useCallback, useRef, useState } from 'react';

/**
 * Props for Tooltip component
 */
export interface TooltipProps {
  /** Content to display in the tooltip */
  content: ReactNode;
  /** Element that triggers the tooltip */
  children: ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Additional className for the tooltip */
  className?: string;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

/**
 * Get position classes for tooltip
 */
function getPositionClasses(position: TooltipProps['position']): string {
  switch (position) {
    case 'top':
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    case 'right':
      return 'left-full top-1/2 -translate-y-1/2 ml-2';
    case 'bottom':
      return 'top-full left-1/2 -translate-x-1/2 mt-2';
    case 'left':
      return 'right-full top-1/2 -translate-y-1/2 mr-2';
    default:
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
  }
}

/**
 * Get arrow classes for tooltip
 */
function getArrowClasses(position: TooltipProps['position']): string {
  const baseClasses = 'absolute w-2 h-2 bg-gray-900 rotate-45';

  switch (position) {
    case 'top':
      return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2`;
    case 'right':
      return `${baseClasses} -left-1 top-1/2 -translate-y-1/2`;
    case 'bottom':
      return `${baseClasses} -top-1 left-1/2 -translate-x-1/2`;
    case 'left':
      return `${baseClasses} -right-1 top-1/2 -translate-y-1/2`;
    default:
      return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2`;
  }
}

/**
 * Tooltip component for displaying hover information.
 *
 * @example
 * <Tooltip content="This is helpful information">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * @example
 * <Tooltip content="Settings" position="right">
 *   <IconButton icon={<SettingsIcon />} />
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    },
    [isVisible, hideTooltip]
  );

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onKeyDown={handleKeyDown}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-2 py-1 text-xs font-medium text-white
            bg-gray-900 rounded shadow-lg whitespace-nowrap
            animate-in fade-in duration-150
            ${getPositionClasses(position)}
            ${className}
          `}
          role="tooltip"
        >
          {content}
          <span className={getArrowClasses(position)} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/**
 * Info icon SVG component
 */
function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Props for InfoTooltip component
 */
export interface InfoTooltipProps {
  /** Title for the tooltip */
  title?: string;
  /** Main content/description */
  content: React.ReactNode;
  /** Position of the tooltip */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Size of the info icon */
  iconSize?: 'small' | 'medium';
  /** Additional className for the icon */
  iconClassName?: string;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

/**
 * InfoTooltip component displays an info icon that shows detailed content on hover.
 * Ideal for explaining formulas, metrics, or providing contextual help.
 *
 * @example
 * <InfoTooltip
 *   title="Health Score"
 *   content="Calculated based on activity, login recency, and more."
 * />
 */
export function InfoTooltip({
  title,
  content,
  position = 'top',
  iconSize = 'small',
  iconClassName = '',
  disabled = false,
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  }, [disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    },
    [isVisible, hideTooltip]
  );

  const iconSizeClasses = iconSize === 'small' ? 'w-4 h-4' : 'w-5 h-5';

  if (disabled) {
    return null;
  }

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`
          ${iconSizeClasses} text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
          transition-colors cursor-help focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-surface-800 rounded-full
          ${iconClassName}
        `}
        aria-label={title ? `Info about ${title}` : 'More information'}
        tabIndex={0}
      >
        <InfoIcon className={iconSizeClasses} />
      </button>
      {isVisible && (
        <div
          className={`
            absolute z-50 p-3 text-sm bg-white dark:bg-surface-800 rounded-lg shadow-lg
            border border-gray-200 dark:border-surface-700 min-w-64 max-w-sm
            animate-in fade-in duration-150
            ${getPositionClasses(position)}
          `}
          role="tooltip"
        >
          {title && (
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</p>
          )}
          <div className="text-gray-600 dark:text-gray-400">{content}</div>
        </div>
      )}
    </div>
  );
}
