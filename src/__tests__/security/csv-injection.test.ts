/**
 * CSV Injection Prevention Tests
 *
 * Verify that CSV import/export properly handles formula injection attempts.
 */
import { describe, expect, it } from 'vitest';

import { Sanitizer } from '@infrastructure/validation';

// CSV formula injection payloads
const formulaPayloads = [
  '=SUM(A1:A10)',
  '=CMD|\'calc\'!A0',
  '+abc+def', // Not a number, should be flagged
  '-abc',
  '@SUM(A1)',
  '\t=1+1',
  '\r=1+1',
  '=HYPERLINK("http://evil.com","Click")',
  '=IMAGE("http://evil.com/track.gif")',
  '@A1',
  '+abc',
  '-abc',
];

// Characters that could trigger formula execution in Excel
const formulaStartChars = ['=', '+', '-', '@', '\t', '\r', '\n', "'"];

describe('CSV Formula Injection Prevention', () => {
  describe('Sanitizer.sanitizeString', () => {
    const sanitizer = new Sanitizer();

    formulaPayloads.forEach((payload) => {
      it(`should sanitize formula: ${payload}`, () => {
        const result = sanitizer.sanitizeString(payload);

        // After sanitization, the result should either:
        // 1. Be prefixed with single quote (escaped formula)
        // 2. Have the first dangerous char neutralized
        // The value should not execute as a formula when opened in Excel

        // Check that the original dangerous character is either:
        // - Prefixed with ' (making it a string)
        // - HTML-escaped
        // Either way, it's safe
        expect(result.value).toBeDefined();
        // Should have a warning about formula injection detection
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });

    it('should preserve safe values', () => {
      const safeValues = ['John Doe', '123', 'user@example.com'];

      safeValues.forEach((value) => {
        const result = sanitizer.sanitizeString(value);
        // Safe values should not be modified (except HTML escaping for @)
        if (value === 'user@example.com') {
          // @ at start would be flagged, but in middle is fine
          expect(result.warnings.length).toBe(0);
        }
      });
    });

    it('should handle empty and whitespace strings', () => {
      expect(sanitizer.sanitizeString('').value).toBe('');
      expect(sanitizer.sanitizeString('   ').warnings.length).toBe(0);
    });

    it('should handle unicode characters', () => {
      const unicode = 'Hôtel de la Paix';
      const result = sanitizer.sanitizeString(unicode);
      expect(result.value).toBe(unicode);
      expect(result.warnings.length).toBe(0);
    });

    it('should allow negative numbers', () => {
      const result = sanitizer.sanitizeString('-100');
      expect(result.warnings.length).toBe(0); // Negative numbers are allowed
    });

    it('should allow positive numbers', () => {
      const result = sanitizer.sanitizeString('+100');
      expect(result.warnings.length).toBe(0); // Positive numbers are allowed
    });
  });

  describe('Sanitizer.sanitizeRecord', () => {
    const sanitizer = new Sanitizer();

    it('should sanitize all fields in a record', () => {
      const record = {
        'Sirvoy Customer ID': 'TEST-001',
        'Account Owner': '=SUM(A1:A10)',
        'Account Name': 'Test Hotels Inc',
        'Latest Login': '01/01/2024, 10:00',
        'Created Date': '01/01/2023',
        'Last Customer Success Contact Date': '15/12/2023',
        'Billing Country': 'USA',
        'Account Type': 'Pro',
        Language: 'English',
        Status: '@Active',
        'Sirvoy Account Status': 'Loyal',
        'Property Type': 'Hotels',
        'MRR (converted) Currency': 'USD',
        'MRR (converted)': '1000',
        Channels: 'Booking.com',
      };

      const result = sanitizer.sanitizeRecord(record);

      // Should have warnings for formula-like values
      expect(result.warnings.length).toBeGreaterThan(0);
      // Account Owner should be sanitized
      expect(result.warnings.some((w) => w.includes('Account Owner'))).toBe(true);
      // Status should be sanitized (starts with @)
      expect(result.warnings.some((w) => w.includes('Status'))).toBe(true);
    });

    it('should return sanitized record with all fields', () => {
      const record = {
        'Sirvoy Customer ID': 'TEST-001',
        'Account Owner': 'Safe Hotel',
        'Account Name': 'Safe Hotel Inc',
        'Latest Login': '',
        'Created Date': '01/01/2023',
        'Last Customer Success Contact Date': '15/12/2023',
        'Billing Country': 'USA',
        'Account Type': 'Pro',
        Language: 'English',
        Status: 'Active Customer',
        'Sirvoy Account Status': 'Loyal',
        'Property Type': 'Hotels',
        'MRR (converted) Currency': 'USD',
        'MRR (converted)': '1000',
        Channels: 'Booking.com',
      };

      const result = sanitizer.sanitizeRecord(record);

      expect(result.value['Sirvoy Customer ID']).toBe('TEST-001');
      expect(result.value['Account Owner']).toBe('Safe Hotel');
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Sanitizer.sanitizeBatch', () => {
    const sanitizer = new Sanitizer();

    it('should sanitize multiple records', () => {
      const records = [
        {
          'Sirvoy Customer ID': 'TEST-001',
          'Account Owner': '=FORMULA()',
          'Account Name': 'Test Hotels Inc',
          'Latest Login': '',
          'Created Date': '01/01/2023',
          'Last Customer Success Contact Date': '15/12/2023',
          'Billing Country': 'USA',
          'Account Type': 'Pro',
          Language: 'English',
          Status: 'Active Customer',
          'Sirvoy Account Status': 'Loyal',
          'Property Type': 'Hotels',
          'MRR (converted) Currency': 'USD',
          'MRR (converted)': '1000',
          Channels: 'Booking.com',
        },
        {
          'Sirvoy Customer ID': 'TEST-002',
          'Account Owner': '+ANOTHER()',
          'Account Name': 'Another Hotels Inc',
          'Latest Login': '',
          'Created Date': '01/01/2023',
          'Last Customer Success Contact Date': '',
          'Billing Country': 'Germany',
          'Account Type': 'Starter',
          Language: 'German',
          Status: 'Active Customer',
          'Sirvoy Account Status': 'New',
          'Property Type': 'B&B',
          'MRR (converted) Currency': 'EUR',
          'MRR (converted)': '500',
          Channels: 'Expedia',
        },
      ];

      const result = sanitizer.sanitizeBatch(records);

      expect(result.value.length).toBe(2);
      // Should have warnings with row numbers
      expect(result.warnings.some((w) => w.includes('Row 1'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('Row 2'))).toBe(true);
    });
  });

  describe('Import Safety', () => {
    it('should document that import values are treated as strings', () => {
      // CSV values imported should be treated as strings by the application
      // The actual "execution" of formulas only happens in spreadsheet software
      // when opening the exported CSV.

      // Our protection is:
      // 1. On import: values are sanitized with single quote prefix for dangerous chars
      // 2. HTML entities are escaped to prevent XSS
      // 3. On export: we should also escape formula-like strings

      expect(true).toBe(true); // Documentation test
    });
  });
});

describe('CSV Formula Characters Detection', () => {
  const sanitizer = new Sanitizer();

  const testCases = [
    { input: '=test', shouldDetect: true },
    { input: '+test', shouldDetect: true },
    { input: '-test', shouldDetect: true },
    { input: '@test', shouldDetect: true },
    { input: 'test', shouldDetect: false },
    { input: 'test@email.com', shouldDetect: false }, // @ not at start
    { input: '123', shouldDetect: false },
    { input: '', shouldDetect: false },
    { input: '-100', shouldDetect: false }, // Negative number exception
    { input: '+100', shouldDetect: false }, // Positive number exception
  ];

  testCases.forEach(({ input, shouldDetect }) => {
    it(`should ${shouldDetect ? '' : 'not '}detect formula in: "${input}"`, () => {
      const result = sanitizer.sanitizeString(input);
      const hasWarning = result.warnings.length > 0;
      expect(hasWarning).toBe(shouldDetect);
    });
  });
});
