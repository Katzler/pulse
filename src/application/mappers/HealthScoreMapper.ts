import { type FactorBreakdown } from '@domain/services';
import { type HealthScoreBreakdownDTO } from '@application/dtos';

/**
 * Maps health score data to DTOs.
 * Pure functions with no side effects.
 */
export const HealthScoreMapper = {
  /**
   * Convert a FactorBreakdown to a HealthScoreBreakdownDTO
   */
  toBreakdownDTO(breakdown: FactorBreakdown): HealthScoreBreakdownDTO {
    return {
      totalScore: breakdown.total,
      activityScore: breakdown.activityStatus,
      loginRecencyScore: breakdown.loginRecency,
      channelAdoptionScore: breakdown.channelAdoption,
      accountTypeScore: breakdown.accountType,
      mrrScore: breakdown.mrrValue,
    };
  },
};
