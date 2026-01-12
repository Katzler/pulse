import { type SentimentInteraction } from '@domain/entities';
import { type Result } from '@shared/types';

/**
 * Error when sentiment data is not found
 */
export interface SentimentNotFoundError {
  type: 'SENTIMENT_NOT_FOUND';
  message: string;
  details: { customerId: string };
}

/**
 * Aggregated sentiment data for a customer
 */
export interface CustomerSentimentSummary {
  /** Customer ID */
  customerId: string;
  /** Average sentiment score across all interactions (-1 to +1) */
  averageSentimentScore: number;
  /** Total number of interactions */
  interactionCount: number;
  /** Most recent interaction date */
  latestInteractionDate: Date | null;
  /** All case numbers for reference */
  caseNumbers: string[];
  /** Individual interactions sorted by date (newest first) */
  interactions: SentimentInteraction[];
}

/**
 * Summary of sentiment import operation
 */
export interface SentimentImportSummary {
  /** Total records processed */
  totalProcessed: number;
  /** Successfully imported records */
  successCount: number;
  /** Failed records */
  failedCount: number;
  /** Skipped (duplicate case) records */
  skippedCount: number;
  /** Customer IDs that were updated */
  customersUpdated: string[];
}

/**
 * Read-only repository interface for sentiment queries
 */
export interface SentimentReadRepository {
  /**
   * Get all interactions for a customer
   */
  getByCustomerId(customerId: string): SentimentInteraction[];

  /**
   * Get aggregated sentiment summary for a customer
   */
  getSummaryByCustomerId(
    customerId: string
  ): Result<CustomerSentimentSummary, SentimentNotFoundError>;

  /**
   * Get all customer IDs that have sentiment data
   */
  getCustomerIdsWithSentiment(): string[];

  /**
   * Check if a customer has any sentiment data
   */
  hasSentimentData(customerId: string): boolean;

  /**
   * Get total count of sentiment interactions
   */
  count(): number;
}

/**
 * Write repository interface for sentiment mutations
 */
export interface SentimentWriteRepository {
  /**
   * Add a single sentiment interaction
   */
  add(interaction: SentimentInteraction): Result<void, { message: string }>;

  /**
   * Bulk add multiple sentiment interactions
   */
  addMany(interactions: SentimentInteraction[]): Result<SentimentImportSummary, { message: string }>;

  /**
   * Remove all sentiment data
   */
  clear(): void;

  /**
   * Remove sentiment data for a specific customer
   */
  clearByCustomerId(customerId: string): void;
}

/**
 * Combined repository interface for sentiment data
 */
export interface SentimentRepository
  extends SentimentReadRepository,
    SentimentWriteRepository {}
