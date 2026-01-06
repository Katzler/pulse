import { describe, expect, it } from 'vitest';

import type { RawCustomerRecord } from '@shared/types';

import { Sanitizer } from '../Sanitizer';

describe('Sanitizer', () => {
  const sanitizer = new Sanitizer();

  describe('sanitizeString', () => {
    describe('XSS prevention', () => {
      it('escapes HTML tags', () => {
        const result = sanitizer.sanitizeString('<script>alert("xss")</script>');
        expect(result.value).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      });

      it('escapes HTML entities', () => {
        const result = sanitizer.sanitizeString('Hello & <world>');
        expect(result.value).toBe('Hello &amp; &lt;world&gt;');
      });

      it('escapes quotes', () => {
        const result = sanitizer.sanitizeString('Say "Hello"');
        expect(result.value).toBe('Say &quot;Hello&quot;');
      });

      it('escapes single quotes', () => {
        const result = sanitizer.sanitizeString("It's a test");
        expect(result.value).toBe('It&#x27;s a test');
      });

      it('handles img tag XSS vectors', () => {
        const result = sanitizer.sanitizeString('<img src=x onerror=alert("xss")>');
        expect(result.value).not.toContain('<img');
        expect(result.value).toContain('&lt;img');
      });

      it('handles javascript: protocol XSS', () => {
        const result = sanitizer.sanitizeString('javascript:alert("xss")');
        // The protocol itself is not an HTML injection, but quotes are escaped
        expect(result.value).toBe('javascript:alert(&quot;xss&quot;)');
      });
    });

    describe('CSV formula injection prevention', () => {
      it('escapes formulas starting with =', () => {
        const result = sanitizer.sanitizeString('=SUM(A1:A10)');
        // The prefix quote is also HTML-escaped for XSS safety
        expect(result.value).toBe("&#x27;=SUM(A1:A10)");
        expect(result.warnings).toHaveLength(1);
      });

      it('escapes formulas starting with @', () => {
        const result = sanitizer.sanitizeString('@SUM(A1:A10)');
        expect(result.value).toBe("&#x27;@SUM(A1:A10)");
        expect(result.warnings).toHaveLength(1);
      });

      it('allows negative numbers', () => {
        const result = sanitizer.sanitizeString('-100.50');
        expect(result.value).toBe('-100.50');
        expect(result.warnings).toHaveLength(0);
      });

      it('allows positive numbers', () => {
        const result = sanitizer.sanitizeString('+100');
        expect(result.value).toBe('+100');
        expect(result.warnings).toHaveLength(0);
      });

      it('detects dangerous + patterns that are not numbers', () => {
        // +1+1 starts with +1 which matches the positive number pattern
        // but +ABC does not match a number
        const result = sanitizer.sanitizeString('+ABC');
        expect(result.value).toBe("&#x27;+ABC");
        expect(result.warnings).toHaveLength(1);
      });

      it('escapes tab-prefixed formulas', () => {
        const result = sanitizer.sanitizeString('\t=CMD|');
        // Contains HTML-escaped quote as prefix
        expect(result.value).toContain("&#x27;");
        expect(result.warnings).toHaveLength(1);
      });
    });

    describe('edge cases', () => {
      it('handles empty strings', () => {
        const result = sanitizer.sanitizeString('');
        expect(result.value).toBe('');
        expect(result.warnings).toHaveLength(0);
      });

      it('handles normal text without modification', () => {
        const result = sanitizer.sanitizeString('John Smith');
        expect(result.value).toBe('John Smith');
        expect(result.warnings).toHaveLength(0);
      });
    });
  });

  describe('sanitizeRecord', () => {
    function createTestRecord(overrides: Partial<RawCustomerRecord> = {}): RawCustomerRecord {
      const defaults: RawCustomerRecord = {
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
      return { ...defaults, ...overrides };
    }

    it('sanitizes all fields in a record', () => {
      const record = createTestRecord({
        'Account Owner': '<script>alert("xss")</script>',
      });

      const result = sanitizer.sanitizeRecord(record);

      expect(result.value['Account Owner']).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('reports warnings with field names', () => {
      const record = createTestRecord({
        'Account Owner': '=HYPERLINK("evil.com")',
      });

      const result = sanitizer.sanitizeRecord(record);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Account Owner');
    });
  });

  describe('sanitizeBatch', () => {
    it('sanitizes multiple records', () => {
      const records: RawCustomerRecord[] = [
        {
          'Account Owner': '<script>bad</script>',
          'Latest Login': '15/01/2024',
          'Created Date': '01/01/2023',
          'Billing Country': 'Sweden',
          'Account Type': 'Pro',
          Language: 'English',
          Status: 'Active Customer',
          'Sirvoy Account Status': 'Loyal',
          'Sirvoy Customer ID': 'CUST-001',
          'Property Type': 'Hotels',
          'MRR (converted) Currency': 'SEK',
          'MRR (converted)': '1000',
          Channels: 'Booking.com',
        },
        {
          'Account Owner': 'Normal Name',
          'Latest Login': '16/01/2024',
          'Created Date': '02/01/2023',
          'Billing Country': 'Norway',
          'Account Type': 'Starter',
          Language: 'Norwegian',
          Status: 'Active Customer',
          'Sirvoy Account Status': 'New',
          'Sirvoy Customer ID': 'CUST-002',
          'Property Type': 'B&B',
          'MRR (converted) Currency': 'NOK',
          'MRR (converted)': '500',
          Channels: 'Expedia',
        },
      ];

      const result = sanitizer.sanitizeBatch(records);

      expect(result.value).toHaveLength(2);
      expect(result.value[0]['Account Owner']).toContain('&lt;script&gt;');
      expect(result.value[1]['Account Owner']).toBe('Normal Name');
    });

    it('includes row numbers in warnings', () => {
      const records: RawCustomerRecord[] = [
        {
          'Account Owner': '=FORMULA',
          'Latest Login': '15/01/2024',
          'Created Date': '01/01/2023',
          'Billing Country': 'Sweden',
          'Account Type': 'Pro',
          Language: 'English',
          Status: 'Active Customer',
          'Sirvoy Account Status': 'Loyal',
          'Sirvoy Customer ID': 'CUST-001',
          'Property Type': 'Hotels',
          'MRR (converted) Currency': 'SEK',
          'MRR (converted)': '1000',
          Channels: 'Booking.com',
        },
      ];

      const result = sanitizer.sanitizeBatch(records);

      expect(result.warnings[0]).toContain('Row 1');
    });
  });
});
