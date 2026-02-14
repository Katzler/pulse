import type { JSX } from 'react';
import { useCallback } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { HealthDistributionDTO } from '@application/dtos';

/**
 * Props for HealthDistributionChart component
 */
export interface HealthDistributionChartProps {
  /** Health distribution data */
  data: HealthDistributionDTO;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Whether to show labels on the chart */
  showLabels?: boolean;
  /** Inner radius for donut style (0 for pie) */
  innerRadius?: number;
  /** Chart height in pixels */
  height?: number;
  /** Click handler for segments */
  onSegmentClick?: (category: 'healthy' | 'atRisk' | 'critical') => void;
}

/**
 * Chart segment data structure
 */
interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  category: 'healthy' | 'atRisk' | 'critical';
  range: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

/**
 * Color definitions for health categories
 */
const COLORS = {
  healthy: '#22C55E', // green-500
  atRisk: '#F59E0B', // amber-500
  critical: '#EF4444', // red-500
};

/**
 * Transform DTO data to Recharts format
 */
function transformData(data: HealthDistributionDTO): ChartDataItem[] {
  const items: ChartDataItem[] = [
    {
      name: 'Healthy',
      value: data.healthy,
      color: COLORS.healthy,
      category: 'healthy' as const,
      range: '70-100',
    },
    {
      name: 'At Risk',
      value: data.atRisk,
      color: COLORS.atRisk,
      category: 'atRisk' as const,
      range: '30-69',
    },
    {
      name: 'Critical',
      value: data.critical,
      color: COLORS.critical,
      category: 'critical' as const,
      range: '0-29',
    },
  ];
  return items.filter((item) => item.value > 0);
}

/**
 * Calculate percentage of total
 */
function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}

/**
 * Custom tooltip component
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataItem }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;
  const total = payload.reduce((sum, p) => sum + p.payload.value, 0);
  const percentage = calculatePercentage(data.value, total);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 shadow-lg">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name} Customers</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {data.value.toLocaleString()} customers ({percentage}%)
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">Score range: {data.range}</p>
    </div>
  );
}

/**
 * Custom legend component
 */
interface LegendEntry {
  value: string;
  color: string;
  payload: ChartDataItem;
}

function CustomLegend({
  payload,
  total,
}: {
  payload: readonly LegendEntry[];
  total: number;
}) {
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-4">
      {payload.map((entry) => {
        const percentage = calculatePercentage(entry.payload.value, total);
        return (
          <li key={entry.value} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.value} ({entry.payload.range}):{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {entry.payload.value.toLocaleString()}
              </span>{' '}
              ({percentage}%)
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Custom label renderer for pie segments
 */
function renderCustomLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}): JSX.Element | null {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;

  if (percent < 0.05) return null; // Don't show labels for very small segments

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-sm font-medium"
      style={{ pointerEvents: 'none' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/**
 * Empty state when no data is available
 */
function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No health data available</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Import customer data to see distribution</p>
      </div>
    </div>
  );
}

/**
 * Health Distribution Chart component.
 * Displays a donut/pie chart showing the distribution of customer health scores.
 *
 * @example
 * <HealthDistributionChart
 *   data={{ healthy: 450, atRisk: 120, critical: 30 }}
 *   showLegend
 *   innerRadius={60}
 * />
 */
export function HealthDistributionChart({
  data,
  showLegend = true,
  showLabels = true,
  innerRadius = 60,
  height = 300,
  onSegmentClick,
}: HealthDistributionChartProps) {
  const chartData = transformData(data);
  const total = data.healthy + data.atRisk + data.critical;

  const handleClick = useCallback(
    (entry: ChartDataItem) => {
      onSegmentClick?.(entry.category);
    },
    [onSegmentClick]
  );

  // Show empty state if no data
  if (total === 0) {
    return <EmptyState />;
  }

  return (
    <div data-testid="health-distribution-chart">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={innerRadius + 40}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            onClick={(_, index) => handleClick(chartData[index])}
            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
            label={showLabels ? renderCustomLabel : false}
            labelLine={false}
            isAnimationActive={false}
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={entry.color}
                stroke="none"
                className="transition-[filter] duration-150 ease-out hover:brightness-125"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
          {showLegend && (
            <Legend
              content={(props) => {
                const payload = props.payload as readonly LegendEntry[] | undefined;
                return payload ? (
                  <CustomLegend payload={payload} total={total} />
                ) : null;
              }}
              verticalAlign="bottom"
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Accessible summary for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Health distribution: {data.healthy} healthy customers (
        {calculatePercentage(data.healthy, total)}%), {data.atRisk} at-risk customers (
        {calculatePercentage(data.atRisk, total)}%), {data.critical} critical customers (
        {calculatePercentage(data.critical, total)}%)
      </div>
    </div>
  );
}
