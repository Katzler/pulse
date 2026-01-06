import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSort } from '../useSort';

interface TestItem {
  id: number;
  name: string;
  value: number;
  date: Date;
  active: boolean;
}

const testData: TestItem[] = [
  { id: 1, name: 'Charlie', value: 30, date: new Date('2024-03-01'), active: true },
  { id: 2, name: 'Alice', value: 10, date: new Date('2024-01-01'), active: false },
  { id: 3, name: 'Bob', value: 20, date: new Date('2024-02-01'), active: true },
];

describe('useSort', () => {
  describe('initial state', () => {
    it('has null key by default', () => {
      const { result } = renderHook(() => useSort<TestItem>());

      expect(result.current.key).toBeNull();
      expect(result.current.direction).toBe('asc');
    });

    it('accepts initial key and direction', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({
          initialKey: 'name',
          initialDirection: 'desc',
        })
      );

      expect(result.current.key).toBe('name');
      expect(result.current.direction).toBe('desc');
    });
  });

  describe('sortData', () => {
    it('returns unsorted data when key is null', () => {
      const { result } = renderHook(() => useSort<TestItem>());

      const sorted = result.current.sortData(testData);

      expect(sorted).toEqual(testData);
    });

    it('sorts strings ascending', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name', initialDirection: 'asc' })
      );

      const sorted = result.current.sortData(testData);

      expect(sorted.map((item) => item.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('sorts strings descending', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name', initialDirection: 'desc' })
      );

      const sorted = result.current.sortData(testData);

      expect(sorted.map((item) => item.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('sorts numbers ascending', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'value', initialDirection: 'asc' })
      );

      const sorted = result.current.sortData(testData);

      expect(sorted.map((item) => item.value)).toEqual([10, 20, 30]);
    });

    it('sorts numbers descending', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'value', initialDirection: 'desc' })
      );

      const sorted = result.current.sortData(testData);

      expect(sorted.map((item) => item.value)).toEqual([30, 20, 10]);
    });

    it('sorts dates ascending', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'date', initialDirection: 'asc' })
      );

      const sorted = result.current.sortData(testData);

      expect(sorted.map((item) => item.id)).toEqual([2, 3, 1]);
    });

    it('sorts booleans', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'active', initialDirection: 'desc' })
      );

      const sorted = result.current.sortData(testData);

      expect(sorted.map((item) => item.active)).toEqual([true, true, false]);
    });

    it('handles null values', () => {
      const dataWithNull = [
        { id: 1, name: 'Alice' },
        { id: 2, name: null },
        { id: 3, name: 'Bob' },
      ] as { id: number; name: string | null }[];

      const { result } = renderHook(() =>
        useSort<{ id: number; name: string | null }>({ initialKey: 'name', initialDirection: 'asc' })
      );

      const sorted = result.current.sortData(dataWithNull);

      // Null should sort to the end for ascending
      expect(sorted.map((item) => item.name)).toEqual(['Alice', 'Bob', null]);
    });

    it('does not mutate original array', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name' })
      );

      const original = [...testData];
      result.current.sortData(testData);

      expect(testData).toEqual(original);
    });
  });

  describe('toggleSort', () => {
    it('sets ascending on new field', () => {
      const { result } = renderHook(() => useSort<TestItem>());

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.key).toBe('name');
      expect(result.current.direction).toBe('asc');
    });

    it('toggles to descending on same field', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name', initialDirection: 'asc' })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.key).toBe('name');
      expect(result.current.direction).toBe('desc');
    });

    it('clears sort on third toggle', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name', initialDirection: 'desc' })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.key).toBeNull();
    });

    it('resets to ascending when switching fields', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name', initialDirection: 'desc' })
      );

      act(() => {
        result.current.toggleSort('value');
      });

      expect(result.current.key).toBe('value');
      expect(result.current.direction).toBe('asc');
    });
  });

  describe('setSort', () => {
    it('sets specific key and direction', () => {
      const { result } = renderHook(() => useSort<TestItem>());

      act(() => {
        result.current.setSort('value', 'desc');
      });

      expect(result.current.key).toBe('value');
      expect(result.current.direction).toBe('desc');
    });

    it('defaults direction to ascending', () => {
      const { result } = renderHook(() => useSort<TestItem>());

      act(() => {
        result.current.setSort('name');
      });

      expect(result.current.key).toBe('name');
      expect(result.current.direction).toBe('asc');
    });

    it('can set key to null', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name' })
      );

      act(() => {
        result.current.setSort(null);
      });

      expect(result.current.key).toBeNull();
    });
  });

  describe('clearSort', () => {
    it('resets to initial state', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name', initialDirection: 'desc' })
      );

      act(() => {
        result.current.clearSort();
      });

      expect(result.current.key).toBeNull();
      expect(result.current.direction).toBe('asc');
    });
  });

  describe('getSortDirection', () => {
    it('returns direction for current sort key', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name', initialDirection: 'desc' })
      );

      expect(result.current.getSortDirection('name')).toBe('desc');
    });

    it('returns null for non-sorted fields', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({ initialKey: 'name' })
      );

      expect(result.current.getSortDirection('value')).toBeNull();
    });

    it('returns null when no sorting is active', () => {
      const { result } = renderHook(() => useSort<TestItem>());

      expect(result.current.getSortDirection('name')).toBeNull();
    });
  });

  describe('custom comparator', () => {
    it('uses custom comparator when provided', () => {
      const { result } = renderHook(() =>
        useSort<TestItem>({
          initialKey: 'name',
          comparator: (a, b, _key, direction) => {
            // Custom: sort by length of name
            const comparison = a.name.length - b.name.length;
            return direction === 'asc' ? comparison : -comparison;
          },
        })
      );

      const sorted = result.current.sortData(testData);

      // Bob (3), Alice (5), Charlie (7)
      expect(sorted.map((item) => item.name)).toEqual(['Bob', 'Alice', 'Charlie']);
    });
  });
});
