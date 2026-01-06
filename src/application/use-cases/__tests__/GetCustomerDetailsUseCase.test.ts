import { beforeEach, describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import { type CustomerReadRepository, type SearchCriteria } from '@domain/repositories';
import { HealthScoreCalculator } from '@domain/services';
import { type CustomerNotFoundError } from '@domain/types/errors';
import { GetCustomerDetailsUseCase } from '@application/use-cases/GetCustomerDetailsUseCase';
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

class MockCustomerReadRepository implements CustomerReadRepository {
  private customers: Map<string, Customer> = new Map();

  setCustomer(customer: Customer): void {
    this.customers.set(customer.id, customer);
  }

  getAll(): Customer[] {
    return Array.from(this.customers.values());
  }

  getById(id: string): Result<Customer, CustomerNotFoundError> {
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

  search(_criteria: SearchCriteria): Customer[] {
    return this.getAll();
  }

  count(): number {
    return this.customers.size;
  }
}

describe('GetCustomerDetailsUseCase', () => {
  let useCase: GetCustomerDetailsUseCase;
  let mockRepository: MockCustomerReadRepository;
  let healthScoreCalculator: HealthScoreCalculator;

  beforeEach(() => {
    mockRepository = new MockCustomerReadRepository();
    healthScoreCalculator = new HealthScoreCalculator();
    useCase = new GetCustomerDetailsUseCase(mockRepository, healthScoreCalculator);
  });

  describe('execute', () => {
    it('returns customer details when found', () => {
      const customer = createTestCustomer({ id: 'CUST-001' });
      mockRepository.setCustomer(customer);

      const result = useCase.execute({ customerId: 'CUST-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customer.id).toBe('CUST-001');
        expect(result.value.customer.accountOwner).toBe('John Smith');
      }
    });

    it('returns all customer fields', () => {
      const customer = createTestCustomer({
        id: 'CUST-001',
        accountOwner: 'Test User',
        billingCountry: 'Norway',
        mrr: 2500,
      });
      mockRepository.setCustomer(customer);

      const result = useCase.execute({ customerId: 'CUST-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        const dto = result.value.customer;
        expect(dto.accountOwner).toBe('Test User');
        expect(dto.billingCountry).toBe('Norway');
        expect(dto.mrr).toBe(2500);
        expect(dto.accountType).toBe('Pro');
        expect(dto.languages).toEqual(['English', 'Swedish']);
        expect(dto.channels).toEqual(['Booking.com', 'Expedia']);
      }
    });

    it('includes health score', () => {
      const customer = createTestCustomer({ id: 'CUST-001' });
      mockRepository.setCustomer(customer);

      const result = useCase.execute({ customerId: 'CUST-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customer.healthScore).toBeGreaterThanOrEqual(0);
        expect(result.value.customer.healthScore).toBeLessThanOrEqual(100);
      }
    });

    it('includes health breakdown with all factors', () => {
      const customer = createTestCustomer({ id: 'CUST-001' });
      mockRepository.setCustomer(customer);

      const result = useCase.execute({ customerId: 'CUST-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        const breakdown = result.value.healthScore;
        expect(breakdown.totalScore).toBeGreaterThanOrEqual(0);
        expect(breakdown.activityScore).toBeGreaterThanOrEqual(0);
        expect(breakdown.loginRecencyScore).toBeGreaterThanOrEqual(0);
        expect(breakdown.channelAdoptionScore).toBeGreaterThanOrEqual(0);
        expect(breakdown.accountTypeScore).toBeGreaterThanOrEqual(0);
        expect(breakdown.mrrScore).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns error when customer not found', () => {
      const result = useCase.execute({ customerId: 'NONEXISTENT' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Customer not found');
        expect(result.error).toContain('NONEXISTENT');
      }
    });

    it('calculates correct health classification', () => {
      // Create a healthy customer (active, recent login, channels)
      const healthyCustomer = createTestCustomer({
        id: 'HEALTHY-001',
        status: CustomerStatus.Active,
        latestLogin: new Date(),
        channels: ['Booking.com', 'Expedia', 'Airbnb'],
        accountType: AccountType.Pro,
        mrr: 5000,
      });
      mockRepository.setCustomer(healthyCustomer);

      const result = useCase.execute({ customerId: 'HEALTHY-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customer.healthClassification).toBe('healthy');
      }
    });

    it('calculates at-risk classification for inactive customers', () => {
      // Create an at-risk customer (inactive)
      const atRiskCustomer = createTestCustomer({
        id: 'ATRISK-001',
        status: CustomerStatus.Inactive,
        latestLogin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        channels: ['Booking.com'],
        accountType: AccountType.Starter,
        mrr: 100,
      });
      mockRepository.setCustomer(atRiskCustomer);

      const result = useCase.execute({ customerId: 'ATRISK-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        // Inactive customers score 0 for activity, likely at-risk or critical
        expect(['at-risk', 'critical']).toContain(result.value.customer.healthClassification);
      }
    });

    it('includes comparative metrics', () => {
      // Add multiple customers for comparison
      const customer1 = createTestCustomer({
        id: 'CUST-001',
        mrr: 1000,
        channels: ['Booking.com', 'Expedia'],
      });
      const customer2 = createTestCustomer({
        id: 'CUST-002',
        mrr: 3000,
        channels: ['Booking.com'],
      });
      mockRepository.setCustomer(customer1);
      mockRepository.setCustomer(customer2);

      const result = useCase.execute({ customerId: 'CUST-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.value.comparativeMetrics;
        expect(metrics).toBeDefined();
        expect(typeof metrics.healthScoreVsAverage).toBe('number');
        expect(typeof metrics.mrrVsAverage).toBe('number');
        expect(typeof metrics.channelCountVsAverage).toBe('number');
        expect(metrics.percentileRank).toBeGreaterThanOrEqual(0);
        expect(metrics.percentileRank).toBeLessThanOrEqual(100);
      }
    });

    it('includes timeline data', () => {
      const customer = createTestCustomer({
        id: 'CUST-001',
        createdDate: new Date('2023-01-01T00:00:00Z'),
        latestLogin: new Date('2024-01-10T10:00:00Z'),
      });
      mockRepository.setCustomer(customer);

      const result = useCase.execute({ customerId: 'CUST-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        const timeline = result.value.timeline;
        expect(timeline).toBeDefined();
        expect(timeline.createdDate).toBe('2023-01-01T00:00:00.000Z');
        expect(timeline.daysSinceCreation).toBeGreaterThan(0);
        expect(timeline.lastLoginDate).toBe('2024-01-10T10:00:00.000Z');
        expect(timeline.daysSinceLastLogin).toBeGreaterThan(0);
        expect(['new', 'established', 'veteran']).toContain(timeline.accountAgeCategory);
      }
    });

    it('categorizes account age correctly', () => {
      // New account (less than 30 days old)
      const newCustomer = createTestCustomer({
        id: 'NEW-001',
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        latestLogin: new Date(),
      });
      mockRepository.setCustomer(newCustomer);

      const newResult = useCase.execute({ customerId: 'NEW-001' });
      expect(newResult.success).toBe(true);
      if (newResult.success) {
        expect(newResult.value.timeline.accountAgeCategory).toBe('new');
      }

      // Veteran account (more than 365 days old)
      const veteranCustomer = createTestCustomer({
        id: 'VET-001',
        createdDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
        latestLogin: new Date(),
      });
      mockRepository.setCustomer(veteranCustomer);

      const vetResult = useCase.execute({ customerId: 'VET-001' });
      expect(vetResult.success).toBe(true);
      if (vetResult.success) {
        expect(vetResult.value.timeline.accountAgeCategory).toBe('veteran');
      }
    });
  });
});
