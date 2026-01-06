import type { JSX } from 'react';
import { useCallback, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DistributionItem } from '@application/dtos';

/**
 * Props for ChannelAdoptionChart component
 */
export interface ChannelAdoptionChartProps {
  /** Channel distribution data */
  data: DistributionItem[];
  /** Chart height in pixels */
  height?: number;
  /** Maximum number of channels to show */
  maxChannels?: number;
  /** Click handler for bars */
  onChannelClick?: (channel: string) => void;
}

/**
 * Chart data structure with derived fields
 */
interface ChartDataItem {
  name: string;
  count: number;
  percentage: number;
  formattedCount: string;
  [key: string]: string | number; // Index signature for Recharts
}

/**
 * Color palette for channels
 */
const CHANNEL_COLORS = [
  '#0EA5E9', // sky-500
  '#22C55E', // green-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#A855F7', // purple-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
];

/**
 * Format count for display
 */
function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/**
 * Transform distribution data to chart format
 */
function transformData(
  data: DistributionItem[],
  maxChannels: number
): ChartDataItem[] {
  // Sort by count descending and take top N
  const sorted = [...data]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxChannels);

  const total = sorted.reduce((sum, item) => sum + item.count, 0);

  return sorted.map((item) => ({
    name: item.name,
    count: item.count,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
    formattedCount: formatCount(item.count),
  }));
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="font-semibold text-gray-900">{data.name}</p>
      <p className="text-sm text-gray-600">
        {data.count.toLocaleString()} customers ({data.percentage.toFixed(1)}%)
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
        <p className="text-sm font-medium text-gray-700">No channel data available</p>
        <p className="text-xs text-gray-500">Import customer data to see channel adoption</p>
      </div>
    </div>
  );
}

/**
 * Channel Adoption Bar Chart component.
 * Displays a horizontal bar chart showing customer distribution across channels.
 *
 * @example
 * <ChannelAdoptionChart
 *   data={[
 *     { name: 'Booking.com', count: 600 },
 *     { name: 'Expedia', count: 400 },
 *   ]}
 *   maxChannels={8}
 * />
 */
export function ChannelAdoptionChart({
  data,
  height = 280,
  maxChannels = 8,
  onChannelClick,
}: ChannelAdoptionChartProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartData = transformData(data, maxChannels);
  const totalCustomers = chartData.reduce((sum, item) => sum + item.count, 0);

  const handleMouseEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handleClick = useCallback(
    (entry: ChartDataItem) => {
      onChannelClick?.(entry.name);
    },
    [onChannelClick]
  );

  // Show empty state if no data
  if (chartData.length === 0) {
    return <EmptyState />;
  }

  return (
    <div data-testid="channel-adoption-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={formatCount}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#374151' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(_, index) => handleClick(chartData[index])}
            style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary below chart */}
      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm">
        <span className="text-gray-500">
          {chartData.length} channels connected
        </span>
        <span className="font-medium text-gray-900">
          {formatCount(totalCustomers)} total customers
        </span>
      </div>

      {/* Accessible summary for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Channel adoption:{' '}
        {chartData.map((item) => `${item.name} ${item.formattedCount} customers`).join(', ')}.
        Total: {formatCount(totalCustomers)} customers across {chartData.length} channels.
      </div>
    </div>
  );
}
