import { describe, expect,it } from 'vitest';

import {
  AccountType,
  CustomerId,
  CustomerStatus,
  HealthScoreValue,
  Result,
} from '@shared/types';

describe('Shared Types', () => {
  describe('AccountType', () => {
    it('has Pro and Starter values', () => {
      expect(AccountType.Pro).toBe('Pro');
      expect(AccountType.Starter).toBe('Starter');
    });
  });

  describe('CustomerStatus', () => {
    it('has Active and Inactive values', () => {
      expect(CustomerStatus.Active).toBe('Active Customer');
      expect(CustomerStatus.Inactive).toBe('Inactive Customer');
    });
  });

  describe('HealthScoreValue', () => {
    it('creates valid health scores', () => {
      const score = HealthScoreValue.create(75);
      expect(score).toBe(75);
    });

    it('throws for invalid health scores', () => {
      expect(() => HealthScoreValue.create(-1)).toThrow();
      expect(() => HealthScoreValue.create(101)).toThrow();
    });

    it('validates score ranges', () => {
      expect(HealthScoreValue.isValid(0)).toBe(true);
      expect(HealthScoreValue.isValid(100)).toBe(true);
      expect(HealthScoreValue.isValid(-1)).toBe(false);
      expect(HealthScoreValue.isValid(101)).toBe(false);
    });
  });

  describe('CustomerId', () => {
    it('creates customer IDs', () => {
      const id = CustomerId.create('CUST-001');
      expect(id).toBe('CUST-001');
    });

    it('validates non-empty IDs', () => {
      expect(CustomerId.isValid('CUST-001')).toBe(true);
      expect(CustomerId.isValid('')).toBe(false);
    });
  });

  describe('Result', () => {
    it('creates success results', () => {
      const result = Result.ok(42);
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('creates failure results', () => {
      const result = Result.fail(new Error('test error'));
      expect(Result.isFail(result)).toBe(true);
      expect(() => Result.unwrap(result)).toThrow('test error');
    });

    it('provides default values for failures', () => {
      const result = Result.fail(new Error('test'));
      expect(Result.unwrapOr(result, 0)).toBe(0);
    });

    it('maps successful results', () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, (x) => x * 2);
      expect(Result.unwrap(mapped)).toBe(10);
    });
  });
});
