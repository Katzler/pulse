import { type Customer } from '@domain/entities';
import { type CustomerReadRepository } from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type HealthScore } from '@domain/value-objects';
import {
  type ComparativeMetricsDTO,
  type CustomerDTO,
  type CustomerTimelineDTO,
  type HealthScoreBreakdownDTO,
} from '@application/dtos';
import { CustomerMapper, HealthScoreMapper } from '@application/mappers';
import { calculateAllHealthScores } from '@application/utils/calculateAllHealthScores';
import { CustomerId, type Result } from '@shared/types';

/**
 * Input for the get customer details use case
 */
export interface GetCustomerDetailsInput {
  customerId: string;
}

/**
 * Output with full customer details, health breakdown, and comparative metrics
 */
export interface GetCustomerDetailsOutput {
  customer: CustomerDTO;
  healthScore: HealthScoreBreakdownDTO;
  comparativeMetrics: ComparativeMetricsDTO;
  timeline: CustomerTimelineDTO;
}

/**
 * Use case for retrieving detailed customer information.
 * Includes full customer data and health score breakdown.
 */
export class GetCustomerDetailsUseCase {
  private readonly customerReadRepository: CustomerReadRepository;
  private readonly healthScoreCalculator: HealthScoreCalculator;

  constructor(customerReadRepository: CustomerReadRepository, healthScoreCalculator: HealthScoreCalculator) {
    this.customerReadRepository = customerReadRepository;
    this.healthScoreCalculator = healthScoreCalculator;
  }

  /**
   * Execute the get customer details use case
   */
  async execute(input: GetCustomerDetailsInput): Promise<Result<GetCustomerDetailsOutput, string>> {
    // Find the customer
    const customerResult = await this.customerReadRepository.getById(CustomerId.create(input.customerId));

    if (!customerResult.success) {
      return {
        success: false,
        error: `Customer not found: ${input.customerId}`,
      };
    }

    const customer = customerResult.value;

    // Calculate health score with breakdown
    const healthResult = this.healthScoreCalculator.calculate(customer);

    if (!healthResult.success) {
      return {
        success: false,
        error: `Failed to calculate health score: ${healthResult.error}`,
      };
    }

    const healthScore = healthResult.value;

    // Get factor breakdown
    const breakdown = this.healthScoreCalculator.getFactorBreakdown(customer);

    // Get all customers for comparative metrics
    const allCustomers = await this.customerReadRepository.getAll();
    const allHealthScores = calculateAllHealthScores(allCustomers, this.healthScoreCalculator);

    // Calculate comparative metrics
    const comparativeMetrics = this.calculateComparativeMetrics(customer, healthScore, allCustomers, allHealthScores);

    // Build timeline
    const timeline = this.buildTimeline(customer);

    // Map to DTOs
    const customerDTO = CustomerMapper.toDTO(customer, healthScore);
    const healthScoreDTO = HealthScoreMapper.toBreakdownDTO(breakdown);

    return {
      success: true,
      value: {
        customer: customerDTO,
        healthScore: healthScoreDTO,
        comparativeMetrics,
        timeline,
      },
    };
  }

  /**
   * Calculate comparative metrics for a customer vs the portfolio average
   */
  private calculateComparativeMetrics(
    customer: Customer,
    healthScore: HealthScore,
    allCustomers: Customer[],
    allHealthScores: Map<string, HealthScore>
  ): ComparativeMetricsDTO {
    // Calculate averages
    const healthScoreValues = Array.from(allHealthScores.values()).map((hs) => hs.value);
    const avgHealthScore = healthScoreValues.length > 0 ? healthScoreValues.reduce((a, b) => a + b, 0) / healthScoreValues.length : 0;

    const avgMrr = allCustomers.length > 0 ? allCustomers.reduce((sum, c) => sum + c.mrr, 0) / allCustomers.length : 0;

    const avgChannelCount =
      allCustomers.length > 0 ? allCustomers.reduce((sum, c) => sum + c.channels.length, 0) / allCustomers.length : 0;

    // Calculate percentile rank (what % of customers have lower health scores)
    const lowerScoreCount = healthScoreValues.filter((score) => score < healthScore.value).length;
    const percentileRank = healthScoreValues.length > 0 ? Math.round((lowerScoreCount / healthScoreValues.length) * 100) : 0;

    return {
      healthScoreVsAverage: Math.round((healthScore.value - avgHealthScore) * 100) / 100,
      mrrVsAverage: Math.round((customer.mrr - avgMrr) * 100) / 100,
      channelCountVsAverage: Math.round((customer.channels.length - avgChannelCount) * 100) / 100,
      percentileRank,
    };
  }

  /**
   * Build timeline data for the customer
   */
  private buildTimeline(customer: Customer): CustomerTimelineDTO {
    const now = new Date();
    const createdDate = customer.createdDate;
    const lastLoginDate = customer.latestLogin;

    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastLogin = lastLoginDate
      ? Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine account age category
    let accountAgeCategory: 'new' | 'established' | 'veteran';
    if (daysSinceCreation < 30) {
      accountAgeCategory = 'new';
    } else if (daysSinceCreation <= 365) {
      accountAgeCategory = 'established';
    } else {
      accountAgeCategory = 'veteran';
    }

    return {
      createdDate: createdDate.toISOString(),
      daysSinceCreation,
      lastLoginDate: lastLoginDate?.toISOString() ?? null,
      daysSinceLastLogin,
      accountAgeCategory,
    };
  }
}
