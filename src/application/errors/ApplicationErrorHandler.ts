import { type DomainError, ErrorCode, isDomainError } from '@domain/types/errors';

/**
 * Application-level error codes
 */
export const AppErrorCode = {
  ...ErrorCode,
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  USE_CASE_ERROR: 'USE_CASE_ERROR',
  REPOSITORY_ERROR: 'REPOSITORY_ERROR',
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];

/**
 * Application error structure
 */
export interface ApplicationError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly userMessage: string;
  readonly details?: unknown;
  readonly originalError?: unknown;
}

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

/**
 * Maps error codes to user-friendly messages
 */
const userMessages: Record<string, string> = {
  [ErrorCode.INVALID_HEALTH_SCORE]: 'The health score value is invalid.',
  [ErrorCode.INVALID_CUSTOMER_ID]: 'The customer ID is invalid.',
  [ErrorCode.INVALID_MRR]: 'The MRR value is invalid.',
  [ErrorCode.VALIDATION_ERROR]: 'The data provided is not valid.',
  [ErrorCode.CUSTOMER_NOT_FOUND]: 'The requested customer could not be found.',
  [ErrorCode.DUPLICATE_CUSTOMER]: 'A customer with this ID already exists.',
  [ErrorCode.CSV_PARSE_ERROR]: 'The CSV file could not be parsed.',
  [ErrorCode.IMPORT_ERROR]: 'Some records could not be imported.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  USE_CASE_ERROR: 'The operation could not be completed.',
  REPOSITORY_ERROR: 'A data access error occurred.',
};

/**
 * Maps error codes to severity levels
 */
const errorSeverity: Record<string, ErrorSeverity> = {
  [ErrorCode.INVALID_HEALTH_SCORE]: ErrorSeverity.WARNING,
  [ErrorCode.INVALID_CUSTOMER_ID]: ErrorSeverity.WARNING,
  [ErrorCode.INVALID_MRR]: ErrorSeverity.WARNING,
  [ErrorCode.VALIDATION_ERROR]: ErrorSeverity.WARNING,
  [ErrorCode.CUSTOMER_NOT_FOUND]: ErrorSeverity.INFO,
  [ErrorCode.DUPLICATE_CUSTOMER]: ErrorSeverity.WARNING,
  [ErrorCode.CSV_PARSE_ERROR]: ErrorSeverity.ERROR,
  [ErrorCode.IMPORT_ERROR]: ErrorSeverity.ERROR,
  UNKNOWN_ERROR: ErrorSeverity.CRITICAL,
  USE_CASE_ERROR: ErrorSeverity.ERROR,
  REPOSITORY_ERROR: ErrorSeverity.ERROR,
};

/**
 * Application Error Handler
 *
 * Provides centralized error handling for the application layer.
 * Converts domain errors and exceptions to user-friendly messages.
 */
export const ApplicationErrorHandler = {
  /**
   * Convert any error to an ApplicationError
   */
  handle(error: unknown): ApplicationError {
    // Handle domain errors
    if (isDomainError(error)) {
      return ApplicationErrorHandler.fromDomainError(error);
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return ApplicationErrorHandler.fromError(error);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return ApplicationErrorHandler.fromString(error);
    }

    // Handle unknown errors
    return ApplicationErrorHandler.unknown(error);
  },

  /**
   * Convert a domain error to application error
   */
  fromDomainError(error: DomainError): ApplicationError {
    return {
      code: error.type as AppErrorCode,
      message: error.message,
      userMessage: userMessages[error.type] ?? userMessages['UNKNOWN_ERROR'],
      details: error.details,
    };
  },

  /**
   * Convert a standard Error to application error
   */
  fromError(error: Error): ApplicationError {
    return {
      code: AppErrorCode.USE_CASE_ERROR,
      message: error.message,
      userMessage: userMessages['USE_CASE_ERROR'],
      originalError: error,
    };
  },

  /**
   * Convert a string error to application error
   */
  fromString(message: string): ApplicationError {
    return {
      code: AppErrorCode.USE_CASE_ERROR,
      message,
      userMessage: userMessages['USE_CASE_ERROR'],
    };
  },

  /**
   * Create an unknown error
   */
  unknown(originalError?: unknown): ApplicationError {
    return {
      code: AppErrorCode.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      userMessage: userMessages['UNKNOWN_ERROR'],
      originalError,
    };
  },

  /**
   * Get severity level for an error
   */
  getSeverity(error: ApplicationError): ErrorSeverity {
    return errorSeverity[error.code] ?? ErrorSeverity.ERROR;
  },

  /**
   * Check if error is recoverable (user can retry)
   */
  isRecoverable(error: ApplicationError): boolean {
    const nonRecoverableCodes: AppErrorCode[] = [
      AppErrorCode.UNKNOWN_ERROR,
      ErrorCode.CUSTOMER_NOT_FOUND,
    ];
    return !nonRecoverableCodes.includes(error.code);
  },

  /**
   * Format error for logging
   */
  formatForLog(error: ApplicationError): string {
    const parts = [`[${error.code}] ${error.message}`];

    if (error.details) {
      parts.push(`Details: ${JSON.stringify(error.details)}`);
    }

    return parts.join(' | ');
  },

  /**
   * Create a validation error
   */
  validationError(message: string, field?: string): ApplicationError {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message,
      userMessage: userMessages[ErrorCode.VALIDATION_ERROR],
      details: field ? { field } : undefined,
    };
  },

  /**
   * Create a not found error
   */
  notFound(entityType: string, id: string): ApplicationError {
    return {
      code: ErrorCode.CUSTOMER_NOT_FOUND,
      message: `${entityType} not found: ${id}`,
      userMessage: userMessages[ErrorCode.CUSTOMER_NOT_FOUND],
      details: { entityType, id },
    };
  },
};

/**
 * Type guard for ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error
  );
}
