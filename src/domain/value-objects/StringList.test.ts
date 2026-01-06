import { describe, expect, it } from 'vitest';

import { StringList } from './StringList';

describe('StringList Value Object', () => {
  describe('creation', () => {
    it('creates a valid string list from array', () => {
      const result = StringList.create(['Booking.com', 'Expedia', 'Airbnb']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.count()).toBe(3);
      }
    });

    it('creates an empty string list', () => {
      const result = StringList.create([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.count()).toBe(0);
        expect(result.value.isEmpty()).toBe(true);
      }
    });

    it('fails if array contains null', () => {
      const result = StringList.create(['valid', null as unknown as string]);
      expect(result.success).toBe(false);
    });

    it('fails if array contains undefined', () => {
      const result = StringList.create(['valid', undefined as unknown as string]);
      expect(result.success).toBe(false);
    });

    it('trims whitespace from values', () => {
      const result = StringList.create(['  Booking.com  ', '  Expedia  ']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.toArray()).toEqual(['Booking.com', 'Expedia']);
      }
    });

    it('filters out empty strings after trimming', () => {
      const result = StringList.create(['Booking.com', '   ', 'Expedia']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.count()).toBe(2);
        expect(result.value.toArray()).toEqual(['Booking.com', 'Expedia']);
      }
    });
  });

  describe('count()', () => {
    it('returns correct count for non-empty list', () => {
      const result = StringList.create(['a', 'b', 'c']);
      expect(result.success && result.value.count()).toBe(3);
    });

    it('returns 0 for empty list', () => {
      const result = StringList.create([]);
      expect(result.success && result.value.count()).toBe(0);
    });
  });

  describe('has()', () => {
    it('returns true when value exists (exact match)', () => {
      const result = StringList.create(['Booking.com', 'Expedia']);
      expect(result.success && result.value.has('Booking.com')).toBe(true);
    });

    it('returns true when value exists (case-insensitive)', () => {
      const result = StringList.create(['Booking.com', 'Expedia']);
      expect(result.success && result.value.has('booking.com')).toBe(true);
      expect(result.success && result.value.has('BOOKING.COM')).toBe(true);
    });

    it('returns false when value does not exist', () => {
      const result = StringList.create(['Booking.com', 'Expedia']);
      expect(result.success && result.value.has('Airbnb')).toBe(false);
    });

    it('returns false for empty list', () => {
      const result = StringList.create([]);
      expect(result.success && result.value.has('anything')).toBe(false);
    });
  });

  describe('isEmpty()', () => {
    it('returns true for empty list', () => {
      const result = StringList.create([]);
      expect(result.success && result.value.isEmpty()).toBe(true);
    });

    it('returns false for non-empty list', () => {
      const result = StringList.create(['item']);
      expect(result.success && result.value.isEmpty()).toBe(false);
    });
  });

  describe('toArray()', () => {
    it('returns a copy of the values', () => {
      const result = StringList.create(['a', 'b', 'c']);
      if (result.success) {
        const array = result.value.toArray();
        expect(array).toEqual(['a', 'b', 'c']);

        // Verify it's a copy, not the original
        array.push('d');
        expect(result.value.count()).toBe(3);
      }
    });

    it('returns empty array for empty list', () => {
      const result = StringList.create([]);
      expect(result.success && result.value.toArray()).toEqual([]);
    });
  });

  describe('first()', () => {
    it('returns first item', () => {
      const result = StringList.create(['first', 'second', 'third']);
      expect(result.success && result.value.first()).toBe('first');
    });

    it('returns undefined for empty list', () => {
      const result = StringList.create([]);
      expect(result.success && result.value.first()).toBeUndefined();
    });
  });

  describe('equals()', () => {
    it('returns true for same values in same order', () => {
      const list1 = StringList.create(['a', 'b', 'c']);
      const list2 = StringList.create(['a', 'b', 'c']);
      expect(list1.success && list2.success && list1.value.equals(list2.value)).toBe(true);
    });

    it('returns false for same values in different order', () => {
      const list1 = StringList.create(['a', 'b', 'c']);
      const list2 = StringList.create(['c', 'b', 'a']);
      expect(list1.success && list2.success && list1.value.equals(list2.value)).toBe(false);
    });

    it('returns false for different values', () => {
      const list1 = StringList.create(['a', 'b']);
      const list2 = StringList.create(['a', 'c']);
      expect(list1.success && list2.success && list1.value.equals(list2.value)).toBe(false);
    });

    it('returns false for different lengths', () => {
      const list1 = StringList.create(['a', 'b']);
      const list2 = StringList.create(['a', 'b', 'c']);
      expect(list1.success && list2.success && list1.value.equals(list2.value)).toBe(false);
    });

    it('returns true for two empty lists', () => {
      const list1 = StringList.create([]);
      const list2 = StringList.create([]);
      expect(list1.success && list2.success && list1.value.equals(list2.value)).toBe(true);
    });
  });

  describe('immutability', () => {
    it('values cannot be modified after creation', () => {
      const result = StringList.create(['a', 'b', 'c']);
      expect(result.success).toBe(true);
      if (result.success) {
        const array = result.value.toArray();
        array.push('d');
        expect(result.value.count()).toBe(3);
      }
    });
  });
});
