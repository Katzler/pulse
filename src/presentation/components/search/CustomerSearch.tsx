import type { JSX } from 'react';
import { useCallback, useEffect,useRef, useState } from 'react';

import { type ActiveFilter,ActiveFilters } from './ActiveFilters';
import { SearchInput } from './SearchInput';

/**
 * Filter state for customer search
 */
export interface CustomerFilterState {
  status?: string;
  accountType?: string;
  healthClassification?: string;
  billingCountry?: string;
}

/**
 * Props for CustomerSearch component
 */
export interface CustomerSearchProps {
  /** Current search term */
  searchTerm: string;
  /** Called when search term changes */
  onSearchTermChange: (term: string) => void;
  /** Called when search is executed */
  onSearch: (term: string) => void;
  /** Current filter state */
  filters: CustomerFilterState;
  /** Called when a filter is removed */
  onFilterRemove: (filterKey: string) => void;
  /** Called when all filters are cleared */
  onFiltersClear: () => void;
  /** Result count to display */
  resultCount?: number;
  /** Total customer count */
  totalCount?: number;
  /** Whether search is loading */
  isLoading?: boolean;
  /** Enable debounced search-as-you-type */
  enableDebounce?: boolean;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Called when filter panel should open */
  onOpenFilters?: () => void;
}

/**
 * Convert filter state to display-friendly active filters array
 */
function getActiveFilters(filters: CustomerFilterState): ActiveFilter[] {
  const activeFilters: ActiveFilter[] = [];

  if (filters.status) {
    activeFilters.push({
      key: 'status',
      label: 'Status',
      value: filters.status,
    });
  }

  if (filters.accountType) {
    activeFilters.push({
      key: 'accountType',
      label: 'Account Type',
      value: filters.accountType,
    });
  }

  if (filters.healthClassification) {
    const labels: Record<string, string> = {
      healthy: 'Healthy',
      'at-risk': 'At Risk',
      critical: 'Critical',
    };
    activeFilters.push({
      key: 'healthClassification',
      label: 'Health',
      value: labels[filters.healthClassification] || filters.healthClassification,
    });
  }

  if (filters.billingCountry) {
    activeFilters.push({
      key: 'billingCountry',
      label: 'Country',
      value: filters.billingCountry,
    });
  }

  return activeFilters;
}

/**
 * Filter icon SVG
 */
function FilterIcon(): JSX.Element {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

/**
 * CustomerSearch component integrates search input with active filters.
 * Provides the main search interface for the customer list page.
 *
 * @example
 * <CustomerSearch
 *   searchTerm={searchTerm}
 *   onSearchTermChange={setSearchTerm}
 *   onSearch={handleSearch}
 *   filters={filters}
 *   onFilterRemove={handleRemoveFilter}
 *   onFiltersClear={handleClearFilters}
 *   resultCount={filteredCustomers.length}
 *   totalCount={allCustomers.length}
 * />
 */
export function CustomerSearch({
  searchTerm,
  onSearchTermChange,
  onSearch,
  filters,
  onFilterRemove,
  onFiltersClear,
  resultCount,
  totalCount,
  isLoading = false,
  enableDebounce = false,
  debounceMs = 300,
  onOpenFilters,
}: CustomerSearchProps): JSX.Element {
  const [internalValue, setInternalValue] = useState(searchTerm);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal value with external searchTerm
  useEffect(() => {
    setInternalValue(searchTerm);
  }, [searchTerm]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setInternalValue(value);
      onSearchTermChange(value);

      if (enableDebounce) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          onSearch(value);
        }, debounceMs);
      }
    },
    [enableDebounce, debounceMs, onSearch, onSearchTermChange]
  );

  const handleSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearch(internalValue);
  }, [internalValue, onSearch]);

  const handleClear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setInternalValue('');
    onSearchTermChange('');
    onSearch('');
  }, [onSearch, onSearchTermChange]);

  const activeFilters = getActiveFilters(filters);
  const hasFilters = activeFilters.length > 0;

  return (
    <div className="space-y-3" data-testid="customer-search">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchInput
            value={internalValue}
            onChange={handleChange}
            onSearch={handleSearch}
            onClear={handleClear}
            placeholder="Search by ID or name..."
            isLoading={isLoading}
          />
        </div>

        {/* Filters button */}
        {onOpenFilters && (
          <button
            type="button"
            onClick={onOpenFilters}
            className={`
              inline-flex items-center gap-2 rounded-lg border px-4 py-2.5
              text-sm font-medium transition-colors
              ${
                hasFilters
                  ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
          >
            <FilterIcon />
            <span>Filters</span>
            {hasFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {activeFilters.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Active filters row */}
      <ActiveFilters
        filters={activeFilters}
        onRemove={onFilterRemove}
        onClearAll={onFiltersClear}
      />

      {/* Results count */}
      {resultCount !== undefined && (
        <div className="text-sm text-gray-500" role="status" aria-live="polite">
          {isLoading ? (
            <span>Searching...</span>
          ) : (
            <span>
              Showing <span className="font-medium text-gray-700">{resultCount.toLocaleString()}</span>
              {totalCount !== undefined && totalCount !== resultCount && (
                <> of {totalCount.toLocaleString()}</>
              )}{' '}
              customer{resultCount !== 1 ? 's' : ''}
              {searchTerm && (
                <>
                  {' '}
                  for &quot;<span className="font-medium">{searchTerm}</span>&quot;
                </>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
