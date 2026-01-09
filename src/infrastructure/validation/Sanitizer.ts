import { type RawCustomerRecord } from '@shared/types';

/**
 * Result of sanitization containing the sanitized value and any warnings
 */
export interface SanitizationResult<T> {
  value: T;
  warnings: string[];
}

/**
 * Sanitizer for preventing XSS and CSV formula injection attacks.
 * All string data from CSV should be passed through this sanitizer
 * before being displayed or stored.
 */
export class Sanitizer {
  /**
   * Sanitize a single string value
   * - Escapes HTML entities
   * - Handles potential CSV formula injection
   */
  sanitizeString(input: string): SanitizationResult<string> {
    const warnings: string[] = [];

    if (!input) {
      return { value: '', warnings };
    }

    let sanitized = input;

    // Check for CSV formula injection patterns
    if (this.detectFormulaInjection(sanitized)) {
      warnings.push(`Potential formula injection detected: "${input.substring(0, 20)}..."`);
      sanitized = this.escapeFormulaInjection(sanitized);
    }

    // Escape HTML entities to prevent XSS
    sanitized = this.escapeHtml(sanitized);

    return { value: sanitized, warnings };
  }

  /**
   * Sanitize an entire raw customer record
   */
  sanitizeRecord(record: RawCustomerRecord): SanitizationResult<RawCustomerRecord> {
    const warnings: string[] = [];

    // Helper to sanitize a field and collect warnings
    const sanitizeField = (key: keyof RawCustomerRecord): string => {
      const result = this.sanitizeString(record[key]);
      if (result.warnings.length > 0) {
        warnings.push(...result.warnings.map((w) => `${key}: ${w}`));
      }
      return result.value;
    };

    // Explicitly construct the sanitized record with all required fields
    const sanitizedRecord: RawCustomerRecord = {
      'Account Owner': sanitizeField('Account Owner'),
      'Account Name': sanitizeField('Account Name'),
      'Latest Login': sanitizeField('Latest Login'),
      'Created Date': sanitizeField('Created Date'),
      'Last Customer Success Contact Date': sanitizeField('Last Customer Success Contact Date'),
      'Billing Country': sanitizeField('Billing Country'),
      'Account Type': sanitizeField('Account Type'),
      'Language': sanitizeField('Language'),
      'Status': sanitizeField('Status'),
      'Sirvoy Account Status': sanitizeField('Sirvoy Account Status'),
      'Sirvoy Customer ID': sanitizeField('Sirvoy Customer ID'),
      'Property Type': sanitizeField('Property Type'),
      'MRR (converted) Currency': sanitizeField('MRR (converted) Currency'),
      'MRR (converted)': sanitizeField('MRR (converted)'),
      'Channels': sanitizeField('Channels'),
    };

    return {
      value: sanitizedRecord,
      warnings,
    };
  }

  /**
   * Sanitize multiple records in batch
   */
  sanitizeBatch(records: RawCustomerRecord[]): SanitizationResult<RawCustomerRecord[]> {
    const allWarnings: string[] = [];
    const sanitizedRecords: RawCustomerRecord[] = [];

    for (let i = 0; i < records.length; i++) {
      const result = this.sanitizeRecord(records[i]);
      sanitizedRecords.push(result.value);
      if (result.warnings.length > 0) {
        allWarnings.push(...result.warnings.map((w) => `Row ${i + 1}: ${w}`));
      }
    }

    return {
      value: sanitizedRecords,
      warnings: allWarnings,
    };
  }

  /**
   * Detect potential CSV formula injection patterns
   */
  private detectFormulaInjection(input: string): boolean {
    const trimmed = input.trim();
    if (trimmed.length === 0) return false;

    // Check for common formula injection prefixes
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];
    const firstChar = trimmed[0];

    // Check if starts with dangerous character
    if (dangerousChars.includes(firstChar)) {
      // Exception: Allow negative numbers (e.g., "-100")
      if (firstChar === '-' && /^-\d/.test(trimmed)) {
        return false;
      }
      // Exception: Allow positive numbers (e.g., "+100")
      if (firstChar === '+' && /^\+\d/.test(trimmed)) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Escape formula injection by prefixing with single quote
   */
  private escapeFormulaInjection(input: string): string {
    // Prefix with single quote to prevent formula execution
    return `'${input}`;
  }

  /**
   * Escape HTML entities to prevent XSS
   */
  private escapeHtml(input: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };

    return input.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
  }
}
