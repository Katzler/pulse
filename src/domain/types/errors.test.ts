import { describe, expect, it } from 'vitest';

import {
  CsvParseError,
  CustomerNotFoundError,
  DuplicateCustomerError,
  ErrorCode,
  ImportError,
  InvalidCustomerIdError,
  InvalidHealthScoreError,
  InvalidMrrError,
  isDomainError,
  isErrorCode,
  ValidationError,
} from './errors';

describe('Domain Errors', () => {
  describe('ErrorCode', () => {
    it('has all expected error codes', () => {
      expect(ErrorCode.INVALID_HEALTH_SCORE).toBe('INVALID_HEALTH_SCORE');
      expect(ErrorCode.INVALID_CUSTOMER_ID).toBe('INVALID_CUSTOMER_ID');
      expect(ErrorCode.INVALID_MRR).toBe('INVALID_MRR');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.CUSTOMER_NOT_FOUND).toBe('CUSTOMER_NOT_FOUND');
      expect(ErrorCode.DUPLICATE_CUSTOMER).toBe('DUPLICATE_CUSTOMER');
      expect(ErrorCode.CSV_PARSE_ERROR).toBe('CSV_PARSE_ERROR');
      expect(ErrorCode.IMPORT_ERROR).toBe('IMPORT_ERROR');
    });
  });

  describe('InvalidHealthScoreError', () => {
    it('creates error with correct type and message for negative value', () => {
      const error = InvalidHealthScoreError.create(-5);

      expect(error.type).toBe(ErrorCode.INVALID_HEALTH_SCORE);
      expect(error.message).toBe('Health score must be between 0 and 100, got -5');
      expect(error.details.value).toBe(-5);
    });

    it('creates error with correct message for value over 100', () => {
      const error = InvalidHealthScoreError.create(150);

      expect(error.message).toBe('Health score must be between 0 and 100, got 150');
      expect(error.details.value).toBe(150);
    });
  });

  describe('InvalidCustomerIdError', () => {
    it('creates error with correct type and message', () => {
      const error = InvalidCustomerIdError.create('');

      expect(error.type).toBe(ErrorCode.INVALID_CUSTOMER_ID);
      expect(error.message).toBe('Customer ID must be a non-empty string');
      expect(error.details.value).toBe('');
    });

    it('preserves the invalid value in details', () => {
      const error = InvalidCustomerIdError.create('   ');

      expect(error.details.value).toBe('   ');
    });
  });

  describe('InvalidMrrError', () => {
    it('creates error with correct type and message', () => {
      const error = InvalidMrrError.create(-100);

      expect(error.type).toBe(ErrorCode.INVALID_MRR);
      expect(error.message).toBe('MRR must be non-negative, got -100');
      expect(error.details.value).toBe(-100);
    });

    it('includes negative value in details', () => {
      const error = InvalidMrrError.create(-0.01);

      expect(error.details.value).toBe(-0.01);
    });
  });

  describe('CustomerNotFoundError', () => {
    it('creates error with correct type and message', () => {
      const error = CustomerNotFoundError.create('CUST-123');

      expect(error.type).toBe(ErrorCode.CUSTOMER_NOT_FOUND);
      expect(error.message).toBe('Customer not found: CUST-123');
      expect(error.details.customerId).toBe('CUST-123');
    });

    it('handles various customer ID formats', () => {
      const error = CustomerNotFoundError.create('12345');

      expect(error.details.customerId).toBe('12345');
      expect(error.message).toContain('12345');
    });
  });

  describe('DuplicateCustomerError', () => {
    it('creates error with correct type and message', () => {
      const error = DuplicateCustomerError.create('CUST-456');

      expect(error.type).toBe(ErrorCode.DUPLICATE_CUSTOMER);
      expect(error.message).toBe('Customer already exists: CUST-456');
      expect(error.details.customerId).toBe('CUST-456');
    });
  });

  describe('CsvParseError', () => {
    it('creates error with message only', () => {
      const error = CsvParseError.create('Invalid CSV format');

      expect(error.type).toBe(ErrorCode.CSV_PARSE_ERROR);
      expect(error.message).toBe('Invalid CSV format');
      expect(error.details).toEqual({});
    });

    it('creates error with line number', () => {
      const error = CsvParseError.create('Invalid date format', { line: 5 });

      expect(error.details.line).toBe(5);
    });

    it('creates error with column name', () => {
      const error = CsvParseError.create('Missing required field', { column: 'Account Owner' });

      expect(error.details.column).toBe('Account Owner');
    });

    it('creates error with original error', () => {
      const error = CsvParseError.create('Parse failed', {
        line: 10,
        column: 'MRR',
        originalError: 'NumberFormatException',
      });

      expect(error.details.line).toBe(10);
      expect(error.details.column).toBe('MRR');
      expect(error.details.originalError).toBe('NumberFormatException');
    });
  });

  describe('ValidationError', () => {
    it('creates error with message only', () => {
      const error = ValidationError.create('Field is required');

      expect(error.type).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Field is required');
      expect(error.details).toEqual({});
    });

    it('creates error with field name', () => {
      const error = ValidationError.create('Invalid email format', { field: 'email' });

      expect(error.details.field).toBe('email');
    });

    it('creates error with row number for import context', () => {
      const error = ValidationError.create('Missing customer ID', { row: 42 });

      expect(error.details.row).toBe(42);
    });

    it('creates error with full details', () => {
      const error = ValidationError.create('Invalid status value', {
        field: 'Status',
        value: 'Unknown',
        row: 15,
      });

      expect(error.details.field).toBe('Status');
      expect(error.details.value).toBe('Unknown');
      expect(error.details.row).toBe(15);
    });
  });

  describe('ImportError', () => {
    it('creates error aggregating validation errors', () => {
      const validationErrors = [
        ValidationError.create('Missing ID', { row: 1 }),
        ValidationError.create('Invalid MRR', { row: 5 }),
      ];

      const error = ImportError.create(validationErrors, 100);

      expect(error.type).toBe(ErrorCode.IMPORT_ERROR);
      expect(error.message).toBe('Import failed: 2 validation errors in 100 rows');
      expect(error.details.errors).toHaveLength(2);
      expect(error.details.totalRows).toBe(100);
      expect(error.details.failedRows).toBe(2);
    });

    it('handles empty error list', () => {
      const error = ImportError.create([], 50);

      expect(error.message).toBe('Import failed: 0 validation errors in 50 rows');
      expect(error.details.failedRows).toBe(0);
    });

    it('preserves all validation errors in details', () => {
      const validationErrors = [
        ValidationError.create('Error 1', { row: 1, field: 'A' }),
        ValidationError.create('Error 2', { row: 2, field: 'B' }),
        ValidationError.create('Error 3', { row: 3, field: 'C' }),
      ];

      const error = ImportError.create(validationErrors, 10);

      expect(error.details.errors[0].details.field).toBe('A');
      expect(error.details.errors[1].details.field).toBe('B');
      expect(error.details.errors[2].details.field).toBe('C');
    });
  });

  describe('isDomainError', () => {
    it('returns true for valid domain errors', () => {
      expect(isDomainError(InvalidHealthScoreError.create(150))).toBe(true);
      expect(isDomainError(InvalidCustomerIdError.create(''))).toBe(true);
      expect(isDomainError(InvalidMrrError.create(-1))).toBe(true);
      expect(isDomainError(CustomerNotFoundError.create('123'))).toBe(true);
      expect(isDomainError(DuplicateCustomerError.create('123'))).toBe(true);
      expect(isDomainError(CsvParseError.create('error'))).toBe(true);
      expect(isDomainError(ValidationError.create('error'))).toBe(true);
      expect(isDomainError(ImportError.create([], 0))).toBe(true);
    });

    it('returns false for null', () => {
      expect(isDomainError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isDomainError(undefined)).toBe(false);
    });

    it('returns false for primitive values', () => {
      expect(isDomainError('error')).toBe(false);
      expect(isDomainError(123)).toBe(false);
      expect(isDomainError(true)).toBe(false);
    });

    it('returns false for plain objects without required fields', () => {
      expect(isDomainError({})).toBe(false);
      expect(isDomainError({ type: 'ERROR' })).toBe(false);
      expect(isDomainError({ message: 'error' })).toBe(false);
    });

    it('returns false for objects with wrong field types', () => {
      expect(isDomainError({ type: 123, message: 'error' })).toBe(false);
      expect(isDomainError({ type: 'ERROR', message: 123 })).toBe(false);
    });

    it('returns true for objects with type and message strings', () => {
      expect(isDomainError({ type: 'CUSTOM_ERROR', message: 'Something went wrong' })).toBe(true);
    });
  });

  describe('isErrorCode', () => {
    it('returns true when error matches the specified code', () => {
      const error = InvalidHealthScoreError.create(150);
      expect(isErrorCode(error, ErrorCode.INVALID_HEALTH_SCORE)).toBe(true);
    });

    it('returns false when error does not match the specified code', () => {
      const error = InvalidHealthScoreError.create(150);
      expect(isErrorCode(error, ErrorCode.INVALID_CUSTOMER_ID)).toBe(false);
    });

    it('correctly narrows type for each error code', () => {
      const healthError = InvalidHealthScoreError.create(150);
      if (isErrorCode(healthError, ErrorCode.INVALID_HEALTH_SCORE)) {
        // Type should be narrowed to InvalidHealthScoreError
        expect(healthError.details.value).toBe(150);
      }

      const customerError = CustomerNotFoundError.create('123');
      if (isErrorCode(customerError, ErrorCode.CUSTOMER_NOT_FOUND)) {
        // Type should be narrowed to CustomerNotFoundError
        expect(customerError.details.customerId).toBe('123');
      }

      const importError = ImportError.create([], 10);
      if (isErrorCode(importError, ErrorCode.IMPORT_ERROR)) {
        // Type should be narrowed to ImportError
        expect(importError.details.totalRows).toBe(10);
      }
    });
  });
});
