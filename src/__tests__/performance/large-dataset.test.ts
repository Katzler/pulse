/**
 * Performance tests for large dataset handling
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { HealthScoreCalculator } from '@domain/services';
import { InMemoryCustomerRepository } from '@infrastructure/repositories';
import { ImportCustomersUseCase, SearchCustomersUseCase } from '@application/use-cases';

import type { CustomerId, RawCustomerRecord } from '@shared/types';

// Test data generators
function generateTestCustomers(count: number): RawCustomerRecord[] {
  const countries = ['USA', 'Germany', 'France', 'UK', 'Spain', 'Italy', 'Canada', 'Australia'];
  const accountTypes = ['Pro', 'Starter'];
  const statuses = ['Active Customer', 'Inactive Customer'];
  const channels = ['Booking.com', 'Expedia', 'Airbnb', 'Direct', 'VRBO'];
  const propertyTypes = ['Hotels', 'B&B', 'Vacation Rentals', 'Hostels'];

  return Array.from({ length: count }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 180);
    const loginDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const createdDate = new Date(Date.now() - (365 + Math.random() * 365) * 24 * 60 * 60 * 1000);
    const csContactDaysAgo = Math.floor(Math.random() * 60);
    const csContactDate = new Date(Date.now() - csContactDaysAgo * 24 * 60 * 60 * 1000);

    return {
      'Sirvoy Customer ID': `PERF-${String(i).padStart(5, '0')}`,
      'Account Owner': `Test Hotel ${i}`,
      'Account Name': `Test Hotel Group ${i}`,
      'Latest Login':
        Math.random() > 0.1 ? loginDate.toLocaleDateString('en-GB') + ', 10:00' : '', // 10% never logged in
      'Created Date': createdDate.toLocaleDateString('en-GB'),
      'Last Customer Success Contact Date':
        Math.random() > 0.2 ? csContactDate.toLocaleDateString('en-GB') : '', // 20% no CS contact
      'Billing Country': countries[Math.floor(Math.random() * countries.length)],
      'Account Type': accountTypes[Math.floor(Math.random() * accountTypes.length)],
      Language: 'English',
      Status: statuses[Math.floor(Math.random() * statuses.length)],
      'Sirvoy Account Status': Math.random() > 0.5 ? 'Loyal' : 'New',
      'Property Type': propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      'MRR (converted) Currency': 'USD',
      'MRR (converted)': String(Math.floor(Math.random() * 5000) + 100),
      Channels: channels.slice(0, Math.floor(Math.random() * 4) + 1).join(', '),
    };
  });
}

// Map raw records to import format
function mapToImportFormat(
  records: RawCustomerRecord[]
): Array<{
  'Sirvoy Customer ID': string;
  'Account Owner': string;
  'Account Name': string;
  'Latest Login': string;
  'Created Date': string;
  'Last Customer Success Contact Date': string;
  'Billing Country': string;
  'Account Type': string;
  Languages: string;
  Status: string;
  'Account Status': string;
  'Property Type': string;
  MRR: string;
  Currency: string;
  Channels: string;
}> {
  return records.map((record) => ({
    'Sirvoy Customer ID': record['Sirvoy Customer ID'],
    'Account Owner': record['Account Owner'],
    'Account Name': record['Account Name'],
    'Latest Login': record['Latest Login'],
    'Created Date': record['Created Date'],
    'Last Customer Success Contact Date': record['Last Customer Success Contact Date'],
    'Billing Country': record['Billing Country'],
    'Account Type': record['Account Type'],
    Languages: record['Language'],
    Status: record['Status'],
    'Account Status': record['Sirvoy Account Status'],
    'Property Type': record['Property Type'],
    MRR: record['MRR (converted)'],
    Currency: record['MRR (converted) Currency'],
    Channels: record['Channels'],
  }));
}

describe('Large Dataset Performance', () => {
  let repository: InMemoryCustomerRepository;
  let healthScoreCalculator: HealthScoreCalculator;
  let importUseCase: ImportCustomersUseCase;
  let searchUseCase: SearchCustomersUseCase;

  beforeEach(() => {
    repository = new InMemoryCustomerRepository();
    healthScoreCalculator = new HealthScoreCalculator();
    repository.setHealthScoreCalculator(healthScoreCalculator);
    importUseCase = new ImportCustomersUseCase(repository, healthScoreCalculator);
    searchUseCase = new SearchCustomersUseCase(repository, healthScoreCalculator);
  });

  afterEach(() => {
    repository.clear();
  });

  describe('Import Performance', () => {
    it('should import 1,000 customers in under 2 seconds', () => {
      const customers = generateTestCustomers(1000);
      const records = mapToImportFormat(customers);

      const startTime = performance.now();
      const result = importUseCase.execute({ records });
      const importTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(1000);
      }
      expect(importTime).toBeLessThan(2000);

      console.log(`Import 1,000 customers: ${importTime.toFixed(2)}ms`);
    });

    it('should import 5,000 customers in under 5 seconds', () => {
      const customers = generateTestCustomers(5000);
      const records = mapToImportFormat(customers);

      const startTime = performance.now();
      const result = importUseCase.execute({ records });
      const importTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(5000);
      }
      expect(importTime).toBeLessThan(5000);

      console.log(`Import 5,000 customers: ${importTime.toFixed(2)}ms`);
    });

    it('should import 10,000 customers in under 10 seconds', () => {
      const customers = generateTestCustomers(10000);
      const records = mapToImportFormat(customers);

      const startTime = performance.now();
      const result = importUseCase.execute({ records });
      const importTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(10000);
      }
      expect(importTime).toBeLessThan(10000);

      console.log(`Import 10,000 customers: ${importTime.toFixed(2)}ms`);
    });
  });

  describe('Search Performance', () => {
    beforeEach(() => {
      // Import 5,000 customers for search tests
      const customers = generateTestCustomers(5000);
      const records = mapToImportFormat(customers);
      importUseCase.execute({ records });
    });

    it('should search 5,000 customers in under 500ms', () => {
      const startTime = performance.now();
      const result = searchUseCase.execute({
        query: 'Hotel',
        page: 1,
        pageSize: 20,
      });
      const searchTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(searchTime).toBeLessThan(500);

      console.log(`Search 5,000 customers: ${searchTime.toFixed(2)}ms`);
    });

    it('should filter by health status in under 500ms', () => {
      const startTime = performance.now();
      const result = searchUseCase.execute({
        healthStatus: 'healthy',
        page: 1,
        pageSize: 20,
      });
      const searchTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(searchTime).toBeLessThan(500);

      console.log(`Filter by health: ${searchTime.toFixed(2)}ms`);
    });

    it('should filter by country in under 500ms', () => {
      const startTime = performance.now();
      const result = searchUseCase.execute({
        country: 'USA',
        page: 1,
        pageSize: 20,
      });
      const searchTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(searchTime).toBeLessThan(500);

      console.log(`Filter by country: ${searchTime.toFixed(2)}ms`);
    });

    it('should sort customers in under 500ms', () => {
      const startTime = performance.now();
      const result = searchUseCase.execute({
        sortBy: 'healthScore',
        sortOrder: 'asc',
        page: 1,
        pageSize: 20,
      });
      const searchTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(searchTime).toBeLessThan(500);

      console.log(`Sort customers: ${searchTime.toFixed(2)}ms`);
    });

    it('should paginate through results in under 100ms per page', () => {
      const times: number[] = [];

      for (let page = 1; page <= 10; page++) {
        const startTime = performance.now();
        const result = searchUseCase.execute({
          page,
          pageSize: 20,
        });
        const pageTime = performance.now() - startTime;

        expect(result.success).toBe(true);
        expect(pageTime).toBeLessThan(100);
        times.push(pageTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Average pagination time: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Health Score Calculation Performance', () => {
    it('should calculate health scores for 1,000 customers in under 500ms', () => {
      const customers = generateTestCustomers(1000);
      const records = mapToImportFormat(customers);
      importUseCase.execute({ records });

      const allCustomers = repository.getAll();

      const startTime = performance.now();
      for (const customer of allCustomers) {
        healthScoreCalculator.calculate(customer);
      }
      const calcTime = performance.now() - startTime;

      expect(calcTime).toBeLessThan(500);

      console.log(`Calculate 1,000 health scores: ${calcTime.toFixed(2)}ms`);
    });
  });

  describe('Repository Operations Performance', () => {
    beforeEach(() => {
      const customers = generateTestCustomers(5000);
      const records = mapToImportFormat(customers);
      importUseCase.execute({ records });
    });

    it('should get customer by ID in under 5ms', () => {
      const times: number[] = [];

      for (let i = 0; i < 100; i++) {
        // CustomerId is a branded string type - we can cast a string to it
        const id = `PERF-${String(Math.floor(Math.random() * 5000)).padStart(5, '0')}` as CustomerId;

        const startTime = performance.now();
        repository.getById(id);
        const lookupTime = performance.now() - startTime;

        times.push(lookupTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(maxTime).toBeLessThan(5);

      console.log(`Average lookup time: ${avgTime.toFixed(3)}ms, max: ${maxTime.toFixed(3)}ms`);
    });

    it('should get all customers in under 50ms', () => {
      const startTime = performance.now();
      const customers = repository.getAll();
      const getTime = performance.now() - startTime;

      expect(customers.length).toBe(5000);
      expect(getTime).toBeLessThan(50);

      console.log(`Get all 5,000 customers: ${getTime.toFixed(2)}ms`);
    });

    it('should get statistics in under 500ms', () => {
      const startTime = performance.now();
      const stats = repository.getStatistics();
      const statsTime = performance.now() - startTime;

      expect(stats).toBeDefined();
      expect(statsTime).toBeLessThan(500);

      console.log(`Get statistics: ${statsTime.toFixed(2)}ms`);
    });
  });
});
