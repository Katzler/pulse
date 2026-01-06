import { beforeEach, describe, expect, it } from 'vitest';

import { type RawCustomerRecord } from '@shared/types';

import { DataValidator } from '../DataValidator';

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

describe('DataValidator', () => {
  let validator: DataValidator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('validate', () => {
    describe('required fields', () => {
      it('validates a complete record', () => {
        const record = createTestRecord();
        const result = validator.validate(record, 1);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.isValid).toBe(true);
          expect(result.value.errors).toHaveLength(0);
        }
      });

      it('fails when Customer ID is missing', () => {
        const record = createTestRecord({ 'Sirvoy Customer ID': '' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'MISSING_CUSTOMER_ID',
              field: 'Sirvoy Customer ID',
            })
          );
        }
      });

      it('fails when Account Owner is missing', () => {
        const record = createTestRecord({ 'Account Owner': '' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'MISSING_ACCOUNT_OWNER',
            })
          );
        }
      });

      it('fails when Status is missing', () => {
        const record = createTestRecord({ Status: '' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
      });

      it('fails when Account Type is missing', () => {
        const record = createTestRecord({ 'Account Type': '' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
      });

      it('fails when Created Date is missing', () => {
        const record = createTestRecord({ 'Created Date': '' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
      });
    });

    describe('type validation', () => {
      it('validates correct date format (DD/MM/YYYY)', () => {
        const record = createTestRecord({ 'Created Date': '15/01/2024' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(true);
      });

      it('validates correct datetime format (DD/MM/YYYY, HH:mm)', () => {
        const record = createTestRecord({ 'Latest Login': '15/01/2024, 10:30' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(true);
      });

      it('fails on invalid date format', () => {
        const record = createTestRecord({ 'Created Date': '2024-01-15' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'INVALID_DATE_FORMAT',
            })
          );
        }
      });

      it('fails on invalid MRR format', () => {
        const record = createTestRecord({ 'MRR (converted)': 'not-a-number' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'INVALID_NUMBER',
            })
          );
        }
      });
    });

    describe('value validation', () => {
      it('validates correct status values', () => {
        const activeRecord = createTestRecord({ Status: 'Active Customer' });
        const inactiveRecord = createTestRecord({ Status: 'Inactive Customer' });

        expect(validator.validate(activeRecord, 1).success).toBe(true);
        expect(validator.validate(inactiveRecord, 1).success).toBe(true);
      });

      it('fails on invalid status', () => {
        const record = createTestRecord({ Status: 'Unknown Status' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'INVALID_STATUS',
            })
          );
        }
      });

      it('validates correct account type values', () => {
        const proRecord = createTestRecord({ 'Account Type': 'Pro' });
        const starterRecord = createTestRecord({ 'Account Type': 'Starter' });

        expect(validator.validate(proRecord, 1).success).toBe(true);
        expect(validator.validate(starterRecord, 1).success).toBe(true);
      });

      it('fails on invalid account type', () => {
        const record = createTestRecord({ 'Account Type': 'Enterprise' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'INVALID_ACCOUNT_TYPE',
            })
          );
        }
      });

      it('fails on negative MRR', () => {
        const record = createTestRecord({ 'MRR (converted)': '-100' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'INVALID_MRR',
            })
          );
        }
      });
    });

    describe('validation modes', () => {
      it('in strict mode, returns error for invalid records', () => {
        validator.setMode('strict');
        const record = createTestRecord({ Status: 'Invalid' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(false);
      });

      it('in lenient mode, returns success with errors for invalid records', () => {
        validator.setMode('lenient');
        const record = createTestRecord({ Status: 'Invalid' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.isValid).toBe(false);
          expect(result.value.errors).toHaveLength(1);
        }
      });

      it('in lenient mode, applies default values for missing optional fields', () => {
        validator.setMode('lenient');
        const record = createTestRecord({ 'MRR (converted)': '', Language: '' });
        const result = validator.validate(record, 1);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.record['MRR (converted)']).toBe('0');
          expect(result.value.record.Language).toBe('Unknown');
        }
      });
    });
  });

  describe('validateBatch', () => {
    it('validates multiple records', () => {
      const records = [createTestRecord({ 'Sirvoy Customer ID': 'CUST-001' }), createTestRecord({ 'Sirvoy Customer ID': 'CUST-002' })];

      const result = validator.validateBatch(records);

      expect(result.totalRecords).toBe(2);
      expect(result.validRecords).toBe(2);
      expect(result.invalidRecords).toBe(0);
    });

    it('counts valid and invalid records separately', () => {
      validator.setMode('lenient');
      const records = [createTestRecord(), createTestRecord({ Status: 'Invalid' }), createTestRecord()];

      const result = validator.validateBatch(records);

      expect(result.totalRecords).toBe(3);
      expect(result.validRecords).toBe(2);
      expect(result.invalidRecords).toBe(1);
    });

    it('collects all errors from batch', () => {
      validator.setMode('lenient');
      const records = [
        createTestRecord({ Status: 'Invalid1' }),
        createTestRecord({ 'Account Type': 'Invalid2' }),
      ];

      const result = validator.validateBatch(records);

      expect(result.errors).toHaveLength(2);
    });
  });
});
