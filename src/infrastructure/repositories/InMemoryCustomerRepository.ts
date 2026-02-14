import { type Customer } from '@domain/entities';
import {
  type CustomerReadRepository,
  type CustomerRepository,
  type CustomerStatistics,
  type CustomerStatisticsRepository,
  type CustomerWriteRepository,
  type HealthDistribution,
  type ImportSummary,
  type MrrByCountry,
  type SearchCriteria,
} from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type CustomerNotFoundError, type DuplicateCustomerError, type ImportError } from '@domain/types/errors';
import { HealthScoreClassification } from '@domain/value-objects';
import { type CustomerId, CustomerStatus, type Result } from '@shared/types';

/**
 * In-memory implementation of the CustomerRepository.
 * Stores customers in a Map for O(1) lookups by ID.
 * Implements read, write, and statistics interfaces.
 */
export class InMemoryCustomerRepository
  implements CustomerRepository, CustomerReadRepository, CustomerWriteRepository, CustomerStatisticsRepository
{
  private readonly customers: Map<string, Customer> = new Map();
  private healthScoreCalculator: HealthScoreCalculator | null = null;

  /**
   * Set the health score calculator for statistics calculations.
   * This is optional - if not set, health-related statistics will use defaults.
   */
  setHealthScoreCalculator(calculator: HealthScoreCalculator): void {
    this.healthScoreCalculator = calculator;
  }

  // ==================== CustomerReadRepository ====================

  /**
   * Retrieve all customers
   */
  async getAll(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  /**
   * Find a customer by their unique ID
   */
  async getById(id: CustomerId): Promise<Result<Customer, CustomerNotFoundError>> {
    // CustomerId is a branded string type, so we can use it directly as Map key
    const customer = this.customers.get(id);
    if (customer) {
      return { success: true, value: customer };
    }
    return {
      success: false,
      error: {
        type: 'CUSTOMER_NOT_FOUND',
        message: `Customer not found: ${id}`,
        details: { customerId: id },
      },
    };
  }

  /**
   * Search customers using multiple criteria
   */
  async search(criteria: SearchCriteria): Promise<Customer[]> {
    let results = await this.getAll();

    // Text search (partial match on ID or account owner)
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(
        (c) => c.id.toLowerCase().includes(query) || c.accountOwner.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (criteria.status) {
      const isActive = criteria.status === CustomerStatus.Active;
      results = results.filter((c) => c.isActive() === isActive);
    }

    // Filter by country
    if (criteria.country) {
      results = results.filter((c) => c.billingCountry === criteria.country);
    }

    // Filter by account type
    if (criteria.accountType) {
      results = results.filter((c) => c.accountType === criteria.accountType);
    }

    // Filter by languages (any match)
    if (criteria.languages && criteria.languages.length > 0) {
      results = results.filter((c) => criteria.languages!.some((lang) => c.languages.includes(lang)));
    }

    // Filter by channels (any match)
    if (criteria.channels && criteria.channels.length > 0) {
      results = results.filter((c) => criteria.channels!.some((channel) => c.channels.includes(channel)));
    }

    // Filter by health status (requires health score calculator)
    if (criteria.healthStatus && this.healthScoreCalculator) {
      results = results.filter((c) => {
        const scoreResult = this.healthScoreCalculator!.calculate(c);
        if (!scoreResult.success) return false;
        return scoreResult.value.getClassification() === criteria.healthStatus;
      });
    }

    // Apply pagination
    const offset = criteria.offset ?? 0;
    const limit = criteria.limit ?? results.length;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * Get total customer count
   */
  async count(): Promise<number> {
    return this.customers.size;
  }

  // ==================== CustomerWriteRepository ====================

  /**
   * Add a single customer
   */
  async add(customer: Customer): Promise<Result<void, DuplicateCustomerError>> {
    if (this.customers.has(customer.id)) {
      return {
        success: false,
        error: {
          type: 'DUPLICATE_CUSTOMER',
          message: `Customer already exists: ${customer.id}`,
          details: { customerId: customer.id },
        },
      };
    }
    this.customers.set(customer.id, customer);
    return { success: true, value: undefined };
  }

  /**
   * Bulk add multiple customers
   */
  async addMany(customers: Customer[]): Promise<Result<ImportSummary, ImportError>> {
    let successCount = 0;
    let skippedCount = 0;

    for (const customer of customers) {
      if (this.customers.has(customer.id)) {
        skippedCount++;
      } else {
        this.customers.set(customer.id, customer);
        successCount++;
      }
    }

    return {
      success: true,
      value: {
        totalProcessed: customers.length,
        successCount,
        failedCount: 0,
        skippedCount,
      },
    };
  }

  /**
   * Remove all customers from the repository
   */
  async clear(): Promise<void> {
    this.customers.clear();
  }

  // ==================== CustomerStatisticsRepository ====================

  /**
   * Get aggregate statistics for all customers
   */
  async getStatistics(): Promise<CustomerStatistics> {
    const customers = await this.getAll();
    const totalCount = customers.length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        averageHealthScore: 0,
        totalMrr: 0,
        atRiskCount: 0,
      };
    }

    let activeCount = 0;
    let totalMrr = 0;
    let totalHealthScore = 0;
    let atRiskCount = 0;
    let healthScoreCount = 0;

    for (const customer of customers) {
      if (customer.isActive()) {
        activeCount++;
      }
      totalMrr += customer.mrr;

      // Calculate health scores if calculator is available
      if (this.healthScoreCalculator) {
        const scoreResult = this.healthScoreCalculator.calculate(customer);
        if (scoreResult.success) {
          totalHealthScore += scoreResult.value.value;
          healthScoreCount++;
          const classification = scoreResult.value.getClassification();
          if (classification === HealthScoreClassification.AtRisk || classification === HealthScoreClassification.Critical) {
            atRiskCount++;
          }
        }
      }
    }

    return {
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
      averageHealthScore: healthScoreCount > 0 ? Math.round(totalHealthScore / healthScoreCount) : 0,
      totalMrr,
      atRiskCount,
    };
  }

  /**
   * Get health score distribution (healthy/at-risk/critical counts)
   */
  async getHealthDistribution(): Promise<HealthDistribution> {
    if (!this.healthScoreCalculator) {
      return { healthy: 0, atRisk: 0, critical: 0 };
    }

    const customers = await this.getAll();
    let healthy = 0;
    let atRisk = 0;
    let critical = 0;

    for (const customer of customers) {
      const scoreResult = this.healthScoreCalculator.calculate(customer);
      if (scoreResult.success) {
        switch (scoreResult.value.getClassification()) {
          case HealthScoreClassification.Healthy:
            healthy++;
            break;
          case HealthScoreClassification.AtRisk:
            atRisk++;
            break;
          case HealthScoreClassification.Critical:
            critical++;
            break;
        }
      }
    }

    return { healthy, atRisk, critical };
  }

  /**
   * Get MRR totals grouped by country
   */
  async getMrrByCountry(): Promise<MrrByCountry[]> {
    const customers = await this.getAll();
    const countryMap = new Map<string, { totalMrr: number; customerCount: number }>();

    for (const customer of customers) {
      const country = customer.billingCountry;
      const existing = countryMap.get(country);
      if (existing) {
        existing.totalMrr += customer.mrr;
        existing.customerCount++;
      } else {
        countryMap.set(country, { totalMrr: customer.mrr, customerCount: 1 });
      }
    }

    return Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        totalMrr: data.totalMrr,
        customerCount: data.customerCount,
      }))
      .sort((a, b) => b.totalMrr - a.totalMrr); // Sort by MRR descending
  }
}
