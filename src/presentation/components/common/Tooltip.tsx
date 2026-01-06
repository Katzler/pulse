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
