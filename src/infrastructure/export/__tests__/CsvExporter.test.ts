import { describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import { HealthScore } from '@domain/value-objects';
import { AccountType, CustomerStatus } from '@shared/types';

import { CsvExporter } from '../CsvExporter';

function createTestCustomer(overrides: Partial<CustomerProps> = {}): Customer {
  const defaults: CustomerProps = {
    id: 'CUST-001',
    accountOwner: 'John Smith',
    accountName: 'Smith Hotels',
    latestLogin: new Date('2024-01-15T10:30:00Z'),
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

describe('CsvExporter', () => {
  const exporter = new CsvExporter();

  describe('exportCustomers', () => {
    it('exports a single customer to CSV', () => {
      const customers = [createTestCustomer()];

      const csv = exporter.exportCustomers(customers);

      expect(csv).toContain('Sirvoy Customer ID');
      expect(csv).toContain('CUST-001');
      expect(csv).toContain('John Smith');
    });

    it('exports multiple customers', () => {
      const customers = [
        createTestCustomer({ id: 'CUST-001', accountOwner: 'John' }),
        createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane' }),
      ];

      const csv = exporter.exportCustomers(customers);

      expect(csv).toContain('CUST-001');
      expect(csv).toContain('CUST-002');
      expect(csv).toContain('John');
      expect(csv).toContain('Jane');
    });

    it('includes header row by default', () => {
      const customers = [createTestCustomer()];

      const csv = exporter.exportCustomers(customers);
      const lines = csv.split('\n');

      expect(lines[0]).toContain('Sirvoy Customer ID');
      expect(lines[0]).toContain('Account Owner');
    });

    it('can exclude header row', () => {
      const customers = [createTestCustomer()];

      const csv = exporter.exportCustomers(customers, undefined, { includeHeaders: false });
      const lines = csv.split('\n');

      // First line should be data, not headers
      expect(lines[0]).toContain('CUST-001');
      expect(lines[0]).not.toContain('Sirvoy Customer ID');
    });

    it('formats dates correctly', () => {
      const customers = [
        createTestCustomer({
          createdDate: new Date('2023-06-15T00:00:00Z'),
          latestLogin: new Date('2024-02-20T14:45:00Z'),
        }),
      ];

      const csv = exporter.exportCustomers(customers);

      expect(csv).toContain('15/06/2023');
      expect(csv).toContain('20/02/2024');
    });

    it('formats semicolon-separated lists', () => {
      const customers = [
        createTestCustomer({
          languages: ['English', 'Swedish', 'Norwegian'],
          channels: ['Booking.com', 'Expedia', 'Airbnb'],
        }),
      ];

      const csv = exporter.exportCustomers(customers);

      expect(csv).toContain('English; Swedish; Norwegian');
      expect(csv).toContain('Booking.com; Expedia; Airbnb');
    });

    it('escapes fields containing commas', () => {
      const customers = [createTestCustomer({ accountOwner: 'Smith, John' })];

      const csv = exporter.exportCustomers(customers);

      // Field with comma should be quoted
      expect(csv).toContain('"Smith, John"');
    });

    it('escapes fields containing quotes', () => {
      const customers = [createTestCustomer({ accountOwner: 'John "The Boss" Smith' })];

      const csv = exporter.exportCustomers(customers);

      // Quotes should be doubled
      expect(csv).toContain('John ""The Boss"" Smith');
    });

    it('includes health scores when provided', () => {
      const customers = [createTestCustomer({ id: 'CUST-001' })];
      const healthScore85 = HealthScore.create(85);
      if (!healthScore85.success) throw new Error('Failed to create health score');
      const healthScores = new Map([['CUST-001', healthScore85.value]]);

      const csv = exporter.exportCustomers(customers, healthScores, { includeHealthScore: true });

      expect(csv).toContain('Health Score');
      expect(csv).toContain('85');
      expect(csv).toContain('Healthy');
    });

    it('shows correct health status', () => {
      const customers = [
        createTestCustomer({ id: 'HEALTHY' }),
        createTestCustomer({ id: 'AT-RISK' }),
        createTestCustomer({ id: 'CRITICAL' }),
      ];
      const hs85 = HealthScore.create(85);
      const hs50 = HealthScore.create(50);
      const hs20 = HealthScore.create(20);
      if (!hs85.success || !hs50.success || !hs20.success) throw new Error('Failed to create health scores');
      const healthScores = new Map([
        ['HEALTHY', hs85.value],
        ['AT-RISK', hs50.value],
        ['CRITICAL', hs20.value],
      ]);

      const csv = exporter.exportCustomers(customers, healthScores);

      expect(csv).toContain('Healthy');
      expect(csv).toContain('At Risk');
      expect(csv).toContain('Critical');
    });

    it('can export specific columns only', () => {
      const customers = [createTestCustomer()];

      const csv = exporter.exportCustomers(customers, undefined, {
        columns: ['Sirvoy Customer ID', 'Account Owner', 'MRR (converted)'],
      });

      expect(csv).toContain('Sirvoy Customer ID');
      expect(csv).toContain('Account Owner');
      expect(csv).toContain('MRR (converted)');
      expect(csv).not.toContain('Billing Country');
    });

    it('can use custom delimiter', () => {
      const customers = [createTestCustomer()];

      const csv = exporter.exportCustomers(customers, undefined, { delimiter: ';' });

      // Split by semicolon should give us the columns
      const headerLine = csv.split('\n')[0];
      expect(headerLine.split(';').length).toBeGreaterThan(5);
    });
  });

  describe('generateFilename', () => {
    it('generates filename with current date', () => {
      const filename = exporter.generateFilename();

      expect(filename).toMatch(/^customers-export-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('uses custom prefix', () => {
      const filename = exporter.generateFilename('filtered-customers');

      expect(filename).toMatch(/^filtered-customers-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });
});
