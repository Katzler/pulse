import { CSV_HEADERS, type RawCustomerRecord } from '@shared/types';

import { BaseCsvParser, type BaseCsvParseResult, type HeaderValidationResult } from './BaseCsvParser';

/**
 * Parse error with row/column context for debugging
 */
export interface CsvParseError {
  row: number;
  column?: string;
  message: string;
  code: CsvErrorCode;
}

/**
 * CSV parsing error codes
 */
export type CsvErrorCode =
  | 'INVALID_HEADERS'
  | 'MALFORMED_ROW'
  | 'EMPTY_FILE'
  | 'INVALID_ENCODING';

/**
 * Result of CSV parsing operation
 */
export type CsvParseResult = BaseCsvParseResult<RawCustomerRecord>;

// Re-export for backwards compatibility
export type { HeaderValidationResult };

/**
 * CSV Parser for customer data files.
 * Handles quoted fields, semicolon-separated values within fields,
 * and provides detailed error reporting.
 */
export class CsvParser extends BaseCsvParser<RawCustomerRecord> {
  protected readonly expectedHeaders = CSV_HEADERS;

  /**
   * Map parsed fields to a RawCustomerRecord object
   */
  protected mapToRecord(
    fields: string[],
    headers: string[],
    rowNumber: number
  ): RawCustomerRecord | null {
    if (fields.length !== headers.length) {
      throw new Error(
        `Row ${rowNumber}: Expected ${headers.length} fields but got ${fields.length}`
      );
    }

    // Build a lookup map from header name to field value
    const fieldMap = new Map<string, string>();
    for (let i = 0; i < headers.length; i++) {
      fieldMap.set(headers[i].trim(), fields[i]);
    }

    // Helper to get field value with validation
    const getField = (key: keyof RawCustomerRecord): string => {
      return fieldMap.get(key) ?? '';
    };

    // Validate required fields exist
    const customerId = getField('Sirvoy Customer ID');
    if (!customerId) {
      throw new Error(`Row ${rowNumber}: Missing required field 'Sirvoy Customer ID'`);
    }

    // Construct the record with all required fields explicitly
    const record: RawCustomerRecord = {
      'Account Owner': getField('Account Owner'),
      'Account Name': getField('Account Name'),
      'Latest Login': getField('Latest Login'),
      'Created Date': getField('Created Date'),
      'Last Customer Success Contact Date': getField('Last Customer Success Contact Date'),
      'Billing Country': getField('Billing Country'),
      'Account Type': getField('Account Type'),
      'Language': getField('Language'),
      'Status': getField('Status'),
      'Sirvoy Account Status': getField('Sirvoy Account Status'),
      'Sirvoy Customer ID': customerId,
      'Property Type': getField('Property Type'),
      'MRR (converted) Currency': getField('MRR (converted) Currency'),
      'MRR (converted)': getField('MRR (converted)'),
      'Channels': getField('Channels'),
    };

    return record;
  }
}
