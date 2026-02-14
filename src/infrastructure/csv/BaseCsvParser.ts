import type { Result } from '@shared/types';

import type { CsvParseError } from './CsvParser';

/**
 * Generic CSV parse result
 */
export interface BaseCsvParseResult<TRecord> {
  records: TRecord[];
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
 * Base CSV parser with shared parsing logic.
 * Subclasses provide expected headers and record mapping.
 */
export abstract class BaseCsvParser<TRecord> {
  protected abstract readonly expectedHeaders: readonly string[];

  protected abstract mapToRecord(
    fields: string[],
    headers: string[],
    rowNumber: number
  ): TRecord | null;

  /**
   * Parse CSV content string into records
   */
  parse(content: string): Result<BaseCsvParseResult<TRecord>, CsvParseError> {
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

    const records: TRecord[] = [];
    const errors: CsvParseError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) {
        continue;
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
        totalRows: lines.length - 1,
        successfulRows: records.length,
      },
    };
  }

  /**
   * Parse a CSV file asynchronously
   */
  async parseFile(file: File): Promise<Result<BaseCsvParseResult<TRecord>, CsvParseError>> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          resolve({
            success: false,
            error: {
              row: 0,
              message: 'Failed to read file content',
              code: 'INVALID_ENCODING',
            },
          });
          return;
        }
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
    const expected = this.expectedHeaders as readonly string[];

    const missingHeaders = expected.filter(
      (h) => !normalizedHeaders.includes(h)
    );
    const extraHeaders = normalizedHeaders.filter(
      (h) => !expected.includes(h)
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
  protected splitLines(content: string): string[] {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.trim().length > 0);
  }

  /**
   * Parse a single CSV row, handling quoted fields and escaped quotes
   */
  protected parseRow(line: string): string[] {
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
            current += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          current += char;
          i++;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
        } else if (char === ',') {
          fields.push(current.trim());
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
    }

    fields.push(current.trim());

    return fields;
  }
}
