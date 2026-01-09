import { type Customer } from '@domain/entities';
import { type CustomerReadRepository } from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type HealthScore, HealthScoreClassification } from '@domain/value-objects';
import { type CustomerSummaryDTO } from '@application/dtos';
import { CustomerMapper } from '@application/mappers';
import { type Result } from '@shared/types';

/**
 * Sort field options
 */
export type SortField = 'healthScore' | 'mrr' | 'name' | 'lastLogin';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Applied filter for tracking active filters
 */
export interface AppliedFilter {
  field: string;
  value: string | string[];
}

/**
 * Search input parameters
 */
export interface SearchCustomersInput {
  /** Exact match on customer ID */
  customerId?: string;
  /** Text search (partial match on ID or account owner) */
  query?: string;
  /** Filter by status */
  status?: 'active' | 'inactive';
  /** Filter by health classification */
  healthStatus?: 'healthy' | 'at-risk' | 'critical';
  /** Filter by country */
  country?: string;
  /** Filter by account type */
  accountType?: 'Pro' | 'Starter';
  /** Filter by channels (any match) */
  channels?: string[];
  /** Filter by languages (any match) */
  languages?: string[];
  /** Sort field */
  sortBy?: SortField;
  /** Sort order */
  sortOrder?: SortOrder;
  /** Page number (1-based) */
  page?: number;
  /** Page size (default 20, max 100) */
  pageSize?: number;
}

/**
 * Search output with pagination info
 */
export interface SearchCustomersOutput {
  customers: CustomerSummaryDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  appliedFilters: AppliedFilter[];
}

/**
 * Use case for searching and filtering customers.
 * Provides flexible search with multiple filter criteria.
 */
export class SearchCustomersUseCase {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly MAX_PAGE_SIZE = 100;

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
      // Get all customers
      const allCustomers = this.customerReadRepository.getAll();

      // Calculate health scores for all customers
      const healthScores = this.calculateAllHealthScores(allCustomers);

      // Apply filters
      let filteredCustomers = this.applyFilters(allCustomers, input, healthScores);

      // Apply sorting
      filteredCustomers = this.applySorting(filteredCustomers, healthScores, input.sortBy, input.sortOrder);

      // Calculate pagination
      const pageSize = Math.min(input.pageSize ?? SearchCustomersUseCase.DEFAULT_PAGE_SIZE, SearchCustomersUseCase.MAX_PAGE_SIZE);
      const page = Math.max(input.page ?? 1, 1);
      const totalCount = filteredCustomers.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const offset = (page - 1) * pageSize;

      // Apply pagination
      const paginatedCustomers = filteredCustomers.slice(offset, offset + pageSize);

      // Map to DTOs
      const customerDTOs = CustomerMapper.toSummaryDTOList(paginatedCustomers, healthScores);

      // Build applied filters list
      const appliedFilters = this.buildAppliedFilters(input);

      return {
        success: true,
        value: {
          customers: customerDTOs,
          totalCount,
          page,
          pageSize,
          totalPages,
          appliedFilters,
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
   * Apply all filters to customer list
   */
  private applyFilters(
    customers: Customer[],
    input: SearchCustomersInput,
    healthScores: Map<string, HealthScore>
  ): Customer[] {
    let result = customers;

    // Exact customer ID match (returns single result or empty)
    if (input.customerId) {
      result = result.filter((c) => c.id === input.customerId);
      return result; // Short-circuit if searching by exact ID
    }

    // Text query (partial match on ID or account owner)
    if (input.query) {
      const query = input.query.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(query) ||
          c.accountOwner.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (input.status) {
      const isActive = input.status === 'active';
      result = result.filter((c) => c.isActive() === isActive);
    }

    // Country filter
    if (input.country) {
      result = result.filter((c) => c.billingCountry === input.country);
    }

    // Account type filter
    if (input.accountType) {
      result = result.filter((c) => c.accountType === input.accountType);
    }

    // Channels filter (any match)
    if (input.channels && input.channels.length > 0) {
      result = result.filter((c) =>
        input.channels!.some((channel) => c.channels.includes(channel))
      );
    }

    // Languages filter (any match)
    if (input.languages && input.languages.length > 0) {
      result = result.filter((c) =>
        input.languages!.some((lang) => c.languages.includes(lang))
      );
    }

    // Health status filter
    if (input.healthStatus) {
      const targetClassification = this.mapHealthStatus(input.healthStatus);
      result = result.filter((customer) => {
        const score = healthScores.get(customer.id);
        return score && score.getClassification() === targetClassification;
      });
    }

    return result;
  }

  /**
   * Apply sorting to customer list
   */
  private applySorting(
    customers: Customer[],
    healthScores: Map<string, HealthScore>,
    sortBy?: SortField,
    sortOrder?: SortOrder
  ): Customer[] {
    const order = sortOrder ?? 'desc';
    const multiplier = order === 'asc' ? 1 : -1;

    const sorted = [...customers];

    switch (sortBy) {
      case 'healthScore':
        sorted.sort((a, b) => {
          const scoreA = healthScores.get(a.id)?.value ?? 0;
          const scoreB = healthScores.get(b.id)?.value ?? 0;
          return (scoreA - scoreB) * multiplier;
        });
        break;

      case 'mrr':
        sorted.sort((a, b) => (a.mrr - b.mrr) * multiplier);
        break;

      case 'name':
        sorted.sort((a, b) =>
          a.accountOwner.localeCompare(b.accountOwner) * multiplier
        );
        break;

      case 'lastLogin':
        sorted.sort((a, b) => {
          // Handle null latestLogin values
          if (!a.latestLogin && !b.latestLogin) return 0;
          if (!a.latestLogin) return 1 * multiplier; // null values go to the end
          if (!b.latestLogin) return -1 * multiplier;
          return (a.latestLogin.getTime() - b.latestLogin.getTime()) * multiplier;
        });
        break;

      default:
        // Default: sort by health score descending (show at-risk first)
        sorted.sort((a, b) => {
          const scoreA = healthScores.get(a.id)?.value ?? 0;
          const scoreB = healthScores.get(b.id)?.value ?? 0;
          return scoreA - scoreB; // Ascending by default to show at-risk first
        });
    }

    return sorted;
  }

  /**
   * Build list of applied filters for UI display
   */
  private buildAppliedFilters(input: SearchCustomersInput): AppliedFilter[] {
    const filters: AppliedFilter[] = [];

    if (input.customerId) {
      filters.push({ field: 'customerId', value: input.customerId });
    }
    if (input.query) {
      filters.push({ field: 'query', value: input.query });
    }
    if (input.status) {
      filters.push({ field: 'status', value: input.status });
    }
    if (input.healthStatus) {
      filters.push({ field: 'healthStatus', value: input.healthStatus });
    }
    if (input.country) {
      filters.push({ field: 'country', value: input.country });
    }
    if (input.accountType) {
      filters.push({ field: 'accountType', value: input.accountType });
    }
    if (input.channels && input.channels.length > 0) {
      filters.push({ field: 'channels', value: input.channels });
    }
    if (input.languages && input.languages.length > 0) {
      filters.push({ field: 'languages', value: input.languages });
    }

    return filters;
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
