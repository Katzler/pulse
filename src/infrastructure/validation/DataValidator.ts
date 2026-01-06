import { AccountType, CustomerStatus, type RawCustomerRecord, type Result } from '@shared/types';

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'MISSING_CUSTOMER_ID'
  | 'MISSING_ACCOUNT_OWNER'
  | 'MISSING_STATUS'
  | 'MISSING_ACCOUNT_TYPE'
  | 'MISSING_CREATED_DATE'
  | 'INVALID_STATUS'
  | 'INVALID_ACCOUNT_TYPE'
  | 'INVALID_DATE_FORMAT'
  | 'INVALID_NUMBER'
  | 'INVALID_MRR';

/**
 * Validation error with context
 */
export interface ValidationError {
  rowNumber: number;
  field: string;
  value: string;
  message: string;
  code: ValidationErrorCode;
}

/**
 * Result of validating a single record
 */
export interface ValidatedRecord {
  record: RawCustomerRecord;
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Result of validating a batch of records
 */
export interface BatchValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ValidationError[];
  validatedData: ValidatedRecord[];
}

/**
 * Validation mode
 */
export type ValidationMode = 'strict' | 'lenient';

/**
 * Data Validator for raw CSV records.
 * Validates required fields, data types, and value constraints.
 */
export class DataValidator {
  private mode: ValidationMode = 'strict';

  /**
   * Set the validation mode
   */
  setMode(mode: ValidationMode): void {
    this.mode = mode;
  }

  /**
   * Get the current validation mode
   */
  getMode(): ValidationMode {
    return this.mode;
  }

  /**
   * Validate a single record
   */
  validate(record: RawCustomerRecord, rowNumber: number): Result<ValidatedRecord, ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required field validation
    this.validateRequiredFields(record, rowNumber, errors);

    // Type validation
    this.validateTypes(record, rowNumber, errors);

    // Value validation
    this.validateValues(record, rowNumber, errors);

    const isValid = errors.length === 0;

    if (!isValid && this.mode === 'strict') {
      return {
        success: false,
        error: errors,
      };
    }

    return {
      success: true,
      value: {
        record: this.applyDefaults(record),
        isValid,
        errors,
      },
    };
  }

  /**
   * Validate a batch of records
   */
  validateBatch(records: RawCustomerRecord[]): BatchValidationResult {
    const validatedData: ValidatedRecord[] = [];
    const allErrors: ValidationError[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < records.length; i++) {
      const result = this.validate(records[i], i + 1);

      if (result.success) {
        validatedData.push(result.value);
        if (result.value.isValid) {
          validCount++;
        } else {
          invalidCount++;
          allErrors.push(...result.value.errors);
        }
      } else {
        invalidCount++;
        allErrors.push(...result.error);
        validatedData.push({
          record: records[i],
          isValid: false,
          errors: result.error,
        });
      }
    }

    return {
      totalRecords: records.length,
      validRecords: validCount,
      invalidRecords: invalidCount,
      errors: allErrors,
      validatedData,
    };
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(record: RawCustomerRecord, rowNumber: number, errors: ValidationError[]): void {
    const requiredFields: { field: keyof RawCustomerRecord; code: ValidationErrorCode }[] = [
      { field: 'Sirvoy Customer ID', code: 'MISSING_CUSTOMER_ID' },
      { field: 'Account Owner', code: 'MISSING_ACCOUNT_OWNER' },
      { field: 'Status', code: 'MISSING_STATUS' },
      { field: 'Account Type', code: 'MISSING_ACCOUNT_TYPE' },
      { field: 'Created Date', code: 'MISSING_CREATED_DATE' },
    ];

    for (const { field, code } of requiredFields) {
      const value = record[field];
      if (!value || value.trim() === '') {
        errors.push({
          rowNumber,
          field,
          value: value ?? '',
          message: `Required field '${field}' is missing`,
          code,
        });
      }
    }
  }

  /**
   * Validate data types
   */
  private validateTypes(record: RawCustomerRecord, rowNumber: number, errors: ValidationError[]): void {
    // Validate dates
    const dateFields: (keyof RawCustomerRecord)[] = ['Created Date', 'Latest Login'];
    for (const field of dateFields) {
      const value = record[field];
      if (value && !this.isValidDate(value)) {
        errors.push({
          rowNumber,
          field,
          value,
          message: `Invalid date format. Expected DD/MM/YYYY or DD/MM/YYYY, HH:mm`,
          code: 'INVALID_DATE_FORMAT',
        });
      }
    }

    // Validate MRR as number
    const mrrValue = record['MRR (converted)'];
    if (mrrValue && !this.isValidNumber(mrrValue)) {
      errors.push({
        rowNumber,
        field: 'MRR (converted)',
        value: mrrValue,
        message: 'Invalid number format for MRR',
        code: 'INVALID_NUMBER',
      });
    }
  }

  /**
   * Validate value constraints
   */
  private validateValues(record: RawCustomerRecord, rowNumber: number, errors: ValidationError[]): void {
    // Validate Status
    const status = record.Status;
    if (status && !this.isValidStatus(status)) {
      errors.push({
        rowNumber,
        field: 'Status',
        value: status,
        message: `Invalid status. Must be '${CustomerStatus.Active}' or '${CustomerStatus.Inactive}'`,
        code: 'INVALID_STATUS',
      });
    }

    // Validate Account Type
    const accountType = record['Account Type'];
    if (accountType && !this.isValidAccountType(accountType)) {
      errors.push({
        rowNumber,
        field: 'Account Type',
        value: accountType,
        message: `Invalid account type. Must be '${AccountType.Pro}' or '${AccountType.Starter}'`,
        code: 'INVALID_ACCOUNT_TYPE',
      });
    }

    // Validate MRR is non-negative
    const mrrValue = record['MRR (converted)'];
    if (mrrValue && this.isValidNumber(mrrValue)) {
      const mrr = parseFloat(mrrValue);
      if (mrr < 0) {
        errors.push({
          rowNumber,
          field: 'MRR (converted)',
          value: mrrValue,
          message: 'MRR must be non-negative',
          code: 'INVALID_MRR',
        });
      }
    }
  }

  /**
   * Apply default values for missing optional fields (lenient mode)
   */
  private applyDefaults(record: RawCustomerRecord): RawCustomerRecord {
    if (this.mode === 'strict') {
      return record;
    }

    return {
      ...record,
      'MRR (converted)': record['MRR (converted)'] || '0',
      Channels: record.Channels || '',
      Language: record.Language || 'Unknown',
      'Property Type': record['Property Type'] || 'Other',
    };
  }

  /**
   * Check if a string is a valid date
   */
  private isValidDate(value: string): boolean {
    // Expected formats: DD/MM/YYYY or DD/MM/YYYY, HH:mm
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}(, \d{1,2}:\d{2})?$/;
    if (!datePattern.test(value)) {
      return false;
    }

    // Parse and validate the date
    const parts = value.split(',')[0].split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    return true;
  }

  /**
   * Check if a string is a valid number
   */
  private isValidNumber(value: string): boolean {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return !isNaN(parsed);
  }

  /**
   * Check if status is valid
   */
  private isValidStatus(value: string): boolean {
    return value === CustomerStatus.Active || value === CustomerStatus.Inactive;
  }

  /**
   * Check if account type is valid
   */
  private isValidAccountType(value: string): boolean {
    return value === AccountType.Pro || value === AccountType.Starter;
  }
}
