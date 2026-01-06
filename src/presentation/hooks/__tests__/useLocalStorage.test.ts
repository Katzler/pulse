import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial value', () => {
    it('returns initial value when storage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      expect(result.current[0]).toBe('default');
    });

    it('returns stored value when present', () => {
      localStorage.setItem('testKey', JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      expect(result.current[0]).toBe('stored');
    });

    it('handles object values', () => {
      const stored = { name: 'test', count: 42 };
      localStorage.setItem('testKey', JSON.stringify(stored));

      const { result } = renderHook(() =>
        useLocalStorage('testKey', { name: '', count: 0 })
      );

      expect(result.current[0]).toEqual(stored);
    });

    it('handles array values', () => {
      const stored = [1, 2, 3];
      localStorage.setItem('testKey', JSON.stringify(stored));

      const { result } = renderHook(() => useLocalStorage('testKey', [] as number[]));

      expect(result.current[0]).toEqual(stored);
    });
  });

  describe('setValue', () => {
    it('updates state', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
    });

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[1]('persisted');
      });

      expect(localStorage.getItem('testKey')).toBe(JSON.stringify('persisted'));
    });

    it('accepts function updater', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1]((prev) => prev + 10);
      });

      expect(result.current[0]).toBe(11);
    });

    it('handles complex objects', () => {
      const initial = { nested: { deep: 'value' }, array: [1, 2] };
      const { result } = renderHook(() => useLocalStorage('testKey', initial));

      act(() => {
        result.current[1]({ nested: { deep: 'updated' }, array: [3, 4, 5] });
      });

      expect(result.current[0]).toEqual({
        nested: { deep: 'updated' },
        array: [3, 4, 5],
      });
    });
  });

  describe('removeValue', () => {
    it('removes from localStorage', () => {
      localStorage.setItem('testKey', JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      act(() => {
        result.current[2]();
      });

      expect(localStorage.getItem('testKey')).toBeNull();
    });

    it('resets to initial value', () => {
      localStorage.setItem('testKey', JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('default');
    });
  });

  describe('error handling', () => {
    it('returns initial value on parse error', () => {
      // Store invalid JSON
      localStorage.setItem('testKey', 'invalid{json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      expect(result.current[0]).toBe('default');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles circular reference gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage<unknown>('testKey', 'initial')
      );

      // Create circular reference that will cause JSON.stringify to throw
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;

      act(() => {
        result.current[1](circular);
      });

      // Should not throw, just warn
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('cross-tab synchronization', () => {
    it('responds to storage events from other tabs', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      // Simulate storage event from another tab
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'testKey',
            newValue: JSON.stringify('from other tab'),
          })
        );
      });

      expect(result.current[0]).toBe('from other tab');
    });

    it('ignores storage events for other keys', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'otherKey',
            newValue: JSON.stringify('other value'),
          })
        );
      });

      expect(result.current[0]).toBe('initial');
    });

    it('resets to initial when key is removed in other tab', () => {
      localStorage.setItem('testKey', JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      expect(result.current[0]).toBe('stored');

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'testKey',
            newValue: null,
          })
        );
      });

      expect(result.current[0]).toBe('default');
    });
  });

  describe('multiple hooks with same key', () => {
    it('both hooks read from same localStorage', () => {
      localStorage.setItem('sharedKey', JSON.stringify('shared value'));

      const { result: result1 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));
      const { result: result2 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));

      expect(result1.current[0]).toBe('shared value');
      expect(result2.current[0]).toBe('shared value');
    });
  });
});
