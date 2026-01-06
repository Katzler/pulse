import type { CustomerSummaryDTO } from '@application/dtos';

/**
 * Filter criteria for querying customers from the store
 */
export interface CustomerFilterCriteria {
  /** Text search across ID, account owner, and country */
  searchQuery?: string;
  /** Filter by health classification */
  healthClassification?: 'healthy' | 'at-risk' | 'critical';
  /** Filter by billing country */
  country?: string;
  /** Filter by status */
  status?: 'Active Customer' | 'Inactive Customer';
  /** Filter by account type */
  accountType?: string;
}

/**
 * Sort configuration
 */
export interface CustomerSortConfig {
  key: CustomerSortKey;
  order: 'asc' | 'desc';
}

/**
 * Valid sort keys for customers
 */
export type CustomerSortKey =
  | 'healthScore'
  | 'id'
  | 'accountOwner'
  | 'status'
  | 'accountType'
  | 'mrr'
  | 'channelCount';

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
}

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Query parameters combining filter, sort, and pagination
 */
export interface CustomerQueryParams {
  filters?: CustomerFilterCriteria;
  sort?: CustomerSortConfig;
  pagination?: PaginationConfig;
}

/**
 * Service for querying and filtering customers from the store.
 * Implements the Repository pattern for read operations on CustomerSummaryDTO.
 *
 * This service adheres to Single Responsibility Principle by handling
 * only query/filter logic, separate from the store and UI components.
 */
export class CustomerQueryService {
  /**
   * Query customers with filtering, sorting, and pagination
   */
  query(
    customers: CustomerSummaryDTO[],
    params: CustomerQueryParams = {}
  ): PaginatedResult<CustomerSummaryDTO> {
    const { filters, sort, pagination } = params;

    // Step 1: Apply filters
    let result = filters ? this.applyFilters(customers, filters) : customers;

    // Step 2: Apply sorting
    if (sort) {
      result = this.applySort(result, sort);
    }

    // Step 3: Get total before pagination
    const totalItems = result.length;

    // Step 4: Apply pagination
    const pageSize = pagination?.pageSize ?? 20;
    const currentPage = pagination?.page ?? 1;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (pagination) {
      result = this.applyPagination(result, pagination);
    }

    return {
      items: result,
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    };
  }

  /**
   * Apply all filters to the customer list
   */
  applyFilters(
    customers: CustomerSummaryDTO[],
    filters: CustomerFilterCriteria
  ): CustomerSummaryDTO[] {
    let result = customers;

    // Text search filter
    if (filters.searchQuery?.trim()) {
      result = this.filterBySearchQuery(result, filters.searchQuery);
    }

    // Health classification filter
    if (filters.healthClassification) {
      result = this.filterByHealthClassification(result, filters.healthClassification);
    }

    // Country filter
    if (filters.country) {
      result = this.filterByCountry(result, filters.country);
    }

    // Status filter
    if (filters.status) {
      result = this.filterByStatus(result, filters.status);
    }

    // Account type filter
    if (filters.accountType) {
      result = this.filterByAccountType(result, filters.accountType);
    }

    return result;
  }

  /**
   * Filter by text search query (ID, account owner, or country)
   */
  filterBySearchQuery(
    customers: CustomerSummaryDTO[],
    query: string
  ): CustomerSummaryDTO[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return customers;

    return customers.filter(
      (customer) =>
        customer.id.toLowerCase().includes(lowerQuery) ||
        customer.accountOwner.toLowerCase().includes(lowerQuery) ||
        customer.billingCountry.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter by health classification
   */
  filterByHealthClassification(
    customers: CustomerSummaryDTO[],
    classification: 'healthy' | 'at-risk' | 'critical'
  ): CustomerSummaryDTO[] {
    return customers.filter((c) => c.healthClassification === classification);
  }

  /**
   * Filter by billing country
   */
  filterByCountry(
    customers: CustomerSummaryDTO[],
    country: string
  ): CustomerSummaryDTO[] {
    return customers.filter((c) => c.billingCountry === country);
  }

  /**
   * Filter by customer status
   */
  filterByStatus(
    customers: CustomerSummaryDTO[],
    status: 'Active Customer' | 'Inactive Customer'
  ): CustomerSummaryDTO[] {
    return customers.filter((c) => c.status === status);
  }

  /**
   * Filter by account type
   */
  filterByAccountType(
    customers: CustomerSummaryDTO[],
    accountType: string
  ): CustomerSummaryDTO[] {
    return customers.filter((c) => c.accountType === accountType);
  }

  /**
   * Apply sorting to the customer list
   */
  applySort(
    customers: CustomerSummaryDTO[],
    sort: CustomerSortConfig
  ): CustomerSummaryDTO[] {
    const { key, order } = sort;

    return [...customers].sort((a, b) => {
      let comparison = 0;

      switch (key) {
        case 'healthScore':
          comparison = a.healthScore - b.healthScore;
          break;
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'accountOwner':
          comparison = a.accountOwner.localeCompare(b.accountOwner);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'accountType':
          comparison = a.accountType.localeCompare(b.accountType);
          break;
        case 'mrr':
          comparison = a.mrr - b.mrr;
          break;
        case 'channelCount':
          comparison = a.channelCount - b.channelCount;
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Apply pagination to the customer list
   */
  applyPagination(
    customers: CustomerSummaryDTO[],
    pagination: PaginationConfig
  ): CustomerSummaryDTO[] {
    const { page, pageSize } = pagination;
    const startIndex = (page - 1) * pageSize;
    return customers.slice(startIndex, startIndex + pageSize);
  }

  /**
   * Get unique countries from customer list (for filter dropdowns)
   */
  getUniqueCountries(customers: CustomerSummaryDTO[]): string[] {
    const countries = new Set(customers.map((c) => c.billingCountry));
    return Array.from(countries).sort();
  }

  /**
   * Get unique account types from customer list (for filter dropdowns)
   */
  getUniqueAccountTypes(customers: CustomerSummaryDTO[]): string[] {
    const types = new Set(customers.map((c) => c.accountType));
    return Array.from(types).sort();
  }

  /**
   * Count customers by health classification
   */
  countByHealthClassification(
    customers: CustomerSummaryDTO[]
  ): Record<string, number> {
    return customers.reduce(
      (acc, c) => {
        acc[c.healthClassification] = (acc[c.healthClassification] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}

/**
 * Singleton instance for convenience
 */
export const customerQueryService = new CustomerQueryService();
