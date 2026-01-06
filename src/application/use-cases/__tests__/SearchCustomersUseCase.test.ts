import { beforeEach, describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import { type CustomerReadRepository, type SearchCriteria } from '@domain/repositories';
import { HealthScoreCalculator } from '@domain/services';
import { type CustomerNotFoundError } from '@domain/types/errors';
import { SearchCustomersUseCase } from '@application/use-cases/SearchCustomersUseCase';
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
      error: { type: 'CUSTOMER_NOT_FOUND', message: `Customer not found: ${id}`, details: { customerId: id } },
    };
  }

  search(criteria: SearchCriteria): Customer[] {
    let result = this.customers;

    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(query) || c.accountOwner.toLowerCase().includes(query)
      );
    }

    if (criteria.country) {
      result = result.filter((c) => c.billingCountry === criteria.country);
    }

    if (criteria.status) {
      result = result.filter((c) =>
        criteria.status === 'Active Customer' ? c.isActive() : !c.isActive()
      );
    }

    if (criteria.accountType) {
      result = result.filter((c) => c.accountType === criteria.accountType);
    }

    return result;
  }

  count(): number {
    return this.customers.length;
  }
}

describe('SearchCustomersUseCase', () => {
  let useCase: SearchCustomersUseCase;
  let mockRepository: MockCustomerReadRepository;
  let healthScoreCalculator: HealthScoreCalculator;

  beforeEach(() => {
    mockRepository = new MockCustomerReadRepository();
    healthScoreCalculator = new HealthScoreCalculator();
    useCase = new SearchCustomersUseCase(mockRepository, healthScoreCalculator);
  });

  describe('execute', () => {
    it('returns all customers when no filters provided', () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountOwner: 'John' }),
        createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane' }),
      ];
      mockRepository.setCustomers(customers);

      const result = useCase.execute({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(2);
        expect(result.value.total).toBe(2);
        expect(result.value.hasMore).toBe(false);
      }
    });

    it('filters by search query', () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountOwner: 'John Smith' }),
        createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane Doe' }),
      ];
      mockRepository.setCustomers(customers);

      const result = useCase.execute({ query: 'john' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
        expect(result.value.customers[0].accountOwner).toBe('John Smith');
      }
    });

    it('filters by country', () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', billingCountry: 'Sweden' }),
        createTestCustomer({ id: 'CUST-002', billingCountry: 'Norway' }),
      ];
      mockRepository.setCustomers(customers);

      const result = useCase.execute({ country: 'Sweden' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
      }
    });

    it('filters by active status', () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', status: CustomerStatus.Active }),
        createTestCustomer({ id: 'CUST-002', status: CustomerStatus.Inactive }),
      ];
      mockRepository.setCustomers(customers);

      const result = useCase.execute({ status: 'active' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
      }
    });

    it('filters by account type', () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountType: AccountType.Pro }),
        createTestCustomer({ id: 'CUST-002', accountType: AccountType.Starter }),
      ];
      mockRepository.setCustomers(customers);

      const result = useCase.execute({ accountType: 'Pro' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
      }
    });

    it('applies pagination', () => {
      const customers = Array.from({ length: 10 }, (_, i) =>
        createTestCustomer({ id: `CUST-${String(i + 1).padStart(3, '0')}` })
      );
      mockRepository.setCustomers(customers);

      const result = useCase.execute({ limit: 3, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(3);
        expect(result.value.total).toBe(10);
        expect(result.value.hasMore).toBe(true);
      }
    });

    it('indicates no more results when at end', () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001' }),
        createTestCustomer({ id: 'CUST-002' }),
      ];
      mockRepository.setCustomers(customers);

      const result = useCase.execute({ limit: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasMore).toBe(false);
      }
    });

    it('returns empty array when no matches', () => {
      mockRepository.setCustomers([]);

      const result = useCase.execute({ query: 'nonexistent' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(0);
        expect(result.value.total).toBe(0);
      }
    });

    it('includes health score in results', () => {
      const customers = [createTestCustomer({ id: 'CUST-001' })];
      mockRepository.setCustomers(customers);

      const result = useCase.execute({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers[0].healthScore).toBeGreaterThanOrEqual(0);
        expect(result.value.customers[0].healthScore).toBeLessThanOrEqual(100);
      }
    });
  });
});
