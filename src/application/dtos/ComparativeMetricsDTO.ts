/**
 * Comparative metrics showing how a customer compares to averages.
 * Used in customer detail views to provide context.
 */
export interface ComparativeMetricsDTO {
  /** Difference from average health score (positive = above average) */
  healthScoreVsAverage: number;
  /** Difference from average MRR (positive = above average) */
  mrrVsAverage: number;
  /** Difference from average channel count (positive = above average) */
  channelCountVsAverage: number;
  /** Percentile rank (0-100, where 75 means better than 75% of customers) */
  percentileRank: number;
}

/**
 * Customer timeline with key dates and derived metrics.
 * Provides temporal context for customer relationship.
 */
export interface CustomerTimelineDTO {
  /** Account creation date as ISO string */
  createdDate: string;
  /** Number of days since account creation */
  daysSinceCreation: number;
  /** Last login date as ISO string */
  lastLoginDate: string;
  /** Number of days since last login */
  daysSinceLastLogin: number;
  /** Account age category: "new" (<30 days), "established" (30-365 days), or "veteran" (>365 days) */
  accountAgeCategory: 'new' | 'established' | 'veteran';
}
