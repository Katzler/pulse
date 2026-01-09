import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DistributionItem } from '@application/dtos';

/**
 * Get CSS variable value from the document
 */
function getCssVariable(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * Hook to get chart colors that respond to dark mode
 */
function useChartColors() {
  const [colors, setColors] = useState({
    axisPrimary: '#374151',
    axisSecondary: '#6b7280',
    grid: '#e5e7eb',
  });

  useEffect(() => {
    const updateColors = () => {
      setColors({
        axisPrimary: getCssVariable('--chart-axis-primary', '#374151'),
        axisSecondary: getCssVariable('--chart-axis-secondary', '#6b7280'),
        grid: getCssVariable('--chart-grid', '#e5e7eb'),
      });
    };

    // Initial update
    updateColors();

    // Watch for class changes on html/body for dark mode toggle
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return colors;
}

/**
 * Props for MrrByCountryChart component
 */
export interface MrrByCountryChartProps {
  /** Country distribution data */
  data: DistributionItem[];
  /** Chart height in pixels */
  height?: number;
  /** Maximum number of countries to show */
  maxCountries?: number;
  /** Whether to show "Other" category for remaining countries */
  showOther?: boolean;
  /** Click handler for bars */
  onCountryClick?: (country: string) => void;
}

/**
 * Chart data structure with derived fields
 */
interface ChartDataItem {
  name: string;
  mrr: number;
  customerCount: number;
  formattedMrr: string;
  [key: string]: string | number; // Index signature for Recharts
}

/**
 * Color palette for countries
 */
const COUNTRY_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
];

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Transform distribution data to chart format
 */
function transformData(
  data: DistributionItem[],
  maxCountries: number,
  showOther: boolean
): ChartDataItem[] {
  // Sort by MRR descending
  const sorted = [...data]
    .filter((item) => (item.mrr ?? 0) > 0)
    .sort((a, b) => (b.mrr ?? 0) - (a.mrr ?? 0));

  // Take top N countries
  const topCountries = sorted.slice(0, maxCountries);
  const remaining = sorted.slice(maxCountries);

  const result = topCountries.map((item) => ({
    name: item.name,
    mrr: item.mrr ?? 0,
    customerCount: item.count,
    formattedMrr: formatCurrency(item.mrr ?? 0),
  }));

  // Add "Other" category if there are remaining countries and showOther is true
  if (showOther && remaining.length > 0) {
    const otherMrr = remaining.reduce((sum, item) => sum + (item.mrr ?? 0), 0);
    const otherCount = remaining.reduce((sum, item) => sum + item.count, 0);
    result.push({
      name: 'Other',
      mrr: otherMrr,
      customerCount: otherCount,
      formattedMrr: formatCurrency(otherMrr),
    });
  }

  return result;
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
}): JSX.Element | null {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 shadow-lg">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        MRR: <span className="font-medium">${data.mrr.toLocaleString()}</span>
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {data.customerCount.toLocaleString()} customers
      </p>
    </div>
  );
}

/**
 * Empty state when no data is available
 */
function EmptyState(): JSX.Element {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No MRR data available</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Import customer data to see MRR by country</p>
      </div>
    </div>
  );
}

/**
 * MRR by Country Bar Chart component.
 * Displays a horizontal bar chart showing MRR distribution across countries.
 *
 * @example
 * <MrrByCountryChart
 *   data={[
 *     { name: 'USA', count: 500, mrr: 25000 },
 *     { name: 'UK', count: 300, mrr: 15000 },
 *   ]}
 *   maxCountries={10}
 * />
 */
export function MrrByCountryChart({
  data,
  height = 280,
  maxCountries = 8,
  showOther = true,
  onCountryClick,
}: MrrByCountryChartProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartColors = useChartColors();
  const chartData = transformData(data, maxCountries, showOther);
  const totalMrr = chartData.reduce((sum, item) => sum + item.mrr, 0);

  const handleMouseEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handleClick = useCallback(
    (entry: ChartDataItem) => {
      onCountryClick?.(entry.name);
    },
    [onCountryClick]
  );

  // Show empty state if no data
  if (chartData.length === 0) {
    return <EmptyState />;
  }

  return (
    <div data-testid="mrr-by-country-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12, fill: chartColors.axisSecondary }}
            axisLine={{ stroke: chartColors.grid }}
            tickLine={{ stroke: chartColors.grid }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: chartColors.axisPrimary }}
            axisLine={{ stroke: chartColors.grid }}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} isAnimationActive={false} />
          <Bar
            dataKey="mrr"
            radius={[0, 4, 4, 0]}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(_, index) => handleClick(chartData[index])}
            style={{ cursor: onCountryClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => {
              const isHovered = activeIndex === index;
              const baseColor = COUNTRY_COLORS[index % COUNTRY_COLORS.length];
              return (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={baseColor}
                  style={{
                    filter: isHovered ? 'brightness(1.2)' : 'none',
                    transition: 'filter 0.15s ease-out',
                  }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary below chart */}
      <div className="mt-2 flex justify-between border-t border-gray-100 dark:border-surface-700 pt-2 text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Showing top {chartData.length} countries
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Total: {formatCurrency(totalMrr)}
        </span>
      </div>

      {/* Accessible summary for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        MRR by country:{' '}
        {chartData.map((item) => `${item.name} ${item.formattedMrr}`).join(', ')}.
        Total: {formatCurrency(totalMrr)}.
      </div>
    </div>
  );
}
