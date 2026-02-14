import { beforeEach, describe, expect, it } from 'vitest';

import { type Customer } from '@domain/entities';
import { type CustomerWriteRepository, type ImportSummary } from '@domain/repositories';
import { HealthScoreCalculator } from '@domain/services';
import { type DuplicateCustomerError, type ImportError } from '@domain/types/errors';
import {
  ImportCustomersUseCase,
  type RawCsvRecord,
} from '@application/use-cases/ImportCustomersUseCase';
import { type Result } from '@shared/types';

function createTestRecord(overrides: Partial<RawCsvRecord> = {}): RawCsvRecord {
  return {
    'Sirvoy Customer ID': 'CUST-001',
    'Account Owner': 'John Smith',
    'Account Name': 'Smith Hotels',
    'Latest Login': '15/01/2024, 10:00',
    'Created Date': '01/01/2023',
    'Last Customer Success Contact Date': '10/01/2024',
    'Billing Country': 'Sweden',
    'Account Type': 'Pro',
    Languages: 'English;Swedish',
    Status: 'Active Customer',
    'Account Status': 'Loyal',
    'Property Type': 'Hotels',
    MRR: '1500',
    Currency: 'SEK',
    Channels: 'Booking.com;Expedia',
    ...overrides,
  };
}

class MockCustomerWriteRepository implements CustomerWriteRepository {
  private customers: Map<string, Customer> = new Map();
  private shouldFail = false;

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  getStoredCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  add(customer: Customer): Result<void, DuplicateCustomerError> {
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

  addMany(customers: Customer[]): Result<ImportSummary, ImportError> {
    if (this.shouldFail) {
      return {
        success: false,
        error: {
          type: 'IMPORT_ERROR',
          message: 'Import failed',
          details: { errors: [], totalRows: customers.length, failedRows: customers.length },
        },
      };
    }

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

  clear(): void {
    this.customers.clear();
  }
}

describe('ImportCustomersUseCase', async () => {
  let useCase: ImportCustomersUseCase;
  let mockRepository: MockCustomerWriteRepository;
  let healthScoreCalculator: HealthScoreCalculator;

  beforeEach(() => {
    mockRepository = new MockCustomerWriteRepository();
    healthScoreCalculator = new HealthScoreCalculator();
    useCase = new ImportCustomersUseCase(mockRepository, healthScoreCalculator);
  });

  describe('execute', async () => {
    it('successfully imports valid records', async () => {
      const records = [
        createTestRecord({ 'Sirvoy Customer ID': 'CUST-001' }),
        createTestRecord({ 'Sirvoy Customer ID': 'CUST-002', 'Account Owner': 'Jane Doe' }),
      ];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(2);
        expect(result.value.errorCount).toBe(0);
        expect(result.value.totalRows).toBe(2);
      }
    });

    it('reports validation errors for missing required fields', async () => {
      const records = [
        createTestRecord({ 'Sirvoy Customer ID': '' }),
        createTestRecord({ 'Account Owner': '' }),
        createTestRecord({ Status: '' }),
        createTestRecord({ 'Account Type': '' }),
      ];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.errorCount).toBe(4);
        expect(result.value.errors).toHaveLength(4);
      }
    });

    it('reports row number in errors (1-based, accounting for header)', async () => {
      const records = [
        createTestRecord({ 'Sirvoy Customer ID': '' }), // Row 2 (after header)
        createTestRecord({ 'Sirvoy Customer ID': 'VALID' }),
        createTestRecord({ 'Account Owner': '' }), // Row 4
      ];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const errorRows = result.value.errors.map((e) => e.row);
        expect(errorRows).toContain(2);
        expect(errorRows).toContain(4);
      }
    });

    it('parses DD/MM/YYYY date format', async () => {
      const records = [createTestRecord({ 'Created Date': '25/12/2023' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(1);
      }
    });

    it('parses DD/MM/YYYY, HH:mm datetime format', async () => {
      const records = [createTestRecord({ 'Latest Login': '25/12/2023, 14:30' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(1);
      }
    });

    it('reports error for invalid date format', async () => {
      const records = [createTestRecord({ 'Latest Login': 'invalid-date' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.errorCount).toBe(1);
        expect(result.value.errors[0].message).toContain('date');
      }
    });

    it('parses semicolon-separated languages', async () => {
      const records = [createTestRecord({ Languages: 'English;Swedish;Norwegian' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(1);
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].languages).toEqual(['English', 'Swedish', 'Norwegian']);
      }
    });

    it('parses semicolon-separated channels', async () => {
      const records = [createTestRecord({ Channels: 'Booking.com;Expedia;Airbnb' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].channels).toEqual(['Booking.com', 'Expedia', 'Airbnb']);
      }
    });

    it('parses MRR value', async () => {
      const records = [createTestRecord({ MRR: '2500.50' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].mrr).toBe(2500.5);
      }
    });

    it('handles MRR with currency symbols', async () => {
      const records = [createTestRecord({ MRR: '$1,500.00' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].mrr).toBe(1500);
      }
    });

    it('defaults empty MRR to 0', async () => {
      const records = [createTestRecord({ MRR: '' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].mrr).toBe(0);
      }
    });

    it('maps Pro account type', async () => {
      const records = [createTestRecord({ 'Account Type': 'Pro' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].accountType).toBe('Pro');
      }
    });

    it('maps Starter account type', async () => {
      const records = [createTestRecord({ 'Account Type': 'Starter' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].accountType).toBe('Starter');
      }
    });

    it('maps active status', async () => {
      const records = [createTestRecord({ Status: 'Active Customer' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].isActive()).toBe(true);
      }
    });

    it('maps inactive status', async () => {
      const records = [createTestRecord({ Status: 'Inactive Customer' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].isActive()).toBe(false);
      }
    });

    it('calculates health scores for imported customers', async () => {
      const records = [createTestRecord({ 'Sirvoy Customer ID': 'CUST-001' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.healthScores.has('CUST-001')).toBe(true);
        const score = result.value.healthScores.get('CUST-001');
        expect(score?.value).toBeGreaterThanOrEqual(0);
        expect(score?.value).toBeLessThanOrEqual(100);
      }
    });

    it('handles repository failure gracefully', async () => {
      mockRepository.setShouldFail(true);
      const records = [createTestRecord()];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(0);
      }
    });

    it('continues processing after individual record errors', async () => {
      const records = [
        createTestRecord({ 'Sirvoy Customer ID': '' }), // Invalid
        createTestRecord({ 'Sirvoy Customer ID': 'VALID-001' }), // Valid
        createTestRecord({ 'Latest Login': 'bad-date' }), // Invalid
        createTestRecord({ 'Sirvoy Customer ID': 'VALID-002' }), // Valid
      ];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(2);
        expect(result.value.errorCount).toBe(2);
      }
    });

    it('returns empty result for empty input', async () => {
      const result = await useCase.execute({ records: [] });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.totalRows).toBe(0);
        expect(result.value.importedCount).toBe(0);
        expect(result.value.errorCount).toBe(0);
      }
    });

    it('handles empty Latest Login (customer never logged in)', async () => {
      const records = [createTestRecord({ 'Latest Login': '' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(1);
        expect(result.value.errorCount).toBe(0);
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].latestLogin).toBeNull();
        expect(stored[0].hasLoggedIn()).toBe(false);
      }
    });

    it('handles whitespace-only Latest Login as empty', async () => {
      const records = [createTestRecord({ 'Latest Login': '   ' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.importedCount).toBe(1);
        expect(result.value.errorCount).toBe(0);
        const stored = mockRepository.getStoredCustomers();
        expect(stored[0].latestLogin).toBeNull();
      }
    });

    it('calculates health score with 0 login recency points for null latestLogin', async () => {
      const records = [createTestRecord({ 'Latest Login': '' })];

      const result = await useCase.execute({ records });

      expect(result.success).toBe(true);
      if (result.success) {
        const score = result.value.healthScores.get('CUST-001');
        expect(score).toBeDefined();
        // Score should not include login recency points (25 max)
        // Active (30) + Account Type Pro (15) + MRR $1500 (8) + 2 channels (8) = 61
        expect(score?.value).toBeLessThanOrEqual(61);
      }
    });
  });
});
