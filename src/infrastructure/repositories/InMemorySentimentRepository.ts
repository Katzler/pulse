import { type SentimentInteraction } from '@domain/entities';
import {
  type CustomerSentimentSummary,
  type SentimentImportSummary,
  type SentimentNotFoundError,
  type SentimentRepository,
} from '@domain/repositories';
import { type Result } from '@shared/types';

/**
 * In-memory implementation of the SentimentRepository.
 * Stores sentiment interactions grouped by customer ID.
 */
export class InMemorySentimentRepository implements SentimentRepository {
  // Map of customer ID to their sentiment interactions
  private readonly interactions: Map<string, SentimentInteraction[]> = new Map();
  // Set of case numbers to prevent duplicates
  private readonly caseNumbers: Set<string> = new Set();

  // ==================== SentimentReadRepository ====================

  /**
   * Get all interactions for a customer
   */
  getByCustomerId(customerId: string): SentimentInteraction[] {
    return this.interactions.get(customerId) ?? [];
  }

  /**
   * Get aggregated sentiment summary for a customer
   */
  getSummaryByCustomerId(
    customerId: string
  ): Result<CustomerSentimentSummary, SentimentNotFoundError> {
    const customerInteractions = this.interactions.get(customerId);

    if (!customerInteractions || customerInteractions.length === 0) {
      return {
        success: false,
        error: {
          type: 'SENTIMENT_NOT_FOUND',
          message: `No sentiment data found for customer: ${customerId}`,
          details: { customerId },
        },
      };
    }

    // Sort by date descending (newest first)
    const sortedInteractions = [...customerInteractions].sort(
      (a, b) => b.interactionDate.getTime() - a.interactionDate.getTime()
    );

    // Calculate average sentiment score
    const totalScore = customerInteractions.reduce(
      (sum, interaction) => sum + interaction.sentimentScore,
      0
    );
    const averageSentimentScore = totalScore / customerInteractions.length;

    // Get all case numbers
    const caseNumbers = customerInteractions.map((i) => i.caseNumber);

    return {
      success: true,
      value: {
        customerId,
        averageSentimentScore,
        interactionCount: customerInteractions.length,
        latestInteractionDate: sortedInteractions[0]?.interactionDate ?? null,
        caseNumbers,
        interactions: sortedInteractions,
      },
    };
  }

  /**
   * Get all customer IDs that have sentiment data
   */
  getCustomerIdsWithSentiment(): string[] {
    return Array.from(this.interactions.keys());
  }

  /**
   * Check if a customer has any sentiment data
   */
  hasSentimentData(customerId: string): boolean {
    const customerInteractions = this.interactions.get(customerId);
    return customerInteractions !== undefined && customerInteractions.length > 0;
  }

  /**
   * Get total count of sentiment interactions
   */
  count(): number {
    let total = 0;
    for (const interactions of this.interactions.values()) {
      total += interactions.length;
    }
    return total;
  }

  // ==================== SentimentWriteRepository ====================

  /**
   * Add a single sentiment interaction
   */
  add(interaction: SentimentInteraction): Result<void, { message: string }> {
    // Check for duplicate case number
    if (this.caseNumbers.has(interaction.caseNumber)) {
      return {
        success: false,
        error: { message: `Duplicate case number: ${interaction.caseNumber}` },
      };
    }

    // Get or create the array for this customer
    const customerInteractions = this.interactions.get(interaction.customerId) ?? [];
    customerInteractions.push(interaction);
    this.interactions.set(interaction.customerId, customerInteractions);
    this.caseNumbers.add(interaction.caseNumber);

    return { success: true, value: undefined };
  }

  /**
   * Bulk add multiple sentiment interactions
   */
  addMany(
    interactions: SentimentInteraction[]
  ): Result<SentimentImportSummary, { message: string }> {
    let successCount = 0;
    let skippedCount = 0;
    const customersUpdated = new Set<string>();

    for (const interaction of interactions) {
      // Skip duplicates
      if (this.caseNumbers.has(interaction.caseNumber)) {
        skippedCount++;
        continue;
      }

      // Get or create the array for this customer
      const customerInteractions = this.interactions.get(interaction.customerId) ?? [];
      customerInteractions.push(interaction);
      this.interactions.set(interaction.customerId, customerInteractions);
      this.caseNumbers.add(interaction.caseNumber);

      successCount++;
      customersUpdated.add(interaction.customerId);
    }

    return {
      success: true,
      value: {
        totalProcessed: interactions.length,
        successCount,
        failedCount: 0,
        skippedCount,
        customersUpdated: Array.from(customersUpdated),
      },
    };
  }

  /**
   * Remove all sentiment data
   */
  clear(): void {
    this.interactions.clear();
    this.caseNumbers.clear();
  }

  /**
   * Remove sentiment data for a specific customer
   */
  clearByCustomerId(customerId: string): void {
    const customerInteractions = this.interactions.get(customerId);
    if (customerInteractions) {
      // Remove case numbers for this customer
      for (const interaction of customerInteractions) {
        this.caseNumbers.delete(interaction.caseNumber);
      }
      this.interactions.delete(customerId);
    }
  }
}
