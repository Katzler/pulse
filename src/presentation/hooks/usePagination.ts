import { useCallback, useMemo, useState } from 'react';

/**
 * Pagination state and controls
 */
export interface PaginationState {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Start index for current page (0-indexed) */
  startIndex: number;
  /** End index for current page (exclusive) */
  endIndex: number;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Whether there is a next page */
  hasNextPage: boolean;
}

/**
 * Pagination actions
 */
export interface PaginationActions {
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  previousPage: () => void;
  /** Go to the first page */
  firstPage: () => void;
  /** Go to the last page */
  lastPage: () => void;
  /** Change the page size */
  setPageSize: (size: number) => void;
  /** Update total items count */
  setTotalItems: (total: number) => void;
}

/**
 * Options for usePagination hook
 */
export interface UsePaginationOptions {
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Initial page size (default: 10) */
  initialPageSize?: number;
  /** Initial total items count (default: 0) */
  initialTotalItems?: number;
}

/**
 * Hook for managing pagination state.
 *
 * @param options - Pagination options
 * @returns Pagination state and actions
 *
 * @example
 * const { page, pageSize, totalPages, goToPage, nextPage } = usePagination({
 *   initialPageSize: 20,
 *   initialTotalItems: 100,
 * });
 *
 * // Get paginated data
 * const paginatedData = data.slice(startIndex, endIndex);
 */
export function usePagination(
  options: UsePaginationOptions = {}
): PaginationState & PaginationActions {
  const { initialPage = 1, initialPageSize = 10, initialTotalItems = 0 } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);

  const startIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const goToPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      setPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((p) => p - 1);
    }
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(Math.max(1, size));
    setPage(1); // Reset to first page when page size changes
  }, []);

  const handleSetTotalItems = useCallback(
    (total: number) => {
      setTotalItems(Math.max(0, total));
      // Adjust page if current page is beyond new total
      const newTotalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
      if (page > newTotalPages) {
        setPage(newTotalPages);
      }
    },
    [page, pageSize]
  );

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotalItems: handleSetTotalItems,
  };
}
