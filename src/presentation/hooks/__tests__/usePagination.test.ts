import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('initial state', () => {
    it('uses default values', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(1);
    });

    it('accepts custom initial values', () => {
      const { result } = renderHook(() =>
        usePagination({
          initialPage: 2,
          initialPageSize: 25,
          initialTotalItems: 100,
        })
      );

      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalItems).toBe(100);
      expect(result.current.totalPages).toBe(4);
    });
  });

  describe('calculated values', () => {
    it('calculates totalPages correctly', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPageSize: 10, initialTotalItems: 95 })
      );

      expect(result.current.totalPages).toBe(10);
    });

    it('calculates startIndex correctly', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, initialPageSize: 10 })
      );

      expect(result.current.startIndex).toBe(20);
    });

    it('calculates endIndex correctly', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, initialPageSize: 10, initialTotalItems: 25 })
      );

      expect(result.current.endIndex).toBe(10);
    });

    it('caps endIndex at totalItems', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, initialPageSize: 10, initialTotalItems: 25 })
      );

      expect(result.current.endIndex).toBe(25);
    });

    it('calculates hasPreviousPage correctly', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, initialTotalItems: 50 })
      );

      expect(result.current.hasPreviousPage).toBe(false);

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.hasPreviousPage).toBe(true);
    });

    it('calculates hasNextPage correctly', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, initialPageSize: 10, initialTotalItems: 50 })
      );

      expect(result.current.hasNextPage).toBe(false);

      act(() => {
        result.current.goToPage(4);
      });

      expect(result.current.hasNextPage).toBe(true);
    });
  });

  describe('goToPage', () => {
    it('navigates to specified page', () => {
      const { result } = renderHook(() => usePagination({ initialTotalItems: 100 }));

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.page).toBe(5);
    });

    it('clamps to minimum page', () => {
      const { result } = renderHook(() => usePagination({ initialTotalItems: 100 }));

      act(() => {
        result.current.goToPage(0);
      });

      expect(result.current.page).toBe(1);

      act(() => {
        result.current.goToPage(-5);
      });

      expect(result.current.page).toBe(1);
    });

    it('clamps to maximum page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPageSize: 10, initialTotalItems: 50 })
      );

      act(() => {
        result.current.goToPage(100);
      });

      expect(result.current.page).toBe(5);
    });
  });

  describe('nextPage', () => {
    it('advances to next page', () => {
      const { result } = renderHook(() => usePagination({ initialTotalItems: 50 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.page).toBe(2);
    });

    it('does not advance past last page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, initialPageSize: 10, initialTotalItems: 50 })
      );

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.page).toBe(5);
    });
  });

  describe('previousPage', () => {
    it('goes to previous page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, initialTotalItems: 50 })
      );

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.page).toBe(2);
    });

    it('does not go before first page', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 1 }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('firstPage', () => {
    it('navigates to first page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, initialTotalItems: 100 })
      );

      act(() => {
        result.current.firstPage();
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('lastPage', () => {
    it('navigates to last page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, initialPageSize: 10, initialTotalItems: 50 })
      );

      act(() => {
        result.current.lastPage();
      });

      expect(result.current.page).toBe(5);
    });
  });

  describe('setPageSize', () => {
    it('updates page size', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.pageSize).toBe(25);
    });

    it('resets to first page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, initialTotalItems: 100 })
      );

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.page).toBe(1);
    });

    it('enforces minimum page size of 1', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setPageSize(0);
      });

      expect(result.current.pageSize).toBe(1);
    });
  });

  describe('setTotalItems', () => {
    it('updates total items', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setTotalItems(200);
      });

      expect(result.current.totalItems).toBe(200);
    });

    it('recalculates totalPages', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPageSize: 10, initialTotalItems: 50 })
      );

      expect(result.current.totalPages).toBe(5);

      act(() => {
        result.current.setTotalItems(100);
      });

      expect(result.current.totalPages).toBe(10);
    });

    it('adjusts page if current page exceeds new total', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, initialPageSize: 10, initialTotalItems: 50 })
      );

      act(() => {
        result.current.setTotalItems(20);
      });

      expect(result.current.page).toBe(2);
    });

    it('enforces minimum total items of 0', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setTotalItems(-10);
      });

      expect(result.current.totalItems).toBe(0);
    });
  });
});
