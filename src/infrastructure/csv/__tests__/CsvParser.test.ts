import { describe, expect, it } from 'vitest';

import { CSV_HEADERS } from '@shared/types';

import { CsvParser } from '../CsvParser';

describe('CsvParser', () => {
  const parser = new CsvParser();

  // Helper to create valid CSV content
  const createCsvContent = (rows: string[][]): string => {
    const headerRow = CSV_HEADERS.map((h) => `"${h}"`).join(',');
    const dataRows = rows.map((row) => row.map((field) => `"${field}"`).join(','));
    return [headerRow, ...dataRows].join('\n');
  };

  // Helper to create a valid test row
  const createTestRow = (overrides: Partial<Record<string, string>> = {}): string[] => {
    const defaults: Record<string, string> = {
      'Account Owner': 'John Smith',
      'Latest Login': '15/01/2024, 10:00',
      'Created Date': '01/01/2023',
      'Billing Country': 'Sweden',
      'Account Type': 'Pro',
      Language: 'English; Swedish',
      Status: 'Active Customer',
      'Sirvoy Account Status': 'Loyal',
      'Sirvoy Customer ID': 'CUST-001',
      'Property Type': 'Hotels',
      'MRR (converted) Currency': 'SEK',
      'MRR (converted)': '1500.00',
      Channels: 'Booking.com; Expedia',
    };

    const merged = { ...defaults, ...overrides };
    return CSV_HEADERS.map((header) => merged[header] ?? '');
  };

  describe('parse', () => {
    it('parses valid CSV content', () => {
      const csv = createCsvContent([createTestRow()]);

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records).toHaveLength(1);
        expect(result.value.errors).toHaveLength(0);
        expect(result.value.totalRows).toBe(1);
        expect(result.value.successfulRows).toBe(1);
      }
    });

    it('parses multiple rows', () => {
      const csv = createCsvContent([
        createTestRow({ 'Sirvoy Customer ID': 'CUST-001' }),
        createTestRow({ 'Sirvoy Customer ID': 'CUST-002' }),
        createTestRow({ 'Sirvoy Customer ID': 'CUST-003' }),
      ]);

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records).toHaveLength(3);
        expect(result.value.records[0]['Sirvoy Customer ID']).toBe('CUST-001');
        expect(result.value.records[1]['Sirvoy Customer ID']).toBe('CUST-002');
        expect(result.value.records[2]['Sirvoy Customer ID']).toBe('CUST-003');
      }
    });

    it('correctly parses all fields', () => {
      const csv = createCsvContent([
        createTestRow({
          'Account Owner': 'Jane Doe',
          'Billing Country': 'Norway',
          'MRR (converted)': '2500.50',
          Language: 'English; Norwegian; Swedish',
          Channels: 'Booking.com; Expedia; Airbnb',
        }),
      ]);

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        const record = result.value.records[0];
        expect(record['Account Owner']).toBe('Jane Doe');
        expect(record['Billing Country']).toBe('Norway');
        expect(record['MRR (converted)']).toBe('2500.50');
        expect(record.Language).toBe('English; Norwegian; Swedish');
        expect(record.Channels).toBe('Booking.com; Expedia; Airbnb');
      }
    });

    it('handles quoted fields with commas', () => {
      const csv = `"Account Owner","Latest Login","Created Date","Billing Country","Account Type","Language","Status","Sirvoy Account Status","Sirvoy Customer ID","Property Type","MRR (converted) Currency","MRR (converted)","Channels"
"Smith, John","15/01/2024, 10:00","01/01/2023","Sweden","Pro","English","Active Customer","Loyal","CUST-001","Hotels","SEK","1500.00","Booking.com"`;

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records[0]['Account Owner']).toBe('Smith, John');
      }
    });

    it('handles escaped quotes in fields', () => {
      const csv = `"Account Owner","Latest Login","Created Date","Billing Country","Account Type","Language","Status","Sirvoy Account Status","Sirvoy Customer ID","Property Type","MRR (converted) Currency","MRR (converted)","Channels"
"John ""The Boss"" Smith","15/01/2024, 10:00","01/01/2023","Sweden","Pro","English","Active Customer","Loyal","CUST-001","Hotels","SEK","1500.00","Booking.com"`;

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records[0]['Account Owner']).toBe('John "The Boss" Smith');
      }
    });

    it('returns error for empty content', () => {
      const result = parser.parse('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMPTY_FILE');
      }
    });

    it('returns error for whitespace-only content', () => {
      const result = parser.parse('   \n\n   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMPTY_FILE');
      }
    });

    it('returns error for missing required headers', () => {
      const csv = `"Account Owner","Latest Login"
"John Smith","15/01/2024"`;

      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_HEADERS');
        expect(result.error.message).toContain('Missing');
      }
    });

    it('skips empty lines', () => {
      const csv = createCsvContent([createTestRow()]) + '\n\n\n';

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records).toHaveLength(1);
      }
    });

    it('handles Windows line endings (CRLF)', () => {
      const csv = createCsvContent([createTestRow()]).replace(/\n/g, '\r\n');

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records).toHaveLength(1);
      }
    });

    it('handles Mac line endings (CR)', () => {
      const csv = createCsvContent([createTestRow()]).replace(/\n/g, '\r');

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records).toHaveLength(1);
      }
    });

    it('reports malformed rows but continues parsing', () => {
      // Create a row with wrong number of fields
      const headerRow = CSV_HEADERS.map((h) => `"${h}"`).join(',');
      const validRow = createTestRow().map((f) => `"${f}"`).join(',');
      const malformedRow = '"only","two","fields"';
      const csv = `${headerRow}\n${validRow}\n${malformedRow}\n${validRow}`;

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.records).toHaveLength(2);
        expect(result.value.errors).toHaveLength(1);
        expect(result.value.errors[0].row).toBe(3);
        expect(result.value.errors[0].code).toBe('MALFORMED_ROW');
      }
    });

    it('reports missing customer ID as error', () => {
      const csv = createCsvContent([createTestRow({ 'Sirvoy Customer ID': '' })]);

      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.errors).toHaveLength(1);
        expect(result.value.records).toHaveLength(0);
      }
    });
  });

  describe('validateHeaders', () => {
    it('validates correct headers', () => {
      const result = parser.validateHeaders([...CSV_HEADERS]);

      expect(result.valid).toBe(true);
      expect(result.missingHeaders).toHaveLength(0);
      expect(result.extraHeaders).toHaveLength(0);
    });

    it('reports missing headers', () => {
      const incompleteHeaders = ['Account Owner', 'Latest Login'];

      const result = parser.validateHeaders(incompleteHeaders);

      expect(result.valid).toBe(false);
      expect(result.missingHeaders.length).toBeGreaterThan(0);
    });

    it('reports extra headers', () => {
      const extraHeaders = [...CSV_HEADERS, 'Extra Column'];

      const result = parser.validateHeaders(extraHeaders);

      expect(result.valid).toBe(true); // Extra headers don't invalidate
      expect(result.extraHeaders).toContain('Extra Column');
    });

    it('handles headers with extra whitespace', () => {
      const headersWithSpaces = CSV_HEADERS.map((h) => `  ${h}  `);

      const result = parser.validateHeaders(headersWithSpaces);

      expect(result.valid).toBe(true);
    });
  });
});
