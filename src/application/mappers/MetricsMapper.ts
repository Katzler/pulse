import { type Customer } from '@domain/entities';
import { type CustomerStatistics, type HealthDistribution } from '@domain/repositories';
import {
  type DashboardMetricsDTO,
  type DistributionItem,
  type HealthDistributionDTO,
} from '@application/dtos';

/**
 * Maps aggregate statistics to dashboard DTOs.
 * Pure functions with no side effects.
 */
export const MetricsMapper = {
  /**
   * Convert statistics and customer data to DashboardMetricsDTO
   */
  toDashboardMetricsDTO(
    statistics: CustomerStatistics,
    healthDistribution: HealthDistribution,
    customers: Customer[]
  ): DashboardMetricsDTO {
    return {
      totalCustomers: statistics.totalCount,
      activeCustomers: statistics.activeCount,
      inactiveCustomers: statistics.inactiveCount,
      averageHealthScore: statistics.averageHealthScore,
      totalMrr: statistics.totalMrr,
      healthDistribution: MetricsMapper.toHealthDistributionDTO(healthDistribution),
      countryDistribution: MetricsMapper.calculateCountryDistribution(customers),
      channelDistribution: MetricsMapper.calculateChannelDistribution(customers),
      propertyTypeDistribution: MetricsMapper.calculatePropertyTypeDistribution(customers),
    };
  },

  /**
   * Convert HealthDistribution to DTO
   */
  toHealthDistributionDTO(distribution: HealthDistribution): HealthDistributionDTO {
    return {
      healthy: distribution.healthy,
      atRisk: distribution.atRisk,
      critical: distribution.critical,
    };
  },

  /**
   * Calculate country distribution from customers
   */
  calculateCountryDistribution(customers: Customer[]): DistributionItem[] {
    const countryMap = new Map<string, { count: number; mrr: number }>();

    for (const customer of customers) {
      const country = customer.billingCountry || 'Unknown';
      const existing = countryMap.get(country) ?? { count: 0, mrr: 0 };
      countryMap.set(country, {
        count: existing.count + 1,
        mrr: existing.mrr + customer.mrr,
      });
    }

    return Array.from(countryMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        mrr: data.mrr,
      }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Calculate channel distribution from customers
   */
  calculateChannelDistribution(customers: Customer[]): DistributionItem[] {
    const channelMap = new Map<string, number>();

    for (const customer of customers) {
      for (const channel of customer.channels) {
        const count = channelMap.get(channel) ?? 0;
        channelMap.set(channel, count + 1);
      }
    }

    return Array.from(channelMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Calculate property type distribution from customers
   */
  calculatePropertyTypeDistribution(customers: Customer[]): DistributionItem[] {
    const typeMap = new Map<string, number>();

    for (const customer of customers) {
      const propertyType = customer.propertyType || 'Unknown';
      const count = typeMap.get(propertyType) ?? 0;
      typeMap.set(propertyType, count + 1);
    }

    return Array.from(typeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
};
