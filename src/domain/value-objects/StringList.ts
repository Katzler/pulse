import { type Result } from '@shared/types';

/**
 * StringList Value Object
 *
 * A generic immutable list for channels, languages, and similar string collections.
 * Immutable and validated on creation.
 */
export class StringList {
  private readonly _values: readonly string[];

  private constructor(values: readonly string[]) {
    this._values = values;
    Object.freeze(this._values);
    Object.freeze(this);
  }

  /**
   * Factory method to create a StringList
   * @param values - Array of string values
   * @returns Result with StringList or error message
   */
  static create(values: string[]): Result<StringList, string> {
    // Check for null/undefined values
    for (const value of values) {
      if (value === null || value === undefined) {
        return { success: false, error: 'StringList cannot contain null or undefined values' };
      }
    }

    // Trim and filter empty strings
    const cleaned = values.map((v) => v.trim()).filter((v) => v.length > 0);

    return { success: true, value: new StringList(cleaned) };
  }

  /**
   * Returns the number of items in the list
   */
  count(): number {
    return this._values.length;
  }

  /**
   * Check if a specific value exists (case-insensitive)
   */
  has(value: string): boolean {
    const lowerValue = value.toLowerCase();
    return this._values.some((v) => v.toLowerCase() === lowerValue);
  }

  /**
   * Returns true if the list is empty
   */
  isEmpty(): boolean {
    return this._values.length === 0;
  }

  /**
   * Returns a copy of the values array
   */
  toArray(): string[] {
    return [...this._values];
  }

  /**
   * Returns the first item or undefined if empty
   */
  first(): string | undefined {
    return this._values[0];
  }

  /**
   * Check equality with another StringList
   */
  equals(other: StringList): boolean {
    if (this._values.length !== other._values.length) {
      return false;
    }
    return this._values.every((value, index) => value === other._values[index]);
  }
}
