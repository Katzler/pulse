import type { JSX } from 'react';

import type { HealthDistributionDTO } from '@application/dtos';

/**
 * Props for PortfolioHealthTrend component
 */
export interface PortfolioHealthTrendProps {
  /** Current health distribution snapshot */
  currentHealth: HealthDistributionDTO;
  /** Average health score */
  averageHealthScore: number;
  /** Total customers */
  totalCustomers: number;
  /** Callback when "View At-Risk" is clicked */
  onViewAtRisk?: () => void;
}

/**
 * Calculate percentage
 */
function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}

/**
 * Health status indicator bar
 */
function HealthStatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}): JSX.Element {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {count.toLocaleString()} ({calculatePercentage(count, total)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * Health score indicator with color
 */
function HealthScoreIndicator({ score }: { score: number }): JSX.Element {
  const getColor = () => {
    if (score >= 70) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (score >= 30) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  const getLabelColor = () => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLabel = () => {
    if (score >= 70) return 'Healthy';
    if (score >= 30) return 'At Risk';
    return 'Critical';
  };

  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getColor()}`}>
        <span className="text-2xl font-bold">{Math.round(score)}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Average Score: <span className={getLabelColor()}>{getLabel()}</span>
      </p>
    </div>
  );
}

/**
 * Portfolio Health Trend Section component.
 * Displays current health portfolio overview with distribution bars.
 * Designed to be extended with time-series trend data when available.
 *
 * @example
 * <PortfolioHealthTrend
 *   currentHealth={{ healthy: 700, atRisk: 200, critical: 100 }}
 *   averageHealthScore={65}
 *   totalCustomers={1000}
 * />
 */
export function PortfolioHealthTrend({
  currentHealth,
  averageHealthScore,
  totalCustomers,
  onViewAtRisk,
}: PortfolioHealthTrendProps): JSX.Element {
  const { healthy, atRisk, critical } = currentHealth;
  const needsAttention = atRisk + critical;

  return (
    <div data-testid="portfolio-health-trend">
      {/* Current Snapshot */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Health Score Circle */}
        <div className="flex-shrink-0 flex justify-center">
          <HealthScoreIndicator score={averageHealthScore} />
        </div>

        {/* Distribution Bars */}
        <div className="flex-1">
          <HealthStatusBar
            label="Healthy (70-100)"
            count={healthy}
            total={totalCustomers}
            color="#22C55E"
          />
          <HealthStatusBar
            label="At Risk (30-69)"
            count={atRisk}
            total={totalCustomers}
            color="#F59E0B"
          />
          <HealthStatusBar
            label="Critical (0-29)"
            count={critical}
            total={totalCustomers}
            color="#EF4444"
          />
        </div>
      </div>

      {/* Action area */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-surface-700 flex flex-col sm:flex-row items-center justify-between gap-2">
        {needsAttention > 0 && onViewAtRisk ? (
          <button
            type="button"
            onClick={onViewAtRisk}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800 rounded"
          >
            View {needsAttention} customers needing attention →
          </button>
        ) : needsAttention > 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {needsAttention} customers need attention
          </p>
        ) : (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            All customers are healthy!
          </p>
        )}
        <p className="text-xs text-gray-400">
          Health trends will be available after multiple data imports
        </p>
      </div>

      {/* Accessible summary for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Portfolio health overview: Average health score {Math.round(averageHealthScore)}.
        {healthy} healthy customers ({calculatePercentage(healthy, totalCustomers)}%),
        {atRisk} at-risk customers ({calculatePercentage(atRisk, totalCustomers)}%),
        {critical} critical customers ({calculatePercentage(critical, totalCustomers)}%).
      </div>
    </div>
  );
}
