import {
  SENTIMENT_CSV_HEADERS,
  type RawSentimentRecord,
  type Result,
} from '@shared/types';

import { type CsvParseError, type HeaderValidationResult } from './CsvParser';

/**
 * Result of sentiment CSV parsing operation
 */
export interface SentimentCsvParseResult {
  records: RawSentimentRecord[];
  errors: CsvParseError[];
  totalRows: number;
  successfulRows: number;
}

/**
 * CSV Parser for sentiment/chat interaction data files.
 * Handles quoted fields and provides detailed error reporting.
 */
export class SentimentCsvParser {
  /**
   * Parse CSV content string into raw sentiment records
   */
  parse(content: string): Result<SentimentCsvParseResult, CsvParseError> {
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
    const records: RawSentimentRecord[] = [];
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
  async parseFile(file: File): Promise<Result<SentimentCsvParseResult, CsvParseError>> {
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
    const expectedHeaders = SENTIMENT_CSV_HEADERS as string[];

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
   * Detect if a file is a sentiment CSV based on headers
   */
  static isSentimentCsv(content: string): boolean {
    const firstLine = content.split(/[\r\n]/)[0];
    if (!firstLine) return false;

    const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const requiredHeaders = SENTIMENT_CSV_HEADERS as string[];

    return requiredHeaders.every((h) => headers.includes(h));
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
   * Map parsed fields to a RawSentimentRecord object
   */
  private mapToRecord(
    fields: string[],
    headers: string[],
    rowNumber: number
  ): RawSentimentRecord | null {
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
    const getField = (key: keyof RawSentimentRecord): string => {
      return fieldMap.get(key) ?? '';
    };

    // Validate required fields exist
    const customerId = getField('Account: Sirvoy Customer ID');
    if (!customerId) {
      throw new Error(
        `Row ${rowNumber}: Missing required field 'Account: Sirvoy Customer ID'`
      );
    }

    const caseNumber = getField('Case');
    if (!caseNumber) {
      throw new Error(`Row ${rowNumber}: Missing required field 'Case'`);
    }

    // Construct the record with all required fields
    const record: RawSentimentRecord = {
      'Customer Sentiment Score': getField('Customer Sentiment Score'),
      'Interaction: Created Date': getField('Interaction: Created Date'),
      Case: caseNumber,
      'Account: Sirvoy Customer ID': customerId,
    };

    return record;
  }
}
