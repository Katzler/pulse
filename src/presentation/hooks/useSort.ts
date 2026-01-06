import { useCallback, useMemo, useState } from 'react';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface SortConfig<T> {
  /** Field to sort by */
  key: keyof T | null;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Sort state and controls
 */
export interface SortState<T> extends SortConfig<T> {
  /** Sort data by current configuration */
  sortData: (data: T[]) => T[];
  /** Toggle sort on a field (cycles through asc -> desc -> none) */
  toggleSort: (key: keyof T) => void;
  /** Set specific sort configuration */
  setSort: (key: keyof T | null, direction?: SortDirection) => void;
  /** Clear sorting */
  clearSort: () => void;
  /** Get sort direction for a specific field (for UI indicators) */
  getSortDirection: (key: keyof T) => SortDirection | null;
}

/**
 * Options for useSort hook
 */
export interface UseSortOptions<T> {
  /** Initial sort key */
  initialKey?: keyof T;
  /** Initial sort direction (default: 'asc') */
  initialDirection?: SortDirection;
  /** Custom comparator function */
  comparator?: (a: T, b: T, key: keyof T, direction: SortDirection) => number;
}

/**
 * Default comparator function for sorting
 */
function defaultComparator<T>(a: T, b: T, key: keyof T, direction: SortDirection): number {
  const aValue = a[key];
  const bValue = b[key];

  // Handle null/undefined values
  if (aValue === null || aValue === undefined) {
    return direction === 'asc' ? 1 : -1;
  }
  if (bValue === null || bValue === undefined) {
    return direction === 'asc' ? -1 : 1;
  }

  // String comparison
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    const comparison = aValue.localeCompare(bValue);
    return direction === 'asc' ? comparison : -comparison;
  }

  // Number comparison
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    const comparison = aValue - bValue;
    return direction === 'asc' ? comparison : -comparison;
  }

  // Date comparison
  if (aValue instanceof Date && bValue instanceof Date) {
    const comparison = aValue.getTime() - bValue.getTime();
    return direction === 'asc' ? comparison : -comparison;
  }

  // Boolean comparison
  if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
    const comparison = Number(aValue) - Number(bValue);
    return direction === 'asc' ? comparison : -comparison;
  }

  // Fallback: convert to string and compare
  const aStr = String(aValue);
  const bStr = String(bValue);
  const comparison = aStr.localeCompare(bStr);
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Hook for managing sort state and sorting data.
 *
 * @param options - Sort options
 * @returns Sort state and actions
 *
 * @example
 * const { key, direction, sortData, toggleSort } = useSort<Customer>({
 *   initialKey: 'name',
 *   initialDirection: 'asc',
 * });
 *
 * // Sort data
 * const sortedCustomers = sortData(customers);
 *
 * // Toggle sort on column click
 * <th onClick={() => toggleSort('name')}>Name</th>
 */
export function useSort<T>(options: UseSortOptions<T> = {}): SortState<T> {
  const { initialKey, initialDirection = 'asc', comparator = defaultComparator } = options;

  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialKey ?? null,
    direction: initialDirection,
  });

  const sortData = useCallback(
    (data: T[]): T[] => {
      if (!sortConfig.key) {
        return data;
      }

      return [...data].sort((a, b) =>
        comparator(a, b, sortConfig.key!, sortConfig.direction)
      );
    },
    [sortConfig.key, sortConfig.direction, comparator]
  );

  const toggleSort = useCallback((key: keyof T) => {
    setSortConfig((current) => {
      if (current.key !== key) {
        // New field: start with ascending
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        // Same field, ascending: switch to descending
        return { key, direction: 'desc' };
      }
      // Same field, descending: clear sort
      return { key: null, direction: 'asc' };
    });
  }, []);

  const setSort = useCallback((key: keyof T | null, direction: SortDirection = 'asc') => {
    setSortConfig({ key, direction });
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  const getSortDirection = useCallback(
    (key: keyof T): SortDirection | null => {
      if (sortConfig.key === key) {
        return sortConfig.direction;
      }
      return null;
    },
    [sortConfig.key, sortConfig.direction]
  );

  return useMemo(
    () => ({
      key: sortConfig.key,
      direction: sortConfig.direction,
      sortData,
      toggleSort,
      setSort,
      clearSort,
      getSortDirection,
    }),
    [sortConfig.key, sortConfig.direction, sortData, toggleSort, setSort, clearSort, getSortDirection]
  );
}
