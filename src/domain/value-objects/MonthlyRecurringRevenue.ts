import { type Result } from '@shared/types';

/**
 * Currency symbols for formatting
 */
const CURRENCY_FORMATS: Record<string, { prefix?: string; suffix?: string }> = {
  SEK: { suffix: ' kr' },
  USD: { prefix: '$' },
  EUR: { prefix: '€' },
};

/**
 * MonthlyRecurringRevenue Value Object
 *
 * Represents Monthly Recurring Revenue with currency.
 * Immutable and validated on creation.
 */
export class MonthlyRecurringRevenue {
  private readonly _amount: number;
  private readonly _currency: string;

  private constructor(amount: number, currency: string) {
    this._amount = amount;
    this._currency = currency;
    Object.freeze(this);
  }

  /**
   * Factory method to create a MonthlyRecurringRevenue
   * @param amount - The MRR amount (must be >= 0)
   * @param currency - Currency code (e.g., "SEK", "USD")
   * @returns Result with MonthlyRecurringRevenue or error message
   */
  static create(amount: number, currency: string): Result<MonthlyRecurringRevenue, string> {
    if (Number.isNaN(amount)) {
      return { success: false, error: 'MRR amount cannot be NaN' };
    }

    if (amount < 0) {
      return { success: false, error: 'MRR amount must be non-negative' };
    }

    const trimmedCurrency = currency.trim();
    if (trimmedCurrency.length === 0) {
      return { success: false, error: 'Currency code is required' };
    }

    return { success: true, value: new MonthlyRecurringRevenue(amount, trimmedCurrency) };
  }

  /**
   * Get the amount
   */
  get amount(): number {
    return this._amount;
  }

  /**
   * Get the currency code
   */
  get currency(): string {
    return this._currency;
  }

  /**
   * Check if this is a high-value MRR (above 1000)
   */
  isHighValue(): boolean {
    return this._amount > 1000;
  }

  /**
   * Format the MRR as a string with currency symbol
   */
  format(): string {
    const formatted = this._amount.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });

    const currencyFormat = CURRENCY_FORMATS[this._currency];
    if (currencyFormat) {
      if (currencyFormat.prefix) {
        return `${currencyFormat.prefix}${formatted}`;
      }
      if (currencyFormat.suffix) {
        return `${formatted}${currencyFormat.suffix}`;
      }
      return formatted;
    }

    return `${formatted} ${this._currency}`;
  }

  /**
   * Get the amount as a number
   */
  toNumber(): number {
    return this._amount;
  }

  /**
   * Compare with another MRR (same currency only)
   * @returns Result with comparison value (-1, 0, 1) or error if different currencies
   */
  compare(other: MonthlyRecurringRevenue): Result<number, string> {
    if (this._currency !== other._currency) {
      return { success: false, error: 'Cannot compare MRR with different currencies' };
    }

    const diff = this._amount - other._amount;
    return { success: true, value: diff };
  }

  /**
   * Check equality with another MonthlyRecurringRevenue
   */
  equals(other: MonthlyRecurringRevenue): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }
}
