import { type ReactNode } from 'react';

import { Card } from './Card';

/**
 * Trend direction for metric comparison
 */
export interface MetricTrend {
  /** Direction of the trend */
  direction: 'up' | 'down' | 'neutral';
  /** Display value for the trend (e.g., "5%", "3 pts") */
  value: string;
  /** Whether this trend direction is positive (good) for this metric */
  isPositive: boolean;
}

/**
 * Props for MetricCard component
 */
export interface MetricCardProps {
  /** Title displayed above the value */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Optional trend indicator */
  trend?: MetricTrend;
  /** Color theme for the card */
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional click handler for navigation */
  onClick?: () => void;
  /** Size variant - large for featured metrics */
  size?: 'standard' | 'large';
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Color styles for different themes
 */
const colorStyles = {
  blue: {
    icon: 'text-blue-600 bg-blue-100',
    accent: 'border-l-blue-500',
  },
  green: {
    icon: 'text-green-600 bg-green-100',
    accent: 'border-l-green-500',
  },
  orange: {
    icon: 'text-orange-600 bg-orange-100',
    accent: 'border-l-orange-500',
  },
  purple: {
    icon: 'text-purple-600 bg-purple-100',
    accent: 'border-l-purple-500',
  },
  red: {
    icon: 'text-red-600 bg-red-100',
    accent: 'border-l-red-500',
  },
  gray: {
    icon: 'text-gray-600 bg-gray-100',
    accent: 'border-l-gray-500',
  },
};

/**
 * Trend arrow component
 */
function TrendArrow({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  if (direction === 'up') {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    );
  }
  if (direction === 'down') {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    );
  }
  // Neutral dash
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

/**
 * Metric card component for displaying KPIs with optional trends.
 * Used on the dashboard to show key metrics at a glance.
 *
 * @example
 * // Basic metric
 * <MetricCard
 *   title="Total Customers"
 *   value={1234}
 *   icon={<UsersIcon />}
 *   color="blue"
 * />
 *
 * @example
 * // With trend indicator
 * <MetricCard
 *   title="Active Customers"
 *   value={987}
 *   icon={<CheckIcon />}
 *   color="green"
 *   trend={{ direction: 'up', value: '5%', isPositive: true }}
 * />
 */
export function MetricCard({
  title,
  value,
  icon,
  trend,
  color = 'gray',
  subtitle,
  onClick,
  size = 'standard',
  'data-testid': testId,
}: MetricCardProps) {
  const styles = colorStyles[color];
  const isClickable = onClick !== undefined;
  const isLarge = size === 'large';

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p
            className={`mt-1 font-bold text-gray-900 ${
              isLarge ? 'text-4xl' : 'text-2xl'
            }`}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={`rounded-lg p-2 ${styles.icon}`}
            aria-hidden="true"
          >
            <div className={isLarge ? 'h-6 w-6' : 'h-5 w-5'}>{icon}</div>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={`flex items-center text-sm font-medium ${
              trend.direction === 'neutral'
                ? 'text-gray-500'
                : trend.isPositive
                  ? 'text-green-600'
                  : 'text-red-600'
            }`}
          >
            <TrendArrow direction={trend.direction} />
            <span className="ml-1">{trend.value}</span>
          </span>
          <span className="text-sm text-gray-500">from last import</span>
        </div>
      )}
    </>
  );

  const cardClassName = `border-l-4 ${styles.accent} ${
    isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
  } ${isLarge ? 'col-span-full lg:col-span-1' : ''}`;

  const cardProps = {
    padding: 'medium' as const,
    className: cardClassName,
    ...(testId && { 'data-testid': testId }),
  };

  if (isClickable) {
    return (
      <Card {...cardProps}>
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`${title}: ${value}${trend ? `, ${trend.direction === 'up' ? 'increased' : trend.direction === 'down' ? 'decreased' : 'unchanged'} ${trend.value}` : ''}`}
        >
          {content}
        </button>
      </Card>
    );
  }

  return <Card {...cardProps}>{content}</Card>;
}

// === Icon Components for Metrics ===

/**
 * Users icon for customer count
 */
export function UsersIcon({ className = 'h-full w-full' }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

/**
 * Check circle icon for active status
 */
export function CheckCircleIcon({ className = 'h-full w-full' }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Alert triangle icon for at-risk
 */
export function AlertTriangleIcon({ className = 'h-full w-full' }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

/**
 * Dollar sign icon for MRR
 */
export function DollarIcon({ className = 'h-full w-full' }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Heart/pulse icon for health score
 */
export function HeartPulseIcon({ className = 'h-full w-full' }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}
