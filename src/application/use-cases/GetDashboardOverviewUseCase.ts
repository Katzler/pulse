import { type Customer } from '@domain/entities';
import { type CustomerReadRepository, type CustomerStatisticsRepository } from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type HealthScore, HealthScoreClassification } from '@domain/value-objects';
import { type DashboardMetricsDTO } from '@application/dtos';
import { MetricsMapper } from '@application/mappers';
import { type Result } from '@shared/types';

/**
 * Status distribution data
 */
export interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

/**
 * Output from the dashboard overview use case
 */
export interface GetDashboardOverviewOutput {
  metrics: DashboardMetricsDTO;
  customersByStatus: StatusData[];
  atRiskCustomers: Array<{
    id: string;
    accountOwner: string;
    healthScore: number;
    mrr: number;
  }>;
}

/**
 * Use case for getting dashboard overview data.
 * Aggregates all metrics needed for the main dashboard.
 */
export class GetDashboardOverviewUseCase {
  private readonly customerReadRepository: CustomerReadRepository;
  private readonly customerStatisticsRepository: CustomerStatisticsRepository;
  private readonly healthScoreCalculator: HealthScoreCalculator;

  constructor(
    customerReadRepository: CustomerReadRepository,
    customerStatisticsRepository: CustomerStatisticsRepository,
    healthScoreCalculator: HealthScoreCalculator
  ) {
    this.customerReadRepository = customerReadRepository;
    this.customerStatisticsRepository = customerStatisticsRepository;
    this.healthScoreCalculator = healthScoreCalculator;
  }

  /**
   * Execute the dashboard overview use case
   */
  execute(): Result<GetDashboardOverviewOutput, string> {
    try {
      // Get all customers
      const customers = this.customerReadRepository.getAll();

      // Calculate health scores for all customers
      const healthScores = this.calculateAllHealthScores(customers);

      // Get statistics from repository
      const statistics = this.customerStatisticsRepository.getStatistics();
      const healthDistribution = this.customerStatisticsRepository.getHealthDistribution();

      // Build dashboard metrics DTO
      const metrics = MetricsMapper.toDashboardMetricsDTO(
        statistics,
        healthDistribution,
        customers
      );

      // Calculate status distribution
      const customersByStatus = this.calculateStatusDistribution(customers);

      // Get at-risk customers (sorted by health score ascending)
      const atRiskCustomers = this.getAtRiskCustomers(customers, healthScores);

      return {
        success: true,
        value: {
          metrics,
          customersByStatus,
          atRiskCustomers,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get dashboard overview: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Calculate health scores for all customers
   */
  private calculateAllHealthScores(customers: Customer[]): Map<string, HealthScore> {
    const scores = new Map<string, HealthScore>();

    for (const customer of customers) {
      const result = this.healthScoreCalculator.calculate(customer);
      if (result.success) {
        scores.set(customer.id, result.value);
      }
    }

    return scores;
  }

  /**
   * Calculate status distribution with percentages
   */
  private calculateStatusDistribution(customers: Customer[]): StatusData[] {
    const total = customers.length;
    if (total === 0) {
      return [];
    }

    const activeCount = customers.filter((c) => c.isActive()).length;
    const inactiveCount = total - activeCount;

    return [
      {
        status: 'Active',
        count: activeCount,
        percentage: Math.round((activeCount / total) * 100),
      },
      {
        status: 'Inactive',
        count: inactiveCount,
        percentage: Math.round((inactiveCount / total) * 100),
      },
    ];
  }

  /**
   * Get at-risk customers sorted by health score
   */
  private getAtRiskCustomers(
    customers: Customer[],
    healthScores: Map<string, HealthScore>
  ): Array<{ id: string; accountOwner: string; healthScore: number; mrr: number }> {
    const atRisk: Array<{
      id: string;
      accountOwner: string;
      healthScore: number;
      mrr: number;
    }> = [];

    for (const customer of customers) {
      const score = healthScores.get(customer.id);
      if (
        score &&
        (score.getClassification() === HealthScoreClassification.AtRisk ||
          score.getClassification() === HealthScoreClassification.Critical)
      ) {
        atRisk.push({
          id: customer.id,
          accountOwner: customer.accountOwner,
          healthScore: score.value,
          mrr: customer.mrr,
        });
      }
    }

    // Sort by health score ascending (most critical first)
    return atRisk.sort((a, b) => a.healthScore - b.healthScore).slice(0, 10);
  }
}
