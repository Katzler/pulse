import type { JSX } from 'react';

/**
 * Represents a single active filter
 */
export interface ActiveFilter {
  /** Filter key/name (e.g., 'status', 'accountType') */
  key: string;
  /** Display label for the filter */
  label: string;
  /** Current filter value */
  value: string;
}

/**
 * Props for ActiveFilters component
 */
export interface ActiveFiltersProps {
  /** List of active filters to display */
  filters: ActiveFilter[];
  /** Called when a single filter is removed */
  onRemove: (filterKey: string) => void;
  /** Called when all filters are cleared */
  onClearAll: () => void;
}

/**
 * Close icon for filter tags
 */
function CloseIcon(): JSX.Element {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Single filter tag component
 */
function FilterTag({
  filter,
  onRemove,
}: {
  filter: ActiveFilter;
  onRemove: (key: string) => void;
}): JSX.Element {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
      data-testid={`filter-tag-${filter.key}`}
    >
      <span className="font-medium">{filter.label}:</span>
      <span>{filter.value}</span>
      <button
        type="button"
        onClick={() => onRemove(filter.key)}
        className="ml-1 rounded-full p-0.5 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Remove ${filter.label} filter`}
      >
        <CloseIcon />
      </button>
    </span>
  );
}

/**
 * ActiveFilters displays currently applied filters as removable tags.
 * Allows users to remove individual filters or clear all at once.
 *
 * @example
 * <ActiveFilters
 *   filters={[
 *     { key: 'status', label: 'Status', value: 'Active' },
 *     { key: 'accountType', label: 'Account Type', value: 'Pro' }
 *   ]}
 *   onRemove={(key) => removeFilter(key)}
 *   onClearAll={() => clearAllFilters()}
 * />
 */
export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps): JSX.Element | null {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="active-filters"
      role="region"
      aria-label="Active filters"
    >
      <span className="text-sm text-gray-500">Active filters:</span>

      {filters.map((filter) => (
        <FilterTag key={filter.key} filter={filter} onRemove={onRemove} />
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-sm text-gray-500 hover:text-gray-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      >
        Clear All
      </button>

      {/* Screen reader announcement */}
      <span className="sr-only" role="status">
        {filters.length} filter{filters.length !== 1 ? 's' : ''} applied
      </span>
    </div>
  );
}
