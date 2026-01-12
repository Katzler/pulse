import { SentimentInteraction, type SentimentInteractionProps } from '@domain/entities';
import {
  type CustomerReadRepository,
  type SentimentImportSummary,
  type SentimentWriteRepository,
} from '@domain/repositories';
import { type RawSentimentRecord, type Result } from '@shared/types';

/**
 * Import error for a specific row
 */
export interface SentimentImportRowError {
  row: number;
  field: string;
  message: string;
}

/**
 * Input for the import sentiment use case
 */
export interface ImportSentimentInput {
  records: RawSentimentRecord[];
}

/**
 * Output from the import sentiment use case
 */
export interface ImportSentimentOutput {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: SentimentImportRowError[];
  customersUpdated: string[];
  customersNotFound: string[];
}

/**
 * Use case for importing sentiment data from CSV.
 * Links sentiment interactions to existing customers.
 */
export class ImportSentimentDataUseCase {
  private readonly sentimentRepository: SentimentWriteRepository;
  private readonly customerRepository: CustomerReadRepository;

  constructor(
    sentimentRepository: SentimentWriteRepository,
    customerRepository: CustomerReadRepository
  ) {
    this.sentimentRepository = sentimentRepository;
    this.customerRepository = customerRepository;
  }

  /**
   * Execute the import use case
   */
  execute(input: ImportSentimentInput): Result<ImportSentimentOutput, string> {
    const { records } = input;
    const errors: SentimentImportRowError[] = [];
    const interactions: SentimentInteraction[] = [];
    const customersNotFound = new Set<string>();
    const customersUpdated = new Set<string>();

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 for 1-based index and header row
      const record = records[i];

      // Validate required fields
      const validationErrors = this.validateRecord(record, rowNumber);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue;
      }

      // Check if customer exists
      const customerId = record['Account: Sirvoy Customer ID'].trim();
      const customerResult = this.customerRepository.getById(customerId as never);

      if (!customerResult.success) {
        // Customer not found - track it but don't fail the import
        customersNotFound.add(customerId);
        errors.push({
          row: rowNumber,
          field: 'Account: Sirvoy Customer ID',
          message: `Customer not found: ${customerId}`,
        });
        continue;
      }

      // Convert to domain entity
      const interactionResult = this.convertToInteraction(record, rowNumber);
      if (!interactionResult.success) {
        errors.push({
          row: rowNumber,
          field: 'conversion',
          message: interactionResult.error,
        });
        continue;
      }

      interactions.push(interactionResult.value);
      customersUpdated.add(customerId);
    }

    // Store in repository
    const storeResult = this.sentimentRepository.addMany(interactions);

    let importedCount = interactions.length;
    if (!storeResult.success) {
      importedCount = 0;
    } else {
      const summary: SentimentImportSummary = storeResult.value;
      importedCount = summary.successCount;
    }

    return {
      success: true,
      value: {
        success: errors.length === 0 && importedCount > 0,
        totalRows: records.length,
        importedCount,
        errorCount: errors.length,
        errors,
        customersUpdated: Array.from(customersUpdated),
        customersNotFound: Array.from(customersNotFound),
      },
    };
  }

  /**
   * Validate a raw record has required fields
   */
  private validateRecord(
    record: RawSentimentRecord,
    row: number
  ): SentimentImportRowError[] {
    const errors: SentimentImportRowError[] = [];

    if (!record['Account: Sirvoy Customer ID']?.trim()) {
      errors.push({
        row,
        field: 'Account: Sirvoy Customer ID',
        message: 'Required field is missing',
      });
    }

    if (!record.Case?.trim()) {
      errors.push({
        row,
        field: 'Case',
        message: 'Required field is missing',
      });
    }

    const sentimentScore = record['Customer Sentiment Score']?.trim();
    if (!sentimentScore) {
      errors.push({
        row,
        field: 'Customer Sentiment Score',
        message: 'Required field is missing',
      });
    } else {
      const score = parseFloat(sentimentScore);
      if (isNaN(score) || score < -1 || score > 1) {
        errors.push({
          row,
          field: 'Customer Sentiment Score',
          message: 'Sentiment score must be between -1 and +1',
        });
      }
    }

    return errors;
  }

  /**
   * Convert a raw record to a SentimentInteraction entity
   */
  private convertToInteraction(
    record: RawSentimentRecord,
    row: number
  ): Result<SentimentInteraction, string> {
    try {
      // Parse sentiment score
      const sentimentScore = parseFloat(record['Customer Sentiment Score'].trim());

      // Parse interaction date
      const interactionDateStr = record['Interaction: Created Date']?.trim();
      const interactionDate = interactionDateStr
        ? this.parseDate(interactionDateStr)
        : new Date();

      if (!interactionDate) {
        return {
          success: false,
          error: `Invalid Interaction Created Date format at row ${row}`,
        };
      }

      const props: SentimentInteractionProps = {
        caseNumber: record.Case.trim(),
        customerId: record['Account: Sirvoy Customer ID'].trim(),
        sentimentScore,
        interactionDate,
      };

      const result = SentimentInteraction.create(props);
      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      return { success: true, value: result.value };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error converting row ${row}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse date from DD/MM/YYYY or DD/MM/YYYY, HH:mm format
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr?.trim()) {
      return null;
    }

    try {
      // Try DD/MM/YYYY, HH:mm format
      const dateTimeMatch = dateStr.match(
        /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})/
      );
      if (dateTimeMatch) {
        const [, day, month, year, hour, minute] = dateTimeMatch;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
      }

      // Try DD/MM/YYYY format
      const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      return null;
    } catch {
      return null;
    }
  }
}
