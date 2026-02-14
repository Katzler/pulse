import {
  SENTIMENT_CSV_HEADERS,
  type RawSentimentRecord,
} from '@shared/types';

import type { BaseCsvParseResult } from './BaseCsvParser';
import { BaseCsvParser } from './BaseCsvParser';

/**
 * Result of sentiment CSV parsing operation
 */
export type SentimentCsvParseResult = BaseCsvParseResult<RawSentimentRecord>;

/**
 * CSV Parser for sentiment/chat interaction data files.
 * Handles quoted fields and provides detailed error reporting.
 */
export class SentimentCsvParser extends BaseCsvParser<RawSentimentRecord> {
  protected readonly expectedHeaders = SENTIMENT_CSV_HEADERS;

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
   * Map parsed fields to a RawSentimentRecord object
   */
  protected mapToRecord(
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
