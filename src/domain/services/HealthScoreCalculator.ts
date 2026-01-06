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

    return {
      activityStatus,
      loginRecency,
      channelAdoption,
      accountType,
      mrrValue,
      total: activityStatus + loginRecency + channelAdoption + accountType + mrrValue,
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
   */
  private calculateLoginRecency(customer: Customer): number {
    const daysSinceLogin = customer.daysSinceLastLogin();

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
}
