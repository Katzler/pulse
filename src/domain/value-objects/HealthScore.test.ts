import { describe, expect, it } from 'vitest';

import { HealthScore, HealthScoreClassification } from './HealthScore';

describe('HealthScore Value Object', () => {
  describe('creation', () => {
    it('creates a valid health score', () => {
      const result = HealthScore.create(75);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(75);
      }
    });

    it('rounds decimal values to nearest integer', () => {
      const result = HealthScore.create(75.7);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(76);
      }
    });

    it('fails for values below 0', () => {
      const result = HealthScore.create(-1);
      expect(result.success).toBe(false);
    });

    it('fails for values above 100', () => {
      const result = HealthScore.create(101);
      expect(result.success).toBe(false);
    });

    it('allows boundary value 0', () => {
      const result = HealthScore.create(0);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(0);
      }
    });

    it('allows boundary value 100', () => {
      const result = HealthScore.create(100);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(100);
      }
    });

    it('fails for NaN', () => {
      const result = HealthScore.create(NaN);
      expect(result.success).toBe(false);
    });
  });

  describe('classification - boundary tests', () => {
    describe('isHealthy()', () => {
      it('returns true for score of 100', () => {
        const score = HealthScore.create(100);
        expect(score.success && score.value.isHealthy()).toBe(true);
      });

      it('returns true for score of 70 (boundary)', () => {
        const score = HealthScore.create(70);
        expect(score.success && score.value.isHealthy()).toBe(true);
      });

      it('returns false for score of 69', () => {
        const score = HealthScore.create(69);
        expect(score.success && score.value.isHealthy()).toBe(false);
      });
    });

    describe('isAtRisk()', () => {
      it('returns true for score of 69', () => {
        const score = HealthScore.create(69);
        expect(score.success && score.value.isAtRisk()).toBe(true);
      });

      it('returns true for score of 30 (boundary)', () => {
        const score = HealthScore.create(30);
        expect(score.success && score.value.isAtRisk()).toBe(true);
      });

      it('returns false for score of 70', () => {
        const score = HealthScore.create(70);
        expect(score.success && score.value.isAtRisk()).toBe(false);
      });

      it('returns false for score of 29', () => {
        const score = HealthScore.create(29);
        expect(score.success && score.value.isAtRisk()).toBe(false);
      });
    });

    describe('isCritical()', () => {
      it('returns true for score of 29', () => {
        const score = HealthScore.create(29);
        expect(score.success && score.value.isCritical()).toBe(true);
      });

      it('returns true for score of 0 (boundary)', () => {
        const score = HealthScore.create(0);
        expect(score.success && score.value.isCritical()).toBe(true);
      });

      it('returns false for score of 30', () => {
        const score = HealthScore.create(30);
        expect(score.success && score.value.isCritical()).toBe(false);
      });
    });
  });

  describe('getClassification()', () => {
    it('returns "healthy" for score >= 70', () => {
      const score = HealthScore.create(85);
      expect(score.success && score.value.getClassification()).toBe(HealthScoreClassification.Healthy);
    });

    it('returns "at-risk" for score 30-69', () => {
      const score = HealthScore.create(50);
      expect(score.success && score.value.getClassification()).toBe(HealthScoreClassification.AtRisk);
    });

    it('returns "critical" for score < 30', () => {
      const score = HealthScore.create(15);
      expect(score.success && score.value.getClassification()).toBe(
        HealthScoreClassification.Critical
      );
    });
  });

  describe('getColor()', () => {
    it('returns green (#22C55E) for healthy scores', () => {
      const score = HealthScore.create(85);
      expect(score.success && score.value.getColor()).toBe('#22C55E');
    });

    it('returns amber (#F59E0B) for at-risk scores', () => {
      const score = HealthScore.create(50);
      expect(score.success && score.value.getColor()).toBe('#F59E0B');
    });

    it('returns red (#EF4444) for critical scores', () => {
      const score = HealthScore.create(15);
      expect(score.success && score.value.getColor()).toBe('#EF4444');
    });
  });

  describe('formatting', () => {
    it('toString() returns formatted string', () => {
      const score = HealthScore.create(85);
      expect(score.success && score.value.toString()).toBe('85/100');
    });

    it('toPercentage() returns percentage string', () => {
      const score = HealthScore.create(85);
      expect(score.success && score.value.toPercentage()).toBe('85%');
    });
  });

  describe('comparison', () => {
    it('equals() returns true for same value', () => {
      const score1 = HealthScore.create(75);
      const score2 = HealthScore.create(75);
      expect(score1.success && score2.success && score1.value.equals(score2.value)).toBe(true);
    });

    it('equals() returns false for different values', () => {
      const score1 = HealthScore.create(75);
      const score2 = HealthScore.create(76);
      expect(score1.success && score2.success && score1.value.equals(score2.value)).toBe(false);
    });

    it('isGreaterThan() works correctly', () => {
      const higher = HealthScore.create(80);
      const lower = HealthScore.create(60);
      expect(higher.success && lower.success && higher.value.isGreaterThan(lower.value)).toBe(true);
      expect(higher.success && lower.success && lower.value.isGreaterThan(higher.value)).toBe(false);
    });

    it('isLessThan() works correctly', () => {
      const higher = HealthScore.create(80);
      const lower = HealthScore.create(60);
      expect(higher.success && lower.success && lower.value.isLessThan(higher.value)).toBe(true);
      expect(higher.success && lower.success && higher.value.isLessThan(lower.value)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('value cannot be changed after creation', () => {
      const result = HealthScore.create(75);
      expect(result.success).toBe(true);
      if (result.success) {
        // TypeScript should prevent this, but verify at runtime
        expect(() => {
          // @ts-expect-error - Testing runtime immutability
          result.value.value = 50;
        }).toThrow();
      }
    });
  });
});
