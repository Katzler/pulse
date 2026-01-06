import { CSV_HEADERS, type RawCustomerRecord, type Result } from '@shared/types';

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
export interface CsvParseResult {
  records: RawCustomerRecord[];
  errors: CsvParseError[];
  totalRows: number;
  successfulRows: number;
}

/**
 * Result of header validation
 */
export interface HeaderValidationResult {
  valid: boolean;
  missingHeaders: string[];
  extraHeaders: string[];
  actualHeaders: string[];
}

/**
 * CSV Parser for customer data files.
 * Handles quoted fields, semicolon-separated values within fields,
 * and provides detailed error reporting.
 */
export class CsvParser {
  /**
   * Parse CSV content string into raw customer records
   */
  parse(content: string): Result<CsvParseResult, CsvParseError> {
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: {
          row: 0,
          message: 'CSV file is empty',
          code: 'EMPTY_FILE',
        },
      };
    }

    const lines = this.splitLines(content);
    if (lines.length < 2) {
      return {
        success: false,
        error: {
          row: 0,
          message: 'CSV file must contain a header row and at least one data row',
          code: 'EMPTY_FILE',
        },
      };
    }

    // Parse and validate headers
    const headerLine = lines[0];
    const headers = this.parseRow(headerLine);
    const headerValidation = this.validateHeaders(headers);

    if (!headerValidation.valid) {
      return {
        success: false,
        error: {
          row: 1,
          message: `Invalid CSV headers. Missing: ${headerValidation.missingHeaders.join(', ')}`,
          code: 'INVALID_HEADERS',
        },
      };
    }

    // Parse data rows
    const records: RawCustomerRecord[] = [];
    const errors: CsvParseError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) {
        continue; // Skip empty lines
      }

      try {
        const fields = this.parseRow(line);
        const record = this.mapToRecord(fields, headers, i + 1);
        if (record) {
          records.push(record);
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Failed to parse row',
          code: 'MALFORMED_ROW',
        });
      }
    }

    return {
      success: true,
      value: {
        records,
        errors,
        totalRows: lines.length - 1, // Exclude header
        successfulRows: records.length,
      },
    };
  }

  /**
   * Parse a CSV file asynchronously
   */
  async parseFile(file: File): Promise<Result<CsvParseResult, CsvParseError>> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(this.parse(content));
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: {
            row: 0,
            message: 'Failed to read file',
            code: 'INVALID_ENCODING',
          },
        });
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Validate CSV headers against expected format
   */
  validateHeaders(headers: string[]): HeaderValidationResult {
    const normalizedHeaders = headers.map((h) => h.trim());
    const expectedHeaders = CSV_HEADERS as string[];

    const missingHeaders = expectedHeaders.filter(
      (h) => !normalizedHeaders.includes(h)
    );
    const extraHeaders = normalizedHeaders.filter(
      (h) => !expectedHeaders.includes(h)
    );

    return {
      valid: missingHeaders.length === 0,
      missingHeaders,
      extraHeaders,
      actualHeaders: normalizedHeaders,
    };
  }

  /**
   * Split content into lines, handling different line endings
   */
  private splitLines(content: string): string[] {
    // Normalize line endings and split
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.trim().length > 0);
  }

  /**
   * Parse a single CSV row, handling quoted fields and escaped quotes
   */
  private parseRow(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote
            current += '"';
            i += 2;
          } else {
            // End of quoted field
            inQuotes = false;
            i++;
          }
        } else {
          current += char;
          i++;
        }
      } else {
        if (char === '"') {
          // Start of quoted field
          inQuotes = true;
          i++;
        } else if (char === ',') {
          // Field separator
          fields.push(current.trim());
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
    }

    // Don't forget the last field
    fields.push(current.trim());

    return fields;
  }

  /**
   * Map parsed fields to a RawCustomerRecord object
   */
  private mapToRecord(
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
      'Latest Login': getField('Latest Login'),
      'Created Date': getField('Created Date'),
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
