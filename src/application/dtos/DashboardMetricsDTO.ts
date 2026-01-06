/**
 * Health score distribution by classification
 */
export interface HealthDistributionDTO {
  /** Count of healthy customers (score >= 70) */
  healthy: number;
  /** Count of at-risk customers (score 30-69) */
  atRisk: number;
  /** Count of critical customers (score < 30) */
  critical: number;
}

/**
 * Distribution count by category (country, channel, property type)
 */
export interface DistributionItem {
  /** Category name */
  name: string;
  /** Count of customers in this category */
  count: number;
  /** Optional: total MRR for this category */
  mrr?: number;
}

/**
 * Aggregate metrics for the dashboard overview.
 * Contains all summary statistics and distributions.
 */
export interface DashboardMetricsDTO {
  /** Total customer count */
  totalCustomers: number;
  /** Active customer count */
  activeCustomers: number;
  /** Inactive customer count */
  inactiveCustomers: number;
  /** Average health score across all customers */
  averageHealthScore: number;
  /** Total MRR across all customers */
  totalMrr: number;
  /** Distribution by health classification */
  healthDistribution: HealthDistributionDTO;
  /** Distribution by billing country */
  countryDistribution: DistributionItem[];
  /** Distribution by connected channel */
  channelDistribution: DistributionItem[];
  /** Distribution by property type */
  propertyTypeDistribution: DistributionItem[];
}
