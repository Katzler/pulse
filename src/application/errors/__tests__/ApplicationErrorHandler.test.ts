import { describe, expect, it } from 'vitest';

import { CustomerNotFoundError,ErrorCode, ValidationError } from '@domain/types/errors';
import {
  AppErrorCode,
  ApplicationErrorHandler,
  ErrorSeverity,
  isApplicationError,
} from '@application/errors/ApplicationErrorHandler';

describe('ApplicationErrorHandler', () => {
  describe('handle', () => {
    it('handles domain errors', () => {
      const domainError = ValidationError.create('Invalid value', { field: 'name' });

      const result = ApplicationErrorHandler.handle(domainError);

      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.message).toBe('Invalid value');
      expect(result.userMessage).toBeDefined();
    });

    it('handles standard Error objects', () => {
      const error = new Error('Something went wrong');

      const result = ApplicationErrorHandler.handle(error);

      expect(result.code).toBe(AppErrorCode.USE_CASE_ERROR);
      expect(result.message).toBe('Something went wrong');
      expect(result.originalError).toBe(error);
    });

    it('handles string errors', () => {
      const result = ApplicationErrorHandler.handle('Error message');

      expect(result.code).toBe(AppErrorCode.USE_CASE_ERROR);
      expect(result.message).toBe('Error message');
    });

    it('handles unknown errors', () => {
      const result = ApplicationErrorHandler.handle({ weird: 'object' });

      expect(result.code).toBe(AppErrorCode.UNKNOWN_ERROR);
      expect(result.originalError).toEqual({ weird: 'object' });
    });

    it('handles null', () => {
      const result = ApplicationErrorHandler.handle(null);

      expect(result.code).toBe(AppErrorCode.UNKNOWN_ERROR);
    });

    it('handles undefined', () => {
      const result = ApplicationErrorHandler.handle(undefined);

      expect(result.code).toBe(AppErrorCode.UNKNOWN_ERROR);
    });
  });

  describe('fromDomainError', () => {
    it('preserves error details', () => {
      const domainError = CustomerNotFoundError.create('CUST-123');

      const result = ApplicationErrorHandler.fromDomainError(domainError);

      expect(result.details).toEqual({ customerId: 'CUST-123' });
    });

    it('provides user-friendly message', () => {
      const domainError = CustomerNotFoundError.create('CUST-123');

      const result = ApplicationErrorHandler.fromDomainError(domainError);

      expect(result.userMessage).not.toContain('CUST-123');
      expect(result.userMessage).toBeDefined();
    });
  });

  describe('getSeverity', () => {
    it('returns warning for validation errors', () => {
      const error = ApplicationErrorHandler.validationError('Invalid');

      expect(ApplicationErrorHandler.getSeverity(error)).toBe(ErrorSeverity.WARNING);
    });

    it('returns info for not found errors', () => {
      const error = ApplicationErrorHandler.notFound('Customer', '123');

      expect(ApplicationErrorHandler.getSeverity(error)).toBe(ErrorSeverity.INFO);
    });

    it('returns critical for unknown errors', () => {
      const error = ApplicationErrorHandler.unknown();

      expect(ApplicationErrorHandler.getSeverity(error)).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('isRecoverable', () => {
    it('returns true for validation errors', () => {
      const error = ApplicationErrorHandler.validationError('Invalid');

      expect(ApplicationErrorHandler.isRecoverable(error)).toBe(true);
    });

    it('returns false for not found errors', () => {
      const error = ApplicationErrorHandler.notFound('Customer', '123');

      expect(ApplicationErrorHandler.isRecoverable(error)).toBe(false);
    });

    it('returns false for unknown errors', () => {
      const error = ApplicationErrorHandler.unknown();

      expect(ApplicationErrorHandler.isRecoverable(error)).toBe(false);
    });
  });

  describe('formatForLog', () => {
    it('includes error code and message', () => {
      const error = ApplicationErrorHandler.validationError('Invalid value');

      const formatted = ApplicationErrorHandler.formatForLog(error);

      expect(formatted).toContain('VALIDATION_ERROR');
      expect(formatted).toContain('Invalid value');
    });

    it('includes details when present', () => {
      const error = ApplicationErrorHandler.notFound('Customer', 'CUST-123');

      const formatted = ApplicationErrorHandler.formatForLog(error);

      expect(formatted).toContain('Details:');
      expect(formatted).toContain('CUST-123');
    });
  });

  describe('validationError', () => {
    it('creates validation error with message', () => {
      const error = ApplicationErrorHandler.validationError('Field is required');

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Field is required');
    });

    it('includes field name when provided', () => {
      const error = ApplicationErrorHandler.validationError('Field is required', 'email');

      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('notFound', () => {
    it('creates not found error', () => {
      const error = ApplicationErrorHandler.notFound('Customer', 'CUST-123');

      expect(error.code).toBe(ErrorCode.CUSTOMER_NOT_FOUND);
      expect(error.message).toContain('Customer');
      expect(error.message).toContain('CUST-123');
    });

    it('includes entity type and id in details', () => {
      const error = ApplicationErrorHandler.notFound('Order', 'ORD-456');

      expect(error.details).toEqual({ entityType: 'Order', id: 'ORD-456' });
    });
  });
});

describe('isApplicationError', () => {
  it('returns true for valid application error', () => {
    const error = ApplicationErrorHandler.validationError('Test');

    expect(isApplicationError(error)).toBe(true);
  });

  it('returns false for plain object', () => {
    expect(isApplicationError({ message: 'Test' })).toBe(false);
  });

  it('returns false for Error instance', () => {
    expect(isApplicationError(new Error('Test'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isApplicationError(null)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isApplicationError('error')).toBe(false);
  });
});
