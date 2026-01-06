/**
 * Detailed breakdown of health score factors.
 * Shows how each factor contributes to the total score.
 */
export interface HealthScoreBreakdownDTO {
  /** Final calculated health score (0-100) */
  totalScore: number;
  /** Activity status factor score (0-30) */
  activityScore: number;
  /** Login recency factor score (0-25) */
  loginRecencyScore: number;
  /** Channel adoption factor score (0-20) */
  channelAdoptionScore: number;
  /** Account type factor score (0-15) */
  accountTypeScore: number;
  /** MRR value factor score (0-10) */
  mrrScore: number;
}
