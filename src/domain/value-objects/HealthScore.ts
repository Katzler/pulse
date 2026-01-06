import { type Result } from '@shared/types';

/**
 * Health score classification enum
 */
export const HealthScoreClassification = {
  Healthy: 'healthy',
  AtRisk: 'at-risk',
  Critical: 'critical',
} as const;

export type HealthScoreClassification =
  (typeof HealthScoreClassification)[keyof typeof HealthScoreClassification];

/**
 * Health score thresholds
 */
const HEALTHY_THRESHOLD = 70;
const AT_RISK_THRESHOLD = 30;

/**
 * Colors for each classification
 */
const CLASSIFICATION_COLORS: Record<HealthScoreClassification, string> = {
  [HealthScoreClassification.Healthy]: '#22C55E',
  [HealthScoreClassification.AtRisk]: '#F59E0B',
  [HealthScoreClassification.Critical]: '#EF4444',
};

/**
 * HealthScore Value Object
 *
 * Represents a customer health score from 0-100.
 * Immutable and validated on creation.
 */
export class HealthScore {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
    Object.freeze(this);
  }

  /**
   * Factory method to create a HealthScore
   * @param value - Score value (0-100)
   * @returns Result with HealthScore or error message
   */
  static create(value: number): Result<HealthScore, string> {
    if (Number.isNaN(value)) {
      return { success: false, error: 'Health score cannot be NaN' };
    }

    const rounded = Math.round(value);

    if (rounded < 0 || rounded > 100) {
      return {
        success: false,
        error: 'Health score must be between 0 and 100',
      };
    }

    return { success: true, value: new HealthScore(rounded) };
  }

  /**
   * Get the numeric value
   */
  get value(): number {
    return this._value;
  }

  /**
   * Check if score is in healthy range (>= 70)
   */
  isHealthy(): boolean {
    return this._value >= HEALTHY_THRESHOLD;
  }

  /**
   * Check if score is in at-risk range (30-69)
   */
  isAtRisk(): boolean {
    return this._value >= AT_RISK_THRESHOLD && this._value < HEALTHY_THRESHOLD;
  }

  /**
   * Check if score is in critical range (< 30)
   */
  isCritical(): boolean {
    return this._value < AT_RISK_THRESHOLD;
  }

  /**
   * Get the classification category
   */
  getClassification(): HealthScoreClassification {
    if (this.isHealthy()) {
      return HealthScoreClassification.Healthy;
    }
    if (this.isAtRisk()) {
      return HealthScoreClassification.AtRisk;
    }
    return HealthScoreClassification.Critical;
  }

  /**
   * Get the color associated with this score's classification
   */
  getColor(): string {
    return CLASSIFICATION_COLORS[this.getClassification()];
  }

  /**
   * Format as "X/100" string
   */
  toString(): string {
    return `${this._value}/100`;
  }

  /**
   * Format as percentage string
   */
  toPercentage(): string {
    return `${this._value}%`;
  }

  /**
   * Check equality with another HealthScore
   */
  equals(other: HealthScore): boolean {
    return this._value === other._value;
  }

  /**
   * Check if this score is greater than another
   */
  isGreaterThan(other: HealthScore): boolean {
    return this._value > other._value;
  }

  /**
   * Check if this score is less than another
   */
  isLessThan(other: HealthScore): boolean {
    return this._value < other._value;
  }
}
