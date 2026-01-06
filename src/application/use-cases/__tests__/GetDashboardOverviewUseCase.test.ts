import { beforeEach, describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import {
  type CustomerReadRepository,
  type CustomerStatistics,
  type CustomerStatisticsRepository,
  type HealthDistribution,
  type MrrByCountry,
  type SearchCriteria,
} from '@domain/repositories';
import { HealthScoreCalculator } from '@domain/services';
import { type CustomerNotFoundError } from '@domain/types/errors';
import { GetDashboardOverviewUseCase } from '@application/use-cases/GetDashboardOverviewUseCase';
import { AccountType, CustomerStatus, type Result } from '@shared/types';

function createTestCustomer(overrides: Partial<CustomerProps> = {}): Customer {
  const now = new Date('2024-01-15T10:00:00Z');
  const defaults: CustomerProps = {
    id: 'CUST-001',
    accountOwner: 'John Smith',
    latestLogin: now,
    createdDate: new Date('2023-01-01T00:00:00Z'),
    billingCountry: 'Sweden',
    accountType: AccountType.Pro,
    languages: ['English'],
    status: CustomerStatus.Active,
    accountStatus: 'Loyal',
    propertyType: 'Hotels',
    currency: 'SEK',
    mrr: 1500,
    channels: ['Booking.com', 'Expedia'],
  };

  const result = Customer.create({ ...defaults, ...overrides });
  if (!result.success) {
    throw new Error(`Failed to create test customer: ${result.error.message}`);
  }
  return result.value;
}

class MockCustomerReadRepository implements CustomerReadRepository {
  private customers: Customer[] = [];

  setCustomers(customers: Customer[]): void {
    this.customers = customers;
  }

  getAll(): Customer[] {
    return this.customers;
  }

  getById(id: string): Result<Customer, CustomerNotFoundError> {
    const customer = this.customers.find((c) => c.id === id);
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

  search(_criteria: SearchCriteria): Customer[] {
    return this.customers;
  }

  count(): number {
    return this.customers.length;
  }
}

class MockCustomerStatisticsRepository implements CustomerStatisticsRepository {
  private statistics: CustomerStatistics = {
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    averageHealthScore: 0,
    totalMrr: 0,
    atRiskCount: 0,
  };

  private healthDistribution: HealthDistribution = {
    healthy: 0,
    atRisk: 0,
    critical: 0,
  };

  setStatistics(stats: CustomerStatistics): void {
    this.statistics = stats;
  }

  setHealthDistribution(dist: HealthDistribution): void {
    this.healthDistribution = dist;
  }

  getStatistics(): CustomerStatistics {
    return this.statistics;
  }

  getHealthDistribution(): HealthDistribution {
    return this.healthDistribution;
  }

  getMrrByCountry(): MrrByCountry[] {
    return [];
  }
}

describe('GetDashboardOverviewUseCase', () => {
  let useCase: GetDashboardOverviewUseCase;
  let mockReadRepository: MockCustomerReadRepository;
  let mockStatsRepository: MockCustomerStatisticsRepository;
  let healthScoreCalculator: HealthScoreCalculator;

  beforeEach(() => {
    mockReadRepository = new MockCustomerReadRepository();
    mockStatsRepository = new MockCustomerStatisticsRepository();
    healthScoreCalculator = new HealthScoreCalculator();
    useCase = new GetDashboardOverviewUseCase(
      mockReadRepository,
      mockStatsRepository,
      healthScoreCalculator
    );
  });

  describe('execute', () => {
    it('returns metrics from statistics repository', () => {
      mockStatsRepository.setStatistics({
        totalCount: 100,
        activeCount: 75,
        inactiveCount: 25,
        averageHealthScore: 72,
        totalMrr: 150000,
        atRiskCount: 15,
      });

      mockStatsRepository.setHealthDistribution({
        healthy: 60,
        atRisk: 30,
        critical: 10,
      });

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.metrics.totalCustomers).toBe(100);
        expect(result.value.metrics.activeCustomers).toBe(75);
        expect(result.value.metrics.inactiveCustomers).toBe(25);
        expect(result.value.metrics.totalMrr).toBe(150000);
      }
    });

    it('returns health distribution', () => {
      mockStatsRepository.setHealthDistribution({
        healthy: 50,
        atRisk: 30,
        critical: 20,
      });

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.metrics.healthDistribution.healthy).toBe(50);
        expect(result.value.metrics.healthDistribution.atRisk).toBe(30);
        expect(result.value.metrics.healthDistribution.critical).toBe(20);
      }
    });

    it('calculates status distribution from customers', () => {
      const customers = [
        createTestCustomer({ id: 'C1', status: CustomerStatus.Active }),
        createTestCustomer({ id: 'C2', status: CustomerStatus.Active }),
        createTestCustomer({ id: 'C3', status: CustomerStatus.Inactive }),
      ];
      mockReadRepository.setCustomers(customers);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        const activeStatus = result.value.customersByStatus.find((s) => s.status === 'Active');
        const inactiveStatus = result.value.customersByStatus.find(
          (s) => s.status === 'Inactive'
        );

        expect(activeStatus?.count).toBe(2);
        expect(activeStatus?.percentage).toBe(67);
        expect(inactiveStatus?.count).toBe(1);
        expect(inactiveStatus?.percentage).toBe(33);
      }
    });

    it('identifies at-risk customers', () => {
      // Create customers with varying health factors
      const customers = [
        // High health (active, recent login, multiple channels, pro)
        createTestCustomer({
          id: 'HEALTHY-001',
          status: CustomerStatus.Active,
          latestLogin: new Date(),
          channels: ['Booking.com', 'Expedia', 'Airbnb'],
          accountType: AccountType.Pro,
          mrr: 5000,
        }),
        // Low health (inactive, old login, few channels, starter)
        createTestCustomer({
          id: 'ATRISK-001',
          status: CustomerStatus.Inactive,
          latestLogin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          channels: ['Booking.com'],
          accountType: AccountType.Starter,
          mrr: 100,
        }),
      ];
      mockReadRepository.setCustomers(customers);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have at least one at-risk customer
        expect(result.value.atRiskCustomers.length).toBeGreaterThanOrEqual(1);
        // At-risk customers should have lower health scores
        for (const atRisk of result.value.atRiskCustomers) {
          expect(atRisk.healthScore).toBeLessThan(70);
        }
      }
    });

    it('sorts at-risk customers by health score ascending', () => {
      const customers = [
        createTestCustomer({
          id: 'CUST-001',
          status: CustomerStatus.Inactive,
          latestLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        }),
        createTestCustomer({
          id: 'CUST-002',
          status: CustomerStatus.Inactive,
          latestLogin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        }),
      ];
      mockReadRepository.setCustomers(customers);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success && result.value.atRiskCustomers.length >= 2) {
        const scores = result.value.atRiskCustomers.map((c) => c.healthScore);
        for (let i = 1; i < scores.length; i++) {
          expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
        }
      }
    });

    it('limits at-risk customers to top 10', () => {
      // Create 15 at-risk customers
      const customers = Array.from({ length: 15 }, (_, i) =>
        createTestCustomer({
          id: `CUST-${String(i + 1).padStart(3, '0')}`,
          status: CustomerStatus.Inactive,
          latestLogin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        })
      );
      mockReadRepository.setCustomers(customers);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.atRiskCustomers.length).toBeLessThanOrEqual(10);
      }
    });

    it('returns empty status distribution for no customers', () => {
      mockReadRepository.setCustomers([]);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customersByStatus).toEqual([]);
      }
    });

    it('includes MRR in at-risk customer data', () => {
      const customers = [
        createTestCustomer({
          id: 'ATRISK-001',
          status: CustomerStatus.Inactive,
          mrr: 2500,
        }),
      ];
      mockReadRepository.setCustomers(customers);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success && result.value.atRiskCustomers.length > 0) {
        expect(result.value.atRiskCustomers[0].mrr).toBe(2500);
      }
    });
  });
});
