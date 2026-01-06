import { type Customer } from '@domain/entities';
import {
  type CustomerNotFoundError,
  type DuplicateCustomerError,
  type ImportError,
} from '@domain/types/errors';
import { type HealthScoreClassification } from '@domain/value-objects';
import {
  type AccountType,
  type CustomerId,
  type CustomerStatus,
  type Result,
} from '@shared/types';

/**
 * Search criteria for querying customers
 */
export interface SearchCriteria {
  /** Text search across ID and account owner name */
  query?: string;
  /** Filter by languages (any match) */
  languages?: string[];
  /** Filter by channels (any match) */
  channels?: string[];
  /** Filter by customer status */
  status?: CustomerStatus;
  /** Filter by billing country */
  country?: string;
  /** Filter by account type */
  accountType?: AccountType;
  /** Filter by health score classification */
  healthStatus?: HealthScoreClassification;
  /** Maximum number of results */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Summary of import operation
 */
export interface ImportSummary {
  /** Total records processed */
  totalProcessed: number;
  /** Successfully imported records */
  successCount: number;
  /** Failed records */
  failedCount: number;
  /** Skipped (duplicate) records */
  skippedCount: number;
}

/**
 * Aggregate customer statistics
 */
export interface CustomerStatistics {
  /** Total customer count */
  totalCount: number;
  /** Active customer count */
  activeCount: number;
  /** Inactive customer count */
  inactiveCount: number;
  /** Average health score across all customers */
  averageHealthScore: number;
  /** Total MRR across all customers */
  totalMrr: number;
  /** Number of at-risk customers */
  atRiskCount: number;
}

/**
 * Health score distribution counts
 */
export interface HealthDistribution {
  /** Healthy customers (score >= 70) */
  healthy: number;
  /** At-risk customers (score 30-69) */
  atRisk: number;
  /** Critical customers (score < 30) */
  critical: number;
}

/**
 * MRR aggregated by country
 */
export interface MrrByCountry {
  /** Country code */
  country: string;
  /** Total MRR for this country */
  totalMrr: number;
  /** Number of customers in this country */
  customerCount: number;
}

/**
 * Read-only repository interface for customer queries
 *
 * Following Interface Segregation Principle - read operations
 * are separated from write operations.
 */
export interface CustomerReadRepository {
  /**
   * Retrieve all customers
   */
  getAll(): Customer[];

  /**
   * Find a customer by their unique ID
   */
  getById(id: CustomerId): Result<Customer, CustomerNotFoundError>;

  /**
   * Search customers using multiple criteria
   */
  search(criteria: SearchCriteria): Customer[];

  /**
   * Get total customer count
   */
  count(): number;
}

/**
 * Write repository interface for customer mutations
 *
 * Following Interface Segregation Principle - write operations
 * are separated from read operations.
 */
export interface CustomerWriteRepository {
  /**
   * Add a single customer
   */
  add(customer: Customer): Result<void, DuplicateCustomerError>;

  /**
   * Bulk add multiple customers
   */
  addMany(customers: Customer[]): Result<ImportSummary, ImportError>;

  /**
   * Remove all customers from the repository
   */
  clear(): void;
}

/**
 * Repository interface for aggregate/computed customer statistics
 *
 * Provides efficient aggregate queries without loading
 * all customers into memory.
 */
export interface CustomerStatisticsRepository {
  /**
   * Get aggregate statistics for all customers
   */
  getStatistics(): CustomerStatistics;

  /**
   * Get health score distribution (healthy/at-risk/critical counts)
   */
  getHealthDistribution(): HealthDistribution;

  /**
   * Get MRR totals grouped by country
   */
  getMrrByCountry(): MrrByCountry[];
}

/**
 * Combined repository interface for implementations that
 * provide all functionality in a single class.
 */
export interface CustomerRepository
  extends CustomerReadRepository,
    CustomerWriteRepository,
    CustomerStatisticsRepository {}
