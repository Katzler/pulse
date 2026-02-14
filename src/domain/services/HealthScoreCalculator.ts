import { type Customer } from '@domain/entities';
import { HealthScore } from '@domain/value-objects';
import { type Result } from '@shared/types';

/**
 * Factor breakdown showing individual scoring components
 */
export interface FactorBreakdown {
  activityStatus: number;
  loginRecency: number;
  channelAdoption: number;
  accountType: number;
  mrrValue: number;
  total: number;
}

/**
 * Individual factor explanation
 */
export interface FactorExplanation {
  name: string;
  maxPoints: number;
  weight: string;
  description: string;
  criteria: string[];
}

/**
 * Classification range explanation
 */
export interface ClassificationExplanation {
  name: string;
  range: string;
  minScore: number;
  maxScore: number;
  description: string;
}

/**
 * Complete formula explanation
 */
export interface FormulaExplanation {
  summary: string;
  totalMaxScore: number;
  factors: FactorExplanation[];
  classifications: ClassificationExplanation[];
}

/**
 * Scoring thresholds for login recency
 */
const LOGIN_RECENCY_THRESHOLDS = [
  { days: 7, points: 25 },
  { days: 14, points: 20 },
  { days: 30, points: 15 },
  { days: 60, points: 10 },
  { days: 90, points: 5 },
] as const;

/**
 * Classification thresholds
 */
const HEALTHY_THRESHOLD = 70;
const AT_RISK_THRESHOLD = 30;

/**
 * Scoring thresholds for MRR value
 */
const MRR_THRESHOLDS = [
  { min: 2000, points: 10 },
  { min: 1500, points: 8 },
  { min: 1000, points: 6 },
  { min: 500, points: 4 },
  { min: 200, points: 2 },
] as const;

/**
 * Points per channel count
 */
const CHANNEL_POINTS: Record<number, number> = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
};

/**
 * HealthScoreCalculator Domain Service
 *
 * Calculates customer health scores based on weighted factors:
 * - Activity Status: 30 points (30%)
 * - Login Recency: 25 points (25%)
 * - Channel Adoption: 20 points (20%)
 * - Account Type: 15 points (15%)
 * - MRR Value: 10 points (10%)
 *
 * This service is stateless and deterministic.
 */
export class HealthScoreCalculator {
  /**
   * Calculate health score for a customer
   * @param customer - The customer entity
   * @returns Result with HealthScore value object
   */
  calculate(customer: Customer): Result<HealthScore, string> {
    const breakdown = this.getFactorBreakdown(customer);
    return HealthScore.create(breakdown.total);
  }

  /**
   * Get detailed breakdown of scoring factors
   * @param customer - The customer entity
   * @returns Individual factor scores and total
   */
  getFactorBreakdown(customer: Customer): FactorBreakdown {
    const activityStatus = this.calculateActivityStatus(customer);
    const loginRecency = this.calculateLoginRecency(customer);
    const channelAdoption = this.calculateChannelAdoption(customer);
    const accountType = this.calculateAccountType(customer);
    const mrrValue = this.calculateMrrValue(customer);

    const total = activityStatus + loginRecency + channelAdoption + accountType + mrrValue;

    return {
      activityStatus,
      loginRecency,
      channelAdoption,
      accountType,
      mrrValue,
      total,
    };
  }

  /**
   * Activity Status Factor (30 points max)
   * - Active: 30 points
   * - Inactive: 0 points
   */
  private calculateActivityStatus(customer: Customer): number {
    return customer.isActive() ? 30 : 0;
  }

  /**
   * Login Recency Factor (25 points max)
   * Based on days since last login
   * Returns 0 if customer has never logged in
   */
  private calculateLoginRecency(customer: Customer): number {
    const daysSinceLogin = customer.daysSinceLastLogin();

    if (daysSinceLogin === null) {
      return 0;
    }

    for (const threshold of LOGIN_RECENCY_THRESHOLDS) {
      if (daysSinceLogin <= threshold.days) {
        return threshold.points;
      }
    }

    return 0;
  }

  /**
   * Channel Adoption Factor (20 points max)
   * Based on number of connected channels
   */
  private calculateChannelAdoption(customer: Customer): number {
    const channelCount = customer.channelCount;

    if (channelCount >= 5) {
      return 20;
    }

    return CHANNEL_POINTS[channelCount] ?? 0;
  }

  /**
   * Account Type Factor (15 points max)
   * - Pro: 15 points
   * - Starter: 5 points
   */
  private calculateAccountType(customer: Customer): number {
    return customer.isPro() ? 15 : 5;
  }

  /**
   * MRR Value Factor (10 points max)
   * Based on monthly recurring revenue thresholds
   */
  private calculateMrrValue(customer: Customer): number {
    const mrr = customer.mrr;

    for (const threshold of MRR_THRESHOLDS) {
      if (mrr >= threshold.min) {
        return threshold.points;
      }
    }

    return 0;
  }

  /**
   * Get a complete explanation of the health score formula
   * @returns FormulaExplanation with all factors, weights, and classifications
   */
  static explainFormula(): FormulaExplanation {
    return {
      summary:
        'Health score is calculated from 5 weighted factors, totaling 100 points. ' +
        'Higher scores indicate healthier customer relationships.',
      totalMaxScore: 100,
      factors: [
        {
          name: 'Activity Status',
          maxPoints: 30,
          weight: '30%',
          description: 'Whether the customer account is currently active',
          criteria: ['Active: 30 points', 'Inactive: 0 points'],
        },
        {
          name: 'Login Recency',
          maxPoints: 25,
          weight: '25%',
          description: 'How recently the customer last logged in',
          criteria: [
            'Within 7 days: 25 points',
            'Within 14 days: 20 points',
            'Within 30 days: 15 points',
            'Within 60 days: 10 points',
            'Within 90 days: 5 points',
            'Over 90 days: 0 points',
          ],
        },
        {
          name: 'Channel Adoption',
          maxPoints: 20,
          weight: '20%',
          description: 'Number of distribution channels connected',
          criteria: [
            '5+ channels: 20 points',
            '4 channels: 16 points',
            '3 channels: 12 points',
            '2 channels: 8 points',
            '1 channel: 4 points',
            '0 channels: 0 points',
          ],
        },
        {
          name: 'Account Type',
          maxPoints: 15,
          weight: '15%',
          description: 'The tier of the customer subscription',
          criteria: ['Pro: 15 points', 'Starter: 5 points'],
        },
        {
          name: 'MRR Value',
          maxPoints: 10,
          weight: '10%',
          description: 'Monthly recurring revenue tier',
          criteria: [
            '$2,000+: 10 points',
            '$1,500+: 8 points',
            '$1,000+: 6 points',
            '$500+: 4 points',
            '$200+: 2 points',
            'Under $200: 0 points',
          ],
        },
      ],
      classifications: [
        {
          name: 'Healthy',
          range: '70-100',
          minScore: HEALTHY_THRESHOLD,
          maxScore: 100,
          description: 'Customer is engaged and in good standing',
        },
        {
          name: 'At Risk',
          range: '30-69',
          minScore: AT_RISK_THRESHOLD,
          maxScore: HEALTHY_THRESHOLD - 1,
          description: 'Customer may need attention to prevent churn',
        },
        {
          name: 'Critical',
          range: '0-29',
          minScore: 0,
          maxScore: AT_RISK_THRESHOLD - 1,
          description: 'Immediate intervention recommended',
        },
      ],
    };
  }
}
