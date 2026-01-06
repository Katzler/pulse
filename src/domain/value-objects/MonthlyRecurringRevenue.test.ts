import { describe, expect, it } from 'vitest';

import { MonthlyRecurringRevenue } from './MonthlyRecurringRevenue';

describe('MonthlyRecurringRevenue Value Object', () => {
  describe('creation', () => {
    it('creates a valid MRR with amount and currency', () => {
      const result = MonthlyRecurringRevenue.create(500, 'SEK');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.amount).toBe(500);
        expect(result.value.currency).toBe('SEK');
      }
    });

    it('allows zero amount', () => {
      const result = MonthlyRecurringRevenue.create(0, 'USD');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.amount).toBe(0);
      }
    });

    it('fails for negative amount', () => {
      const result = MonthlyRecurringRevenue.create(-100, 'EUR');
      expect(result.success).toBe(false);
    });

    it('fails for NaN amount', () => {
      const result = MonthlyRecurringRevenue.create(NaN, 'USD');
      expect(result.success).toBe(false);
    });

    it('fails for empty currency', () => {
      const result = MonthlyRecurringRevenue.create(100, '');
      expect(result.success).toBe(false);
    });

    it('fails for whitespace-only currency', () => {
      const result = MonthlyRecurringRevenue.create(100, '   ');
      expect(result.success).toBe(false);
    });
  });

  describe('isHighValue()', () => {
    it('returns true for amount above 1000', () => {
      const result = MonthlyRecurringRevenue.create(1001, 'SEK');
      expect(result.success && result.value.isHighValue()).toBe(true);
    });

    it('returns false for amount of 1000 (boundary)', () => {
      const result = MonthlyRecurringRevenue.create(1000, 'SEK');
      expect(result.success && result.value.isHighValue()).toBe(false);
    });

    it('returns false for amount below 1000', () => {
      const result = MonthlyRecurringRevenue.create(500, 'SEK');
      expect(result.success && result.value.isHighValue()).toBe(false);
    });

    it('returns false for zero amount', () => {
      const result = MonthlyRecurringRevenue.create(0, 'SEK');
      expect(result.success && result.value.isHighValue()).toBe(false);
    });
  });

  describe('format()', () => {
    it('formats SEK currency with kr suffix', () => {
      const result = MonthlyRecurringRevenue.create(1500, 'SEK');
      expect(result.success && result.value.format()).toBe('1,500 kr');
    });

    it('formats USD currency with $ prefix', () => {
      const result = MonthlyRecurringRevenue.create(1500, 'USD');
      expect(result.success && result.value.format()).toBe('$1,500');
    });

    it('formats EUR currency with symbol', () => {
      const result = MonthlyRecurringRevenue.create(1500, 'EUR');
      expect(result.success && result.value.format()).toBe('€1,500');
    });

    it('formats unknown currency with code suffix', () => {
      const result = MonthlyRecurringRevenue.create(1500, 'GBP');
      expect(result.success && result.value.format()).toBe('1,500 GBP');
    });

    it('formats zero amount correctly', () => {
      const result = MonthlyRecurringRevenue.create(0, 'USD');
      expect(result.success && result.value.format()).toBe('$0');
    });

    it('formats large numbers with thousand separators', () => {
      const result = MonthlyRecurringRevenue.create(1234567, 'USD');
      expect(result.success && result.value.format()).toBe('$1,234,567');
    });
  });

  describe('toNumber()', () => {
    it('returns the amount as number', () => {
      const result = MonthlyRecurringRevenue.create(750.5, 'SEK');
      expect(result.success && result.value.toNumber()).toBe(750.5);
    });
  });

  describe('compare()', () => {
    it('returns positive when greater than other', () => {
      const higher = MonthlyRecurringRevenue.create(1000, 'SEK');
      const lower = MonthlyRecurringRevenue.create(500, 'SEK');
      if (higher.success && lower.success) {
        const comparison = higher.value.compare(lower.value);
        expect(comparison.success && comparison.value > 0).toBe(true);
      }
    });

    it('returns negative when less than other', () => {
      const higher = MonthlyRecurringRevenue.create(1000, 'SEK');
      const lower = MonthlyRecurringRevenue.create(500, 'SEK');
      if (higher.success && lower.success) {
        const comparison = lower.value.compare(higher.value);
        expect(comparison.success && comparison.value < 0).toBe(true);
      }
    });

    it('returns zero when equal', () => {
      const mrr1 = MonthlyRecurringRevenue.create(500, 'SEK');
      const mrr2 = MonthlyRecurringRevenue.create(500, 'SEK');
      if (mrr1.success && mrr2.success) {
        const comparison = mrr1.value.compare(mrr2.value);
        expect(comparison.success && comparison.value === 0).toBe(true);
      }
    });

    it('fails when comparing different currencies', () => {
      const sek = MonthlyRecurringRevenue.create(500, 'SEK');
      const usd = MonthlyRecurringRevenue.create(500, 'USD');
      if (sek.success && usd.success) {
        const comparison = sek.value.compare(usd.value);
        expect(comparison.success).toBe(false);
      }
    });
  });

  describe('equals()', () => {
    it('returns true for same amount and currency', () => {
      const mrr1 = MonthlyRecurringRevenue.create(500, 'SEK');
      const mrr2 = MonthlyRecurringRevenue.create(500, 'SEK');
      expect(mrr1.success && mrr2.success && mrr1.value.equals(mrr2.value)).toBe(true);
    });

    it('returns false for different amounts', () => {
      const mrr1 = MonthlyRecurringRevenue.create(500, 'SEK');
      const mrr2 = MonthlyRecurringRevenue.create(600, 'SEK');
      expect(mrr1.success && mrr2.success && mrr1.value.equals(mrr2.value)).toBe(false);
    });

    it('returns false for different currencies', () => {
      const mrr1 = MonthlyRecurringRevenue.create(500, 'SEK');
      const mrr2 = MonthlyRecurringRevenue.create(500, 'USD');
      expect(mrr1.success && mrr2.success && mrr1.value.equals(mrr2.value)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('amount cannot be changed after creation', () => {
      const result = MonthlyRecurringRevenue.create(500, 'SEK');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(() => {
          // @ts-expect-error - Testing runtime immutability
          result.value.amount = 1000;
        }).toThrow();
      }
    });

    it('currency cannot be changed after creation', () => {
      const result = MonthlyRecurringRevenue.create(500, 'SEK');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(() => {
          // @ts-expect-error - Testing runtime immutability
          result.value.currency = 'USD';
        }).toThrow();
      }
    });
  });
});
