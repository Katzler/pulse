import { beforeEach, describe, expect, it } from 'vitest';

import type { CustomerSummaryDTO } from '@application/dtos';
import {
  CustomerQueryService,
  type CustomerFilterCriteria,
  type CustomerSortConfig,
  type PaginationConfig,
} from '../CustomerQueryService';

function createMockCustomer(overrides: Partial<CustomerSummaryDTO> = {}): CustomerSummaryDTO {
  return {
    id: 'CUST-001',
    accountOwner: 'Hotel Grand Plaza',
    accountName: 'Grand Plaza Hotels Inc',
    latestLogin: '2024-01-15T10:00:00Z',
    lastCsContactDate: '2024-01-10T14:00:00Z',
    billingCountry: 'Germany',
    accountType: 'Pro',
    status: 'Active Customer',
    mrr: 2500,
    channelCount: 3,
    healthScore: 75,
    healthClassification: 'healthy',
    ...overrides,
  };
}

describe('CustomerQueryService', () => {
  let service: CustomerQueryService;
  let testCustomers: CustomerSummaryDTO[];

  beforeEach(() => {
    service = new CustomerQueryService();
    testCustomers = [
      createMockCustomer({ id: 'CUST-001', accountOwner: 'Hotel Grand Plaza', billingCountry: 'Germany', healthScore: 85, healthClassification: 'healthy', mrr: 2500 }),
      createMockCustomer({ id: 'CUST-002', accountOwner: 'Beach Resort', billingCountry: 'Spain', healthScore: 45, healthClassification: 'at-risk', mrr: 1500 }),
      createMockCustomer({ id: 'CUST-003', accountOwner: 'Mountain Lodge', billingCountry: 'Germany', healthScore: 20, healthClassification: 'critical', mrr: 500 }),
      createMockCustomer({ id: 'CUST-004', accountOwner: 'City Hotel', billingCountry: 'France', healthScore: 72, healthClassification: 'healthy', mrr: 3000, status: 'Inactive Customer' }),
      createMockCustomer({ id: 'CUST-005', accountOwner: 'Ocean View Inn', billingCountry: 'Spain', healthScore: 90, healthClassification: 'healthy', mrr: 4000 }),
    ];
  });

  describe('query', () => {
    it('returns all customers when no filters provided', () => {
      const result = service.query(testCustomers);

      expect(result.items).toHaveLength(5);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(1);
    });

    it('applies filters, sort, and pagination together', () => {
      const result = service.query(testCustomers, {
        filters: { healthClassification: 'healthy' },
        sort: { key: 'mrr', order: 'desc' },
        pagination: { page: 1, pageSize: 2 },
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalItems).toBe(3); // 3 healthy customers
      expect(result.totalPages).toBe(2);
      expect(result.items[0].mrr).toBeGreaterThanOrEqual(result.items[1].mrr);
    });
  });

  describe('applyFilters', () => {
    it('returns all customers when no filters set', () => {
      const result = service.applyFilters(testCustomers, {});

      expect(result).toHaveLength(5);
    });

    it('applies multiple filters together', () => {
      const filters: CustomerFilterCriteria = {
        healthClassification: 'healthy',
        country: 'Germany',
      };

      const result = service.applyFilters(testCustomers, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('CUST-001');
    });
  });

  describe('filterBySearchQuery', () => {
    it('returns all customers when query is empty', () => {
      const result = service.filterBySearchQuery(testCustomers, '');

      expect(result).toHaveLength(5);
    });

    it('returns all customers when query is whitespace', () => {
      const result = service.filterBySearchQuery(testCustomers, '   ');

      expect(result).toHaveLength(5);
    });

    it('filters by customer ID (case insensitive)', () => {
      const result = service.filterBySearchQuery(testCustomers, 'cust-001');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('CUST-001');
    });

    it('filters by account owner name (case insensitive)', () => {
      const result = service.filterBySearchQuery(testCustomers, 'hotel');

      expect(result).toHaveLength(2); // Hotel Grand Plaza and City Hotel
    });

    it('filters by billing country (case insensitive)', () => {
      const result = service.filterBySearchQuery(testCustomers, 'spain');

      expect(result).toHaveLength(2);
    });

    it('matches partial strings', () => {
      const result = service.filterBySearchQuery(testCustomers, 'grand');

      expect(result).toHaveLength(1);
      expect(result[0].accountOwner).toBe('Hotel Grand Plaza');
    });
  });

  describe('filterByHealthClassification', () => {
    it('filters healthy customers', () => {
      const result = service.filterByHealthClassification(testCustomers, 'healthy');

      expect(result).toHaveLength(3);
      result.forEach((c) => expect(c.healthClassification).toBe('healthy'));
    });

    it('filters at-risk customers', () => {
      const result = service.filterByHealthClassification(testCustomers, 'at-risk');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('CUST-002');
    });

    it('filters critical customers', () => {
      const result = service.filterByHealthClassification(testCustomers, 'critical');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('CUST-003');
    });
  });

  describe('filterByCountry', () => {
    it('filters by exact country match', () => {
      const result = service.filterByCountry(testCustomers, 'Germany');

      expect(result).toHaveLength(2);
      result.forEach((c) => expect(c.billingCountry).toBe('Germany'));
    });

    it('returns empty array when no matches', () => {
      const result = service.filterByCountry(testCustomers, 'Italy');

      expect(result).toHaveLength(0);
    });
  });

  describe('filterByStatus', () => {
    it('filters active customers', () => {
      const result = service.filterByStatus(testCustomers, 'Active Customer');

      expect(result).toHaveLength(4);
      result.forEach((c) => expect(c.status).toBe('Active Customer'));
    });

    it('filters inactive customers', () => {
      const result = service.filterByStatus(testCustomers, 'Inactive Customer');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('CUST-004');
    });
  });

  describe('filterByAccountType', () => {
    it('filters by account type', () => {
      const customersWithTypes = [
        createMockCustomer({ id: 'CUST-001', accountType: 'Pro' }),
        createMockCustomer({ id: 'CUST-002', accountType: 'Starter' }),
        createMockCustomer({ id: 'CUST-003', accountType: 'Pro' }),
      ];

      const result = service.filterByAccountType(customersWithTypes, 'Pro');

      expect(result).toHaveLength(2);
      result.forEach((c) => expect(c.accountType).toBe('Pro'));
    });
  });

  describe('applySort', () => {
    it('sorts by health score ascending', () => {
      const sort: CustomerSortConfig = { key: 'healthScore', order: 'asc' };

      const result = service.applySort(testCustomers, sort);

      expect(result[0].healthScore).toBe(20);
      expect(result[result.length - 1].healthScore).toBe(90);
    });

    it('sorts by health score descending', () => {
      const sort: CustomerSortConfig = { key: 'healthScore', order: 'desc' };

      const result = service.applySort(testCustomers, sort);

      expect(result[0].healthScore).toBe(90);
      expect(result[result.length - 1].healthScore).toBe(20);
    });

    it('sorts by MRR descending', () => {
      const sort: CustomerSortConfig = { key: 'mrr', order: 'desc' };

      const result = service.applySort(testCustomers, sort);

      expect(result[0].mrr).toBe(4000);
      expect(result[result.length - 1].mrr).toBe(500);
    });

    it('sorts by account owner alphabetically', () => {
      const sort: CustomerSortConfig = { key: 'accountOwner', order: 'asc' };

      const result = service.applySort(testCustomers, sort);

      expect(result[0].accountOwner).toBe('Beach Resort');
      expect(result[result.length - 1].accountOwner).toBe('Ocean View Inn');
    });

    it('sorts by ID', () => {
      const sort: CustomerSortConfig = { key: 'id', order: 'asc' };

      const result = service.applySort(testCustomers, sort);

      expect(result[0].id).toBe('CUST-001');
      expect(result[result.length - 1].id).toBe('CUST-005');
    });

    it('does not mutate the original array', () => {
      const original = [...testCustomers];
      const sort: CustomerSortConfig = { key: 'mrr', order: 'desc' };

      service.applySort(testCustomers, sort);

      expect(testCustomers).toEqual(original);
    });
  });

  describe('applyPagination', () => {
    it('returns first page correctly', () => {
      const pagination: PaginationConfig = { page: 1, pageSize: 2 };

      const result = service.applyPagination(testCustomers, pagination);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('CUST-001');
      expect(result[1].id).toBe('CUST-002');
    });

    it('returns second page correctly', () => {
      const pagination: PaginationConfig = { page: 2, pageSize: 2 };

      const result = service.applyPagination(testCustomers, pagination);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('CUST-003');
      expect(result[1].id).toBe('CUST-004');
    });

    it('returns partial page when at end', () => {
      const pagination: PaginationConfig = { page: 3, pageSize: 2 };

      const result = service.applyPagination(testCustomers, pagination);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('CUST-005');
    });

    it('returns empty array when page exceeds total', () => {
      const pagination: PaginationConfig = { page: 10, pageSize: 2 };

      const result = service.applyPagination(testCustomers, pagination);

      expect(result).toHaveLength(0);
    });
  });

  describe('getUniqueCountries', () => {
    it('returns sorted unique countries', () => {
      const result = service.getUniqueCountries(testCustomers);

      expect(result).toEqual(['France', 'Germany', 'Spain']);
    });

    it('returns empty array for empty input', () => {
      const result = service.getUniqueCountries([]);

      expect(result).toEqual([]);
    });
  });

  describe('getUniqueAccountTypes', () => {
    it('returns sorted unique account types', () => {
      const customersWithTypes = [
        createMockCustomer({ id: 'CUST-001', accountType: 'Pro' }),
        createMockCustomer({ id: 'CUST-002', accountType: 'Starter' }),
        createMockCustomer({ id: 'CUST-003', accountType: 'Pro' }),
        createMockCustomer({ id: 'CUST-004', accountType: 'Enterprise' }),
      ];

      const result = service.getUniqueAccountTypes(customersWithTypes);

      expect(result).toEqual(['Enterprise', 'Pro', 'Starter']);
    });
  });

  describe('countByHealthClassification', () => {
    it('counts customers by health classification', () => {
      const result = service.countByHealthClassification(testCustomers);

      expect(result).toEqual({
        healthy: 3,
        'at-risk': 1,
        critical: 1,
      });
    });

    it('returns empty object for empty input', () => {
      const result = service.countByHealthClassification([]);

      expect(result).toEqual({});
    });
  });

  describe('PaginatedResult', () => {
    it('calculates total pages correctly', () => {
      const result = service.query(testCustomers, {
        pagination: { page: 1, pageSize: 2 },
      });

      expect(result.totalPages).toBe(3); // 5 items / 2 per page = 3 pages
    });

    it('returns correct page size in result', () => {
      const result = service.query(testCustomers, {
        pagination: { page: 1, pageSize: 3 },
      });

      expect(result.pageSize).toBe(3);
    });

    it('defaults to page 1 and pageSize 20 when no pagination provided', () => {
      const result = service.query(testCustomers);

      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });
});
