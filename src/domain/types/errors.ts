/**
 * Domain Error Types
 *
 * Provides explicit error handling with typed error information.
 * Each error includes a type discriminant, message, and optional details.
 */

/**
 * Error type codes for discriminating errors
 */
export const ErrorCode = {
  // Validation errors
  INVALID_HEALTH_SCORE: 'INVALID_HEALTH_SCORE',
  INVALID_CUSTOMER_ID: 'INVALID_CUSTOMER_ID',
  INVALID_MRR: 'INVALID_MRR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Business errors
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  DUPLICATE_CUSTOMER: 'DUPLICATE_CUSTOMER',

  // Import errors
  CSV_PARSE_ERROR: 'CSV_PARSE_ERROR',
  IMPORT_ERROR: 'IMPORT_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Base interface for all domain errors
 */
export interface DomainError {
  readonly type: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Invalid health score (outside 0-100 range)
 */
export interface InvalidHealthScoreError extends DomainError {
  readonly type: typeof ErrorCode.INVALID_HEALTH_SCORE;
  readonly details: {
    value: number;
  };
}

export const InvalidHealthScoreError = {
  create: (value: number): InvalidHealthScoreError => ({
    type: ErrorCode.INVALID_HEALTH_SCORE,
    message: `Health score must be between 0 and 100, got ${value}`,
    details: { value },
  }),
};

/**
 * Invalid customer ID (empty or invalid format)
 */
export interface InvalidCustomerIdError extends DomainError {
  readonly type: typeof ErrorCode.INVALID_CUSTOMER_ID;
  readonly details: {
    value: string;
  };
}

export const InvalidCustomerIdError = {
  create: (value: string): InvalidCustomerIdError => ({
    type: ErrorCode.INVALID_CUSTOMER_ID,
    message: 'Customer ID must be a non-empty string',
    details: { value },
  }),
};

/**
 * Invalid MRR (negative value)
 */
export interface InvalidMrrError extends DomainError {
  readonly type: typeof ErrorCode.INVALID_MRR;
  readonly details: {
    value: number;
  };
}

export const InvalidMrrError = {
  create: (value: number): InvalidMrrError => ({
    type: ErrorCode.INVALID_MRR,
    message: `MRR must be non-negative, got ${value}`,
    details: { value },
  }),
};

/**
 * Customer not found in repository
 */
export interface CustomerNotFoundError extends DomainError {
  readonly type: typeof ErrorCode.CUSTOMER_NOT_FOUND;
  readonly details: {
    customerId: string;
  };
}

export const CustomerNotFoundError = {
  create: (customerId: string): CustomerNotFoundError => ({
    type: ErrorCode.CUSTOMER_NOT_FOUND,
    message: `Customer not found: ${customerId}`,
    details: { customerId },
  }),
};

/**
 * Duplicate customer ID
 */
export interface DuplicateCustomerError extends DomainError {
  readonly type: typeof ErrorCode.DUPLICATE_CUSTOMER;
  readonly details: {
    customerId: string;
  };
}

export const DuplicateCustomerError = {
  create: (customerId: string): DuplicateCustomerError => ({
    type: ErrorCode.DUPLICATE_CUSTOMER,
    message: `Customer already exists: ${customerId}`,
    details: { customerId },
  }),
};

/**
 * CSV parsing error
 */
export interface CsvParseError extends DomainError {
  readonly type: typeof ErrorCode.CSV_PARSE_ERROR;
  readonly details: {
    line?: number;
    column?: string;
    originalError?: string;
  };
}

export const CsvParseError = {
  create: (
    message: string,
    details?: { line?: number; column?: string; originalError?: string }
  ): CsvParseError => ({
    type: ErrorCode.CSV_PARSE_ERROR,
    message,
    details: details ?? {},
  }),
};

/**
 * Generic validation error (with row context for imports)
 */
export interface ValidationError extends DomainError {
  readonly type: typeof ErrorCode.VALIDATION_ERROR;
  readonly details: {
    field?: string;
    value?: unknown;
    row?: number;
  };
}

export const ValidationError = {
  create: (
    message: string,
    details?: { field?: string; value?: unknown; row?: number }
  ): ValidationError => ({
    type: ErrorCode.VALIDATION_ERROR,
    message,
    details: details ?? {},
  }),
};

/**
 * Import error (aggregates multiple validation errors)
 */
export interface ImportError extends DomainError {
  readonly type: typeof ErrorCode.IMPORT_ERROR;
  readonly details: {
    errors: ValidationError[];
    totalRows: number;
    failedRows: number;
  };
}

export const ImportError = {
  create: (errors: ValidationError[], totalRows: number): ImportError => ({
    type: ErrorCode.IMPORT_ERROR,
    message: `Import failed: ${errors.length} validation errors in ${totalRows} rows`,
    details: {
      errors,
      totalRows,
      failedRows: errors.length,
    },
  }),
};

/**
 * Union of all domain error types
 */
export type AnyDomainError =
  | InvalidHealthScoreError
  | InvalidCustomerIdError
  | InvalidMrrError
  | CustomerNotFoundError
  | DuplicateCustomerError
  | CsvParseError
  | ValidationError
  | ImportError;

/**
 * Type guard for checking specific error types
 */
export function isDomainError(error: unknown): error is DomainError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof (error as DomainError).type === 'string' &&
    typeof (error as DomainError).message === 'string'
  );
}

/**
 * Type guard for specific error codes
 */
export function isErrorCode<T extends ErrorCode>(
  error: DomainError,
  code: T
): error is Extract<AnyDomainError, { type: T }> {
  return error.type === code;
}
