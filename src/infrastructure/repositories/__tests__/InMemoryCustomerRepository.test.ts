import { beforeEach, describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import { HealthScoreCalculator } from '@domain/services';
import { AccountType, CustomerId, CustomerStatus } from '@shared/types';

import { InMemoryCustomerRepository } from '../InMemoryCustomerRepository';

function createTestCustomer(overrides: Partial<CustomerProps> = {}): Customer {
  const now = new Date('2024-01-15T10:00:00Z');
  const defaults: CustomerProps = {
    id: 'CUST-001',
    accountOwner: 'John Smith',
    accountName: 'Smith Hotels',
    latestLogin: now,
    createdDate: new Date('2023-01-01T00:00:00Z'),
    lastCsContactDate: new Date('2024-01-10'),
    billingCountry: 'Sweden',
    accountType: AccountType.Pro,
    languages: ['English', 'Swedish'],
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

describe('InMemoryCustomerRepository', () => {
  let repository: InMemoryCustomerRepository;

  beforeEach(() => {
    repository = new InMemoryCustomerRepository();
  });

  describe('CustomerReadRepository', () => {
    describe('getAll', () => {
      it('returns empty array when no customers', () => {
        expect(repository.getAll()).toEqual([]);
      });

      it('returns all customers', () => {
        const customer1 = createTestCustomer({ id: 'CUST-001' });
        const customer2 = createTestCustomer({ id: 'CUST-002' });
        repository.add(customer1);
        repository.add(customer2);

        const result = repository.getAll();

        expect(result).toHaveLength(2);
      });
    });

    describe('getById', () => {
      it('returns customer when found', () => {
        const customer = createTestCustomer({ id: 'CUST-001' });
        repository.add(customer);

        const result = repository.getById(CustomerId.create('CUST-001'));

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.id).toBe('CUST-001');
        }
      });

      it('returns error when not found', () => {
        const result = repository.getById(CustomerId.create('NONEXISTENT'));

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('CUSTOMER_NOT_FOUND');
        }
      });
    });

    describe('search', () => {
      beforeEach(() => {
        repository.add(createTestCustomer({ id: 'CUST-001', accountOwner: 'John Smith', billingCountry: 'Sweden' }));
        repository.add(createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane Doe', billingCountry: 'Norway' }));
        repository.add(
          createTestCustomer({ id: 'CUST-003', accountOwner: 'Bob Johnson', billingCountry: 'Sweden', status: CustomerStatus.Inactive })
        );
      });

      it('returns all customers when no criteria', () => {
        const result = repository.search({});
        expect(result).toHaveLength(3);
      });

      it('filters by text query on ID', () => {
        const result = repository.search({ query: 'CUST-001' });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('CUST-001');
      });

      it('filters by text query on account owner', () => {
        const result = repository.search({ query: 'john' });
        expect(result).toHaveLength(2); // John Smith and Bob Johnson
      });

      it('filters by country', () => {
        const result = repository.search({ country: 'Sweden' });
        expect(result).toHaveLength(2);
      });

      it('filters by status', () => {
        const result = repository.search({ status: CustomerStatus.Active });
        expect(result).toHaveLength(2);
      });

      it('applies multiple filters', () => {
        const result = repository.search({ country: 'Sweden', status: CustomerStatus.Active });
        expect(result).toHaveLength(1);
        expect(result[0].accountOwner).toBe('John Smith');
      });

      it('applies pagination with limit', () => {
        const result = repository.search({ limit: 2 });
        expect(result).toHaveLength(2);
      });

      it('applies pagination with offset', () => {
        const result = repository.search({ offset: 1 });
        expect(result).toHaveLength(2);
      });

      it('applies pagination with limit and offset', () => {
        const result = repository.search({ offset: 1, limit: 1 });
        expect(result).toHaveLength(1);
      });
    });

    describe('count', () => {
      it('returns 0 when empty', () => {
        expect(repository.count()).toBe(0);
      });

      it('returns correct count', () => {
        repository.add(createTestCustomer({ id: 'CUST-001' }));
        repository.add(createTestCustomer({ id: 'CUST-002' }));
        expect(repository.count()).toBe(2);
      });
    });
  });

  describe('CustomerWriteRepository', () => {
    describe('add', () => {
      it('adds a customer successfully', () => {
        const customer = createTestCustomer({ id: 'CUST-001' });

        const result = repository.add(customer);

        expect(result.success).toBe(true);
        expect(repository.count()).toBe(1);
      });

      it('returns error for duplicate customer', () => {
        const customer = createTestCustomer({ id: 'CUST-001' });
        repository.add(customer);

        const result = repository.add(customer);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('DUPLICATE_CUSTOMER');
        }
      });
    });

    describe('addMany', () => {
      it('adds multiple customers', () => {
        const customers = [createTestCustomer({ id: 'CUST-001' }), createTestCustomer({ id: 'CUST-002' }), createTestCustomer({ id: 'CUST-003' })];

        const result = repository.addMany(customers);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.successCount).toBe(3);
          expect(result.value.skippedCount).toBe(0);
        }
        expect(repository.count()).toBe(3);
      });

      it('skips duplicates', () => {
        repository.add(createTestCustomer({ id: 'CUST-001' }));

        const customers = [createTestCustomer({ id: 'CUST-001' }), createTestCustomer({ id: 'CUST-002' })];

        const result = repository.addMany(customers);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.successCount).toBe(1);
          expect(result.value.skippedCount).toBe(1);
        }
        expect(repository.count()).toBe(2);
      });
    });

    describe('clear', () => {
      it('removes all customers', () => {
        repository.add(createTestCustomer({ id: 'CUST-001' }));
        repository.add(createTestCustomer({ id: 'CUST-002' }));

        repository.clear();

        expect(repository.count()).toBe(0);
      });
    });
  });

  describe('CustomerStatisticsRepository', () => {
    describe('getStatistics', () => {
      it('returns zeros when empty', () => {
        const stats = repository.getStatistics();

        expect(stats.totalCount).toBe(0);
        expect(stats.activeCount).toBe(0);
        expect(stats.inactiveCount).toBe(0);
        expect(stats.totalMrr).toBe(0);
      });

      it('calculates correct statistics', () => {
        repository.add(createTestCustomer({ id: 'CUST-001', status: CustomerStatus.Active, mrr: 1000 }));
        repository.add(createTestCustomer({ id: 'CUST-002', status: CustomerStatus.Active, mrr: 2000 }));
        repository.add(createTestCustomer({ id: 'CUST-003', status: CustomerStatus.Inactive, mrr: 500 }));

        const stats = repository.getStatistics();

        expect(stats.totalCount).toBe(3);
        expect(stats.activeCount).toBe(2);
        expect(stats.inactiveCount).toBe(1);
        expect(stats.totalMrr).toBe(3500);
      });

      it('calculates health scores when calculator is set', () => {
        repository.setHealthScoreCalculator(new HealthScoreCalculator());
        repository.add(
          createTestCustomer({
            id: 'CUST-001',
            status: CustomerStatus.Active,
            latestLogin: new Date(),
            channels: ['Booking.com', 'Expedia', 'Airbnb'],
            accountType: AccountType.Pro,
            mrr: 5000,
          })
        );
        repository.add(
          createTestCustomer({
            id: 'CUST-002',
            status: CustomerStatus.Inactive,
            latestLogin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            channels: ['Booking.com'],
            accountType: AccountType.Starter,
            mrr: 100,
          })
        );

        const stats = repository.getStatistics();

        expect(stats.averageHealthScore).toBeGreaterThan(0);
        expect(stats.atRiskCount).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getHealthDistribution', () => {
      it('returns zeros when no calculator set', () => {
        repository.add(createTestCustomer({ id: 'CUST-001' }));

        const dist = repository.getHealthDistribution();

        expect(dist.healthy).toBe(0);
        expect(dist.atRisk).toBe(0);
        expect(dist.critical).toBe(0);
      });

      it('calculates distribution when calculator is set', () => {
        repository.setHealthScoreCalculator(new HealthScoreCalculator());

        // Healthy customer
        repository.add(
          createTestCustomer({
            id: 'HEALTHY-001',
            status: CustomerStatus.Active,
            latestLogin: new Date(),
            channels: ['Booking.com', 'Expedia', 'Airbnb'],
            accountType: AccountType.Pro,
            mrr: 5000,
          })
        );

        // At-risk customer
        repository.add(
          createTestCustomer({
            id: 'ATRISK-001',
            status: CustomerStatus.Inactive,
            latestLogin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            channels: ['Booking.com'],
            accountType: AccountType.Starter,
            mrr: 100,
          })
        );

        const dist = repository.getHealthDistribution();

        expect(dist.healthy + dist.atRisk + dist.critical).toBe(2);
      });
    });

    describe('getMrrByCountry', () => {
      it('returns empty array when no customers', () => {
        expect(repository.getMrrByCountry()).toEqual([]);
      });

      it('aggregates MRR by country', () => {
        repository.add(createTestCustomer({ id: 'CUST-001', billingCountry: 'Sweden', mrr: 1000 }));
        repository.add(createTestCustomer({ id: 'CUST-002', billingCountry: 'Sweden', mrr: 2000 }));
        repository.add(createTestCustomer({ id: 'CUST-003', billingCountry: 'Norway', mrr: 500 }));

        const mrrByCountry = repository.getMrrByCountry();

        expect(mrrByCountry).toHaveLength(2);

        const sweden = mrrByCountry.find((m) => m.country === 'Sweden');
        expect(sweden?.totalMrr).toBe(3000);
        expect(sweden?.customerCount).toBe(2);

        const norway = mrrByCountry.find((m) => m.country === 'Norway');
        expect(norway?.totalMrr).toBe(500);
        expect(norway?.customerCount).toBe(1);
      });

      it('sorts by MRR descending', () => {
        repository.add(createTestCustomer({ id: 'CUST-001', billingCountry: 'Sweden', mrr: 1000 }));
        repository.add(createTestCustomer({ id: 'CUST-002', billingCountry: 'Norway', mrr: 5000 }));
        repository.add(createTestCustomer({ id: 'CUST-003', billingCountry: 'Denmark', mrr: 2000 }));

        const mrrByCountry = repository.getMrrByCountry();

        expect(mrrByCountry[0].country).toBe('Norway');
        expect(mrrByCountry[1].country).toBe('Denmark');
        expect(mrrByCountry[2].country).toBe('Sweden');
      });
    });
  });
});
