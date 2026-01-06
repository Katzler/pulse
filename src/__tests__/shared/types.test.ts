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

    it('does not map failed results', () => {
      const result: Result<number, string> = Result.fail('error');
      const mapped = Result.map(result, (x: number) => x * 2);
      expect(Result.isFail(mapped)).toBe(true);
    });

    describe('flatMap', () => {
      it('chains successful results', () => {
        const parse = (s: string): Result<number, string> => {
          const n = parseInt(s, 10);
          return isNaN(n) ? Result.fail('not a number') : Result.ok(n);
        };
        const double = (n: number): Result<number, string> => Result.ok(n * 2);

        const result = Result.flatMap(parse('5'), double);
        expect(Result.isOk(result)).toBe(true);
        expect(Result.unwrap(result)).toBe(10);
      });

      it('short-circuits on first failure', () => {
        const parse = (s: string): Result<number, string> => {
          const n = parseInt(s, 10);
          return isNaN(n) ? Result.fail('not a number') : Result.ok(n);
        };
        const double = (n: number): Result<number, string> => Result.ok(n * 2);

        const result = Result.flatMap(parse('abc'), double);
        expect(Result.isFail(result)).toBe(true);
        if (!result.success) {
          expect(result.error).toBe('not a number');
        }
      });

      it('propagates failure from chained function', () => {
        const validate = (n: number): Result<number, string> =>
          n > 0 ? Result.ok(n) : Result.fail('must be positive');

        const result = Result.flatMap(Result.ok(-5), validate);
        expect(Result.isFail(result)).toBe(true);
        if (!result.success) {
          expect(result.error).toBe('must be positive');
        }
      });
    });

    describe('match', () => {
      it('calls success handler for successful results', () => {
        const result = Result.ok(42);
        const output = Result.match(result, {
          success: (value) => `Value: ${value}`,
          failure: (error) => `Error: ${error}`,
        });
        expect(output).toBe('Value: 42');
      });

      it('calls failure handler for failed results', () => {
        const result = Result.fail('something went wrong');
        const output = Result.match(result, {
          success: (value) => `Value: ${value}`,
          failure: (error) => `Error: ${error}`,
        });
        expect(output).toBe('Error: something went wrong');
      });

      it('can transform to different types', () => {
        const successResult = Result.ok(10);
        const failResult: Result<number, string> = Result.fail('error');

        const successNum = Result.match(successResult, {
          success: (v: number) => v * 2,
          failure: () => 0,
        });
        const failNum = Result.match(failResult, {
          success: (v: number) => v * 2,
          failure: () => 0,
        });

        expect(successNum).toBe(20);
        expect(failNum).toBe(0);
      });
    });
  });
});
