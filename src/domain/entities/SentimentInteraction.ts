import { type Result } from '@shared/types';

/**
 * Error thrown when SentimentInteraction entity validation fails
 */
export class SentimentInteractionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SentimentInteractionValidationError';
  }
}

/**
 * Properties required to create a SentimentInteraction entity
 */
export interface SentimentInteractionProps {
  /** Salesforce case number */
  caseNumber: string;
  /** Customer ID this interaction belongs to */
  customerId: string;
  /** Sentiment score from -1 (negative) to +1 (positive) */
  sentimentScore: number;
  /** Date of the interaction */
  interactionDate: Date;
}

/**
 * SentimentInteraction entity representing a customer service chat interaction.
 *
 * This entity captures the sentiment analysis of customer service chats,
 * allowing tracking of customer satisfaction over time.
 *
 * @example
 * ```ts
 * const result = SentimentInteraction.create({
 *   caseNumber: 'CS-12345',
 *   customerId: 'CUST-001',
 *   sentimentScore: -0.5,
 *   interactionDate: new Date('2024-01-15'),
 * });
 *
 * if (result.success) {
 *   const interaction = result.value;
 *   console.log(interaction.isNegative()); // true
 * }
 * ```
 */
export class SentimentInteraction {
  readonly caseNumber: string;
  readonly customerId: string;
  readonly sentimentScore: number;
  readonly interactionDate: Date;

  private constructor(
    caseNumber: string,
    customerId: string,
    sentimentScore: number,
    interactionDate: Date
  ) {
    this.caseNumber = caseNumber;
    this.customerId = customerId;
    this.sentimentScore = sentimentScore;
    this.interactionDate = interactionDate;
  }

  /**
   * Factory method to create a SentimentInteraction entity with validation.
   * Returns a Result type for explicit error handling.
   */
  static create(
    props: SentimentInteractionProps
  ): Result<SentimentInteraction, SentimentInteractionValidationError> {
    // Validate case number
    if (!props.caseNumber || props.caseNumber.trim().length === 0) {
      return {
        success: false,
        error: new SentimentInteractionValidationError(
          'Case number must be a non-empty string'
        ),
      };
    }

    // Validate customer ID
    if (!props.customerId || props.customerId.trim().length === 0) {
      return {
        success: false,
        error: new SentimentInteractionValidationError(
          'Customer ID must be a non-empty string'
        ),
      };
    }

    // Validate sentiment score is within range
    if (props.sentimentScore < -1 || props.sentimentScore > 1) {
      return {
        success: false,
        error: new SentimentInteractionValidationError(
          'Sentiment score must be between -1 and +1'
        ),
      };
    }

    const interaction = new SentimentInteraction(
      props.caseNumber.trim(),
      props.customerId.trim(),
      props.sentimentScore,
      props.interactionDate
    );

    return {
      success: true,
      value: interaction,
    };
  }

  /**
   * Returns true if the sentiment is negative (< 0)
   */
  isNegative(): boolean {
    return this.sentimentScore < 0;
  }

  /**
   * Returns true if the sentiment is positive (> 0)
   */
  isPositive(): boolean {
    return this.sentimentScore > 0;
  }

  /**
   * Returns true if the sentiment is neutral (= 0)
   */
  isNeutral(): boolean {
    return this.sentimentScore === 0;
  }

  /**
   * Get sentiment classification
   */
  getClassification(): 'positive' | 'neutral' | 'negative' {
    if (this.sentimentScore > 0.2) return 'positive';
    if (this.sentimentScore < -0.2) return 'negative';
    return 'neutral';
  }

  /**
   * Compares two interactions for equality based on case number.
   */
  equals(other: SentimentInteraction): boolean {
    return this.caseNumber === other.caseNumber;
  }
}
