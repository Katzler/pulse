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
    accountName: 'Smith Hotels',
    latestLogin: now,
    createdDate: new Date('2023-01-01T00:00:00Z'),
    lastCsContactDate: new Date('2024-01-10'),
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

describe('SearchCustomersUseCase', async () => {
  let useCase: SearchCustomersUseCase;
  let mockRepository: MockCustomerReadRepository;
  let healthScoreCalculator: HealthScoreCalculator;

  beforeEach(() => {
    mockRepository = new MockCustomerReadRepository();
    healthScoreCalculator = new HealthScoreCalculator();
    useCase = new SearchCustomersUseCase(mockRepository, healthScoreCalculator);
  });

  describe('execute', async () => {
    it('returns all customers when no filters provided', async () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountOwner: 'John' }),
        createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane' }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(2);
        expect(result.value.totalCount).toBe(2);
        expect(result.value.page).toBe(1);
        expect(result.value.totalPages).toBe(1);
      }
    });

    it('filters by search query', async () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountOwner: 'John Smith' }),
        createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane Doe' }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ query: 'john' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
        expect(result.value.customers[0].accountOwner).toBe('John Smith');
      }
    });

    it('filters by country', async () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', billingCountry: 'Sweden' }),
        createTestCustomer({ id: 'CUST-002', billingCountry: 'Norway' }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ country: 'Sweden' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
      }
    });

    it('filters by active status', async () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', status: CustomerStatus.Active }),
        createTestCustomer({ id: 'CUST-002', status: CustomerStatus.Inactive }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ status: 'active' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
      }
    });

    it('filters by account type', async () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountType: AccountType.Pro }),
        createTestCustomer({ id: 'CUST-002', accountType: AccountType.Starter }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ accountType: 'Pro' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
      }
    });

    it('applies pagination', async () => {
      const customers = Array.from({ length: 25 }, (_, i) =>
        createTestCustomer({ id: `CUST-${String(i + 1).padStart(3, '0')}` })
      );
      mockRepository.setCustomers(customers);

      // Default page size is 20, request page 1
      const result = await useCase.execute({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(10);
        expect(result.value.totalCount).toBe(25);
        expect(result.value.page).toBe(1);
        expect(result.value.pageSize).toBe(10);
        expect(result.value.totalPages).toBe(3);
      }
    });

    it('returns correct page when requesting later pages', async () => {
      const customers = Array.from({ length: 25 }, (_, i) =>
        createTestCustomer({ id: `CUST-${String(i + 1).padStart(3, '0')}` })
      );
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ page: 3, pageSize: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(5); // Last page has 5 items
        expect(result.value.page).toBe(3);
        expect(result.value.totalPages).toBe(3);
      }
    });

    it('returns empty array when no matches', async () => {
      mockRepository.setCustomers([]);

      const result = await useCase.execute({ query: 'nonexistent' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(0);
        expect(result.value.totalCount).toBe(0);
        expect(result.value.totalPages).toBe(0);
      }
    });

    it('includes health score in results', async () => {
      const customers = [createTestCustomer({ id: 'CUST-001' })];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers[0].healthScore).toBeGreaterThanOrEqual(0);
        expect(result.value.customers[0].healthScore).toBeLessThanOrEqual(100);
      }
    });

    it('filters by exact customer ID', async () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountOwner: 'John' }),
        createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane' }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ customerId: 'CUST-001' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers).toHaveLength(1);
        expect(result.value.customers[0].id).toBe('CUST-001');
      }
    });

    it('sorts by MRR descending', async () => {
      const customers = [
        createTestCustomer({ id: 'LOW-MRR', mrr: 100 }),
        createTestCustomer({ id: 'HIGH-MRR', mrr: 5000 }),
        createTestCustomer({ id: 'MED-MRR', mrr: 1000 }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ sortBy: 'mrr', sortOrder: 'desc' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers[0].id).toBe('HIGH-MRR');
        expect(result.value.customers[1].id).toBe('MED-MRR');
        expect(result.value.customers[2].id).toBe('LOW-MRR');
      }
    });

    it('sorts by name ascending', async () => {
      const customers = [
        createTestCustomer({ id: 'C1', accountOwner: 'Zack' }),
        createTestCustomer({ id: 'C2', accountOwner: 'Alice' }),
        createTestCustomer({ id: 'C3', accountOwner: 'Mike' }),
      ];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ sortBy: 'name', sortOrder: 'asc' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.customers[0].accountOwner).toBe('Alice');
        expect(result.value.customers[1].accountOwner).toBe('Mike');
        expect(result.value.customers[2].accountOwner).toBe('Zack');
      }
    });

    it('returns applied filters list', async () => {
      const customers = [createTestCustomer({ id: 'CUST-001', billingCountry: 'Sweden' })];
      mockRepository.setCustomers(customers);

      const result = await useCase.execute({ country: 'Sweden', status: 'active' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.appliedFilters).toContainEqual({ field: 'country', value: 'Sweden' });
        expect(result.value.appliedFilters).toContainEqual({ field: 'status', value: 'active' });
      }
    });

    it('filters by health status', async () => {
      // Create customers with different health levels
      const healthyCustomer = createTestCustomer({
        id: 'HEALTHY-001',
        status: CustomerStatus.Active,
        latestLogin: new Date(),
        channels: ['Booking.com', 'Expedia', 'Airbnb'],
        accountType: AccountType.Pro,
        mrr: 5000,
      });
      const atRiskCustomer = createTestCustomer({
        id: 'ATRISK-001',
        status: CustomerStatus.Inactive,
        latestLogin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        channels: ['Booking.com'],
        accountType: AccountType.Starter,
        mrr: 100,
      });
      mockRepository.setCustomers([healthyCustomer, atRiskCustomer]);

      const result = await useCase.execute({ healthStatus: 'healthy' });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only return the healthy customer
        expect(result.value.customers.length).toBeGreaterThanOrEqual(1);
        for (const customer of result.value.customers) {
          expect(customer.healthClassification).toBe('healthy');
        }
      }
    });
  });
});
