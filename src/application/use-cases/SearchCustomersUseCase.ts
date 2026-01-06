import { type Customer } from '@domain/entities';
import { type CustomerReadRepository, type SearchCriteria } from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type HealthScore, HealthScoreClassification } from '@domain/value-objects';
import { type CustomerSummaryDTO } from '@application/dtos';
import { CustomerMapper } from '@application/mappers';
import { type Result } from '@shared/types';

/**
 * Search input parameters
 */
export interface SearchCustomersInput {
  query?: string;
  status?: 'active' | 'inactive';
  healthStatus?: 'healthy' | 'at-risk' | 'critical';
  country?: string;
  accountType?: 'Pro' | 'Starter';
  channels?: string[];
  languages?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Search output with pagination info
 */
export interface SearchCustomersOutput {
  customers: CustomerSummaryDTO[];
  total: number;
  hasMore: boolean;
}

/**
 * Use case for searching and filtering customers.
 * Provides flexible search with multiple filter criteria.
 */
export class SearchCustomersUseCase {
  private readonly customerReadRepository: CustomerReadRepository;
  private readonly healthScoreCalculator: HealthScoreCalculator;

  constructor(customerReadRepository: CustomerReadRepository, healthScoreCalculator: HealthScoreCalculator) {
    this.customerReadRepository = customerReadRepository;
    this.healthScoreCalculator = healthScoreCalculator;
  }

  /**
   * Execute the search use case
   */
  execute(input: SearchCustomersInput): Result<SearchCustomersOutput, string> {
    try {
      // Convert input to search criteria
      const criteria = this.buildSearchCriteria(input);

      // Get all customers (we'll filter in repository)
      const allCustomers = this.customerReadRepository.getAll();

      // Calculate health scores for all customers
      const healthScores = this.calculateAllHealthScores(allCustomers);

      // Apply filters
      let filteredCustomers = this.customerReadRepository.search(criteria);

      // Apply health status filter (not handled by repository)
      if (input.healthStatus) {
        const targetClassification = this.mapHealthStatus(input.healthStatus);
        filteredCustomers = filteredCustomers.filter((customer) => {
          const score = healthScores.get(customer.id);
          return score && score.getClassification() === targetClassification;
        });
      }

      // Get total count before pagination
      const total = filteredCustomers.length;

      // Apply pagination
      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;
      const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

      // Map to DTOs
      const customerDTOs = CustomerMapper.toSummaryDTOList(paginatedCustomers, healthScores);

      return {
        success: true,
        value: {
          customers: customerDTOs,
          total,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search customers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Build search criteria from input
   */
  private buildSearchCriteria(input: SearchCustomersInput): SearchCriteria {
    const criteria: SearchCriteria = {};

    if (input.query) {
      criteria.query = input.query;
    }

    if (input.status) {
      criteria.status = input.status === 'active' ? 'Active Customer' : 'Inactive Customer';
    }

    if (input.country) {
      criteria.country = input.country;
    }

    if (input.accountType) {
      criteria.accountType = input.accountType;
    }

    if (input.channels && input.channels.length > 0) {
      criteria.channels = input.channels;
    }

    if (input.languages && input.languages.length > 0) {
      criteria.languages = input.languages;
    }

    return criteria;
  }

  /**
   * Map health status string to classification enum
   */
  private mapHealthStatus(status: 'healthy' | 'at-risk' | 'critical'): HealthScoreClassification {
    switch (status) {
      case 'healthy':
        return HealthScoreClassification.Healthy;
      case 'at-risk':
        return HealthScoreClassification.AtRisk;
      case 'critical':
        return HealthScoreClassification.Critical;
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
}
