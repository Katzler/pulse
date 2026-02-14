import { type Customer } from '@domain/entities';
import { type CustomerReadRepository, type CustomerStatisticsRepository } from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type HealthScore, HealthScoreClassification } from '@domain/value-objects';
import { type DashboardMetricsDTO } from '@application/dtos';
import { MetricsMapper } from '@application/mappers';
import { calculateAllHealthScores } from '@application/utils/calculateAllHealthScores';
import { type Result } from '@shared/types';

/**
 * Status distribution data with percentage
 */
export interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

/**
 * Channel distribution with percentage
 */
export interface ChannelData {
  channel: string;
  customerCount: number;
  percentage: number;
}

/**
 * Property type distribution with percentage
 */
export interface PropertyTypeData {
  propertyType: string;
  customerCount: number;
  percentage: number;
}

/**
 * MRR by country data
 */
export interface CountryMrrData {
  country: string;
  mrr: number;
  customerCount: number;
}

/**
 * Output from the dashboard overview use case
 */
export interface GetDashboardOverviewOutput {
  metrics: DashboardMetricsDTO;
  customersByStatus: StatusData[];
  customersByChannel: ChannelData[];
  customersByPropertyType: PropertyTypeData[];
  mrrByCountry: CountryMrrData[];
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
      const healthScores = calculateAllHealthScores(customers, this.healthScoreCalculator);

      // Get statistics from repository
      const statistics = this.customerStatisticsRepository.getStatistics();
      const healthDistribution = this.customerStatisticsRepository.getHealthDistribution();

      // Build dashboard metrics DTO
      const metrics = MetricsMapper.toDashboardMetricsDTO(
        statistics,
        healthDistribution,
        customers
      );

      // Calculate distributions with percentages
      const customersByStatus = this.calculateStatusDistribution(customers);
      const customersByChannel = this.calculateChannelDistribution(customers);
      const customersByPropertyType = this.calculatePropertyTypeDistribution(customers);
      const mrrByCountry = this.calculateMrrByCountry(customers);

      // Get at-risk customers (sorted by health score ascending)
      const atRiskCustomers = this.getAtRiskCustomers(customers, healthScores);

      return {
        success: true,
        value: {
          metrics,
          customersByStatus,
          customersByChannel,
          customersByPropertyType,
          mrrByCountry,
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
   * Calculate channel distribution with percentages
   */
  private calculateChannelDistribution(customers: Customer[]): ChannelData[] {
    const total = customers.length;
    if (total === 0) {
      return [];
    }

    const channelCounts = new Map<string, number>();

    for (const customer of customers) {
      for (const channel of customer.channels) {
        const count = channelCounts.get(channel) ?? 0;
        channelCounts.set(channel, count + 1);
      }
    }

    return Array.from(channelCounts.entries())
      .map(([channel, customerCount]) => ({
        channel,
        customerCount,
        percentage: Math.round((customerCount / total) * 100),
      }))
      .sort((a, b) => b.customerCount - a.customerCount);
  }

  /**
   * Calculate property type distribution with percentages
   */
  private calculatePropertyTypeDistribution(customers: Customer[]): PropertyTypeData[] {
    const total = customers.length;
    if (total === 0) {
      return [];
    }

    const typeCounts = new Map<string, number>();

    for (const customer of customers) {
      const propertyType = customer.propertyType || 'Unknown';
      const count = typeCounts.get(propertyType) ?? 0;
      typeCounts.set(propertyType, count + 1);
    }

    return Array.from(typeCounts.entries())
      .map(([propertyType, customerCount]) => ({
        propertyType,
        customerCount,
        percentage: Math.round((customerCount / total) * 100),
      }))
      .sort((a, b) => b.customerCount - a.customerCount);
  }

  /**
   * Calculate MRR totals by country
   */
  private calculateMrrByCountry(customers: Customer[]): CountryMrrData[] {
    const countryData = new Map<string, { mrr: number; count: number }>();

    for (const customer of customers) {
      const country = customer.billingCountry || 'Unknown';
      const existing = countryData.get(country) ?? { mrr: 0, count: 0 };
      countryData.set(country, {
        mrr: existing.mrr + customer.mrr,
        count: existing.count + 1,
      });
    }

    return Array.from(countryData.entries())
      .map(([country, data]) => ({
        country,
        mrr: data.mrr,
        customerCount: data.count,
      }))
      .sort((a, b) => b.mrr - a.mrr);
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
